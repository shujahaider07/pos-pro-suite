using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosProSuite.Api.Data;
using PosProSuite.Api.Models;

namespace PosProSuite.Api.Controllers;

public record OrderItemRequest(int ProductId, int Quantity);
public record CreateOrderRequest(IReadOnlyCollection<OrderItemRequest> Items, string? PaymentMethod = "Cash");

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
    public async Task<ActionResult> GetOrders()
    {
        var orders = await _context.Orders
            .Include(o => o.Items)
            .ThenInclude(i => i.Product)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        var result = orders.Select(o => new
        {
            id = o.Id,
            orderNumber = o.OrderNumber,
            status = o.Status,
            total = o.TotalAmount,
            paymentMethod = o.PaymentMethod,
            createdAt = o.CreatedAt,
            completedAt = o.CompletedAt,
            items = o.Items.Select(i => new
            {
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

        var productIds = request.Items.Select(i => i.ProductId).ToArray();
        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        if (products.Count != productIds.Length)
            return BadRequest("One or more products were not found.");

        var order = new OrderEntity
        {
            CreatedAt = DateTime.Now,
            Status = "Active",
            PaymentMethod = string.IsNullOrWhiteSpace(request.PaymentMethod) ? "Cash" : request.PaymentMethod,
            OrderNumber = $"TK-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}"
        };

        foreach (var item in request.Items)
        {
            var product = products[item.ProductId];
            order.Items.Add(new OrderItemEntity
            {
                ProductId = product.Id,
                Quantity = item.Quantity,
                UnitPrice = product.Price
            });
        }

        order.TotalAmount = order.Items.Sum(i => i.UnitPrice * i.Quantity);

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        return Ok(new { order.Id, order.OrderNumber, order.TotalAmount, order.PaymentMethod });
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
            if (product != null)
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

        _context.StockLogs.AddRange(stockLogs);
        await _context.SaveChangesAsync();

        return NoContent();
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
