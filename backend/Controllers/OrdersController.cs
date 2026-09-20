using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosProSuite.Api.Data;
using PosProSuite.Api.Models;

namespace PosProSuite.Api.Controllers;

public record OrderItemRequest(int ProductId, int Quantity, string? CustomName = null, decimal? CustomPrice = null);
public record CreateOrderRequest(
    IReadOnlyCollection<OrderItemRequest> Items,
    string? PaymentMethod = "Cash",
    string? CashierName = null,
    string? CashierEmail = null);

public record ReturnItemRequest(int ProductId, int ReturnQuantity);
public record ReturnOrderRequest(IReadOnlyCollection<ReturnItemRequest> ReturnedItems, string? CashierName = null);

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly PosDbContext _context;

    public OrdersController(PosDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult> GetOrders([FromQuery] string? cashier = null, [FromQuery] string? role = null)
    {
        var query = _context.Orders
            .Include(o => o.Items)
            .ThenInclude(i => i.Product)
            .AsQueryable();

        // If not admin, or if specific cashier filter is requested
        if (!string.Equals(role, "admin", StringComparison.OrdinalIgnoreCase))
        {
            if (!string.IsNullOrWhiteSpace(cashier))
            {
                var normalizedCashier = cashier.Trim().ToLower();
                query = query.Where(o =>
                    (o.CashierName != null && o.CashierName.ToLower() == normalizedCashier) ||
                    (o.CashierEmail != null && o.CashierEmail.ToLower() == normalizedCashier));
            }
        }
        else if (!string.IsNullOrWhiteSpace(cashier) && cashier.ToLower() != "all")
        {
            var normalizedCashier = cashier.Trim().ToLower();
            query = query.Where(o =>
                (o.CashierName != null && o.CashierName.ToLower() == normalizedCashier) ||
                (o.CashierEmail != null && o.CashierEmail.ToLower() == normalizedCashier));
        }

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        var result = orders.Select(o => new
        {
            id = o.Id,
            orderNumber = o.OrderNumber,
            status = o.Status,
            total = o.TotalAmount,
            paymentMethod = o.PaymentMethod,
            cashierName = !string.IsNullOrWhiteSpace(o.CashierName) ? o.CashierName : "Staff",
            cashierEmail = o.CashierEmail ?? "",
            createdAt = o.CreatedAt,
            completedAt = o.CompletedAt,
            items = o.Items.Select(i => new
            {
                productId = i.ProductId,
                productName = i.Product != null ? i.Product.Name : $"Item #{i.ProductId}",
                quantity = i.Quantity,
                price = i.UnitPrice
            })
        });

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult> CreateOrder([FromBody] CreateOrderRequest request)
    {
        if (request.Items == null || !request.Items.Any())
            return BadRequest("Order must have at least one item.");

        var existingProductIds = request.Items
            .Where(i => i.ProductId > 0 && i.CustomPrice == null)
            .Select(i => i.ProductId)
            .ToArray();

        var products = await _context.Products
            .Where(p => existingProductIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        var order = new OrderEntity
        {
            CreatedAt = DateTime.Now,
            Status = "Active",
            PaymentMethod = string.IsNullOrWhiteSpace(request.PaymentMethod) ? "Cash" : request.PaymentMethod,
            CashierName = !string.IsNullOrWhiteSpace(request.CashierName) ? request.CashierName.Trim() : "Staff",
            CashierEmail = request.CashierEmail?.Trim() ?? string.Empty,
            OrderNumber = $"TK-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}"
        };

        foreach (var item in request.Items)
        {
            if (item.ProductId > 0 && products.TryGetValue(item.ProductId, out var existingProd) && item.CustomPrice == null)
            {
                order.Items.Add(new OrderItemEntity
                {
                    ProductId = existingProd.Id,
                    Quantity = item.Quantity,
                    UnitPrice = existingProd.Price
                });
            }
            else
            {
                // Custom Open Item sale
                var customProd = new ProductEntity
                {
                    Name = !string.IsNullOrWhiteSpace(item.CustomName) ? item.CustomName : "Custom Open Item",
                    Price = item.CustomPrice ?? 50,
                    CategoryId = "all",
                    Subcategory = "Custom",
                    Image = "📦",
                    Available = true,
                    StockQuantity = 999
                };
                _context.Products.Add(customProd);
                await _context.SaveChangesAsync();

                order.Items.Add(new OrderItemEntity
                {
                    ProductId = customProd.Id,
                    Quantity = item.Quantity,
                    UnitPrice = customProd.Price
                });
            }
        }

        order.TotalAmount = order.Items.Sum(i => i.UnitPrice * i.Quantity);

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        return Ok(new { order.Id, order.OrderNumber, order.TotalAmount, order.PaymentMethod, order.CashierName });
    }

    [HttpPost("{id:int}/complete")]
    public async Task<ActionResult> CompleteOrder(int id)
    {
        var order = await _context.Orders
            .Include(o => o.Items)
            .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null) return NotFound();

        order.Status = "Completed";
        order.CompletedAt = DateTime.UtcNow;

        // Auto-deduct stock for each item sold
        var stockLogs = new List<StockLogEntity>();
        foreach (var item in order.Items)
        {
            var product = await _context.Products.FindAsync(item.ProductId);
            if (product != null && product.Subcategory != "Custom")
            {
                product.StockQuantity = Math.Max(0, product.StockQuantity - item.Quantity);
                if (product.StockQuantity == 0)
                    product.Available = false;

                stockLogs.Add(new StockLogEntity
                {
                    ProductId = item.ProductId,
                    QuantityChange = -item.Quantity,
                    Reason = "Sale",
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        if (stockLogs.Count > 0)
            _context.StockLogs.AddRange(stockLogs);

        await _context.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>Sales Return: Customer returns item(s) from a previous order</summary>
    [HttpPost("{id:int}/return")]
    public async Task<ActionResult> ReturnOrderItems(int id, [FromBody] ReturnOrderRequest request)
    {
        var order = await _context.Orders
            .Include(o => o.Items)
            .ThenInclude(i => i.Product)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order == null) return NotFound("Order not found.");

        if (request.ReturnedItems == null || !request.ReturnedItems.Any())
            return BadRequest("No items selected for return.");

        decimal totalRefundAmount = 0;
        var stockLogs = new List<StockLogEntity>();

        foreach (var retItem in request.ReturnedItems)
        {
            var orderItem = order.Items.FirstOrDefault(i => i.ProductId == retItem.ProductId);
            if (orderItem == null) continue;

            int qtyToReturn = Math.Min(orderItem.Quantity, retItem.ReturnQuantity);
            if (qtyToReturn <= 0) continue;

            // Reduce order item quantity
            orderItem.Quantity -= qtyToReturn;
            decimal refund = qtyToReturn * orderItem.UnitPrice;
            totalRefundAmount += refund;

            // Restore stock back to product inventory
            var product = await _context.Products.FindAsync(retItem.ProductId);
            if (product != null && product.Subcategory != "Custom")
            {
                product.StockQuantity += qtyToReturn;
                product.Available = true;

                stockLogs.Add(new StockLogEntity
                {
                    ProductId = retItem.ProductId,
                    QuantityChange = qtyToReturn,
                    Reason = $"Return (Order #{order.OrderNumber}) by {request.CashierName ?? "Staff"}",
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        // Recalculate order total amount
        order.TotalAmount = order.Items.Sum(i => i.UnitPrice * i.Quantity);
        if (order.Items.All(i => i.Quantity == 0))
        {
            order.Status = "Returned";
        }
        else
        {
            order.Status = "Partially Returned";
        }

        if (stockLogs.Count > 0)
            _context.StockLogs.AddRange(stockLogs);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            order.Id,
            order.OrderNumber,
            refundAmount = totalRefundAmount,
            newOrderTotal = order.TotalAmount,
            order.Status,
            order.CashierName
        });
    }

    [HttpPost("{id:int}/cancel")]
    public async Task<ActionResult> CancelOrder(int id)
    {
        var order = await _context.Orders.FirstOrDefaultAsync(o => o.Id == id);
        if (order == null) return NotFound();

        order.Status = "Cancelled";
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
