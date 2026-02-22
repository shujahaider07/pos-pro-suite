using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosProSuite.Api.Data;
using PosProSuite.Api.Models;

namespace PosProSuite.Api.Controllers;

public record OrderItemRequest(int ProductId, int Quantity);

public record CreateOrderRequest(int TableId, IReadOnlyCollection<OrderItemRequest> Items);

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly PosDbContext _context;

    public OrdersController(PosDbContext context)
    {
        _context = context;
    }

    [HttpPost]
    public async Task<ActionResult> CreateOrder([FromBody] CreateOrderRequest request)
    {
        var table = await _context.Tables.FirstOrDefaultAsync(t => t.Id == request.TableId);
        if (table == null)
        {
            return NotFound();
        }

        var productIds = request.Items.Select(i => i.ProductId).ToArray();
        var products = await _context.Products
            .Where(p => productIds.Contains(p.Id))
            .ToDictionaryAsync(p => p.Id);

        if (products.Count != productIds.Length)
        {
            return BadRequest("One or more products were not found");
        }

        var order = new OrderEntity
        {
            TableId = table.Id,
            CreatedAt = DateTime.UtcNow,
            Status = "Active",
            OrderNumber = $"ORD-{DateTimeOffset.UtcNow.ToUnixTimeSeconds()}"
        };

        foreach (var item in request.Items)
        {
            var product = products[item.ProductId];
            var orderItem = new OrderItemEntity
            {
                ProductId = product.Id,
                Quantity = item.Quantity,
                UnitPrice = product.Price
            };

            order.Items.Add(orderItem);
        }

        order.TotalAmount = order.Items.Sum(i => i.UnitPrice * i.Quantity);

        table.Status = "occupied";
        table.OrderTotal = order.TotalAmount;
        table.ElapsedMinutes = 0;
        table.OrderId = order.OrderNumber;

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            order.Id,
            order.OrderNumber,
            order.TableId,
            order.TotalAmount
        });
    }

    [HttpPost("{id:int}/hold")]
    public async Task<ActionResult> HoldOrder(int id)
    {
        var order = await _context.Orders.Include(o => o.Table).FirstOrDefaultAsync(o => o.Id == id);
        if (order == null)
        {
            return NotFound();
        }

        order.Status = "Held";
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id:int}/cancel")]
    public async Task<ActionResult> CancelOrder(int id)
    {
        var order = await _context.Orders.Include(o => o.Table).FirstOrDefaultAsync(o => o.Id == id);
        if (order == null)
        {
            return NotFound();
        }

        order.Status = "Cancelled";
        if (order.Table != null)
        {
            order.Table.Status = "available";
            order.Table.OrderTotal = null;
            order.Table.ElapsedMinutes = null;
            order.Table.OrderId = null;
        }

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{id:int}/complete")]
    public async Task<ActionResult> CompleteOrder(int id)
    {
        var order = await _context.Orders.Include(o => o.Table).FirstOrDefaultAsync(o => o.Id == id);
        if (order == null)
        {
            return NotFound();
        }

        order.Status = "Completed";
        order.CompletedAt = DateTime.UtcNow;

        if (order.Table != null)
        {
            order.Table.Status = "available";
            order.Table.OrderTotal = null;
            order.Table.ElapsedMinutes = null;
            order.Table.OrderId = null;
        }

        await _context.SaveChangesAsync();

        return NoContent();
    }
}
