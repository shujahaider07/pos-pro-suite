using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosProSuite.Api.Data;
using PosProSuite.Api.Models;

namespace PosProSuite.Api.Controllers;

public record AddStockRequest(int Quantity, string? Reason = "StockIn");

[ApiController]
[Route("api/[controller]")]
public class StockController : ControllerBase
{
    private readonly PosDbContext _context;

    public StockController(PosDbContext context)
    {
        _context = context;
    }

    /// <summary>All products with current stock levels</summary>
    [HttpGet]
    public async Task<ActionResult> GetStock()
    {
        var products = await _context.Products
            .OrderBy(p => p.Name)
            .Select(p => new
            {
                p.Id,
                p.Name,
                p.Price,
                p.CategoryId,
                p.Image,
                p.Available,
                p.StockQuantity,
                p.Barcode,
                isLowStock = p.StockQuantity <= 5
            })
            .ToListAsync();

        return Ok(products);
    }

    /// <summary>Low stock products (qty <= threshold)</summary>
    [HttpGet("low")]
    public async Task<ActionResult> GetLowStock([FromQuery] int threshold = 5)
    {
        var products = await _context.Products
            .Where(p => p.StockQuantity <= threshold)
            .OrderBy(p => p.StockQuantity)
            .Select(p => new { p.Id, p.Name, p.StockQuantity, p.Image })
            .ToListAsync();

        return Ok(products);
    }

    /// <summary>Add stock to a product (when new stock arrives)</summary>
    [HttpPost("{id:int}/add")]
    public async Task<ActionResult> AddStock(int id, [FromBody] AddStockRequest request)
    {
        if (request.Quantity <= 0)
            return BadRequest("Quantity must be greater than 0.");

        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();

        product.StockQuantity += request.Quantity;
        if (product.StockQuantity > 0)
            product.Available = true;

        _context.StockLogs.Add(new StockLogEntity
        {
            ProductId = id,
            QuantityChange = request.Quantity,
            Reason = string.IsNullOrWhiteSpace(request.Reason) ? "StockIn" : request.Reason,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok(new { product.Id, product.Name, product.StockQuantity });
    }

    /// <summary>Stock history log</summary>
    [HttpGet("logs")]
    public async Task<ActionResult> GetStockLogs([FromQuery] int? productId, [FromQuery] int take = 50)
    {
        var query = _context.StockLogs
            .Include(s => s.Product)
            .AsQueryable();

        if (productId.HasValue)
            query = query.Where(s => s.ProductId == productId.Value);

        var logs = await query
            .OrderByDescending(s => s.CreatedAt)
            .Take(take)
            .Select(s => new
            {
                s.Id,
                productName = s.Product != null ? s.Product.Name : $"Product #{s.ProductId}",
                s.QuantityChange,
                s.Reason,
                s.CreatedAt
            })
            .ToListAsync();

        return Ok(logs);
    }
}
