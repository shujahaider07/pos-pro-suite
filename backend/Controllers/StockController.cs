using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosProSuite.Api.Data;
using PosProSuite.Api.Models;

namespace PosProSuite.Api.Controllers;

public record AddStockRequest(int Quantity, string? Reason = "StockIn");
public record AddStockRequestV2(int ProductId, int QuantityToAdd, string? Reason = "StockIn");

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

    /// <summary>Add stock to a product (productId in body — used by frontend AdminDashboard)</summary>
    [HttpPost("add")]
    public async Task<ActionResult> AddStockV2([FromBody] AddStockRequestV2 request)
    {
        if (request.QuantityToAdd <= 0)
            return BadRequest("QuantityToAdd must be greater than 0.");

        var product = await _context.Products.FindAsync(request.ProductId);
        if (product == null) return NotFound($"Product with id {request.ProductId} not found.");

        product.StockQuantity += request.QuantityToAdd;
        if (product.StockQuantity > 0)
            product.Available = true;

        _context.StockLogs.Add(new StockLogEntity
        {
            ProductId = request.ProductId,
            QuantityChange = request.QuantityToAdd,
            Reason = string.IsNullOrWhiteSpace(request.Reason) ? "StockIn" : request.Reason,
            CreatedAt = DateTime.UtcNow
        });

        await _context.SaveChangesAsync();
        return Ok(new { product.Id, product.Name, product.StockQuantity });
    }

    /// <summary>Add stock to a product (productId in URL route)</summary>
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
    public async Task<ActionResult> GetStockLogs([FromQuery] int? productId, [FromQuery] int take = 50, [FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null)
    {
        var query = _context.StockLogs
            .Include(s => s.Product)
            .AsQueryable();

        if (productId.HasValue)
            query = query.Where(s => s.ProductId == productId.Value);

        if (fromDate.HasValue)
            query = query.Where(s => s.CreatedAt >= fromDate.Value);

        if (toDate.HasValue)
            query = query.Where(s => s.CreatedAt <= toDate.Value);

        var logs = await query
            .OrderByDescending(s => s.CreatedAt)
            .Take(take)
            .Select(s => new
            {
                s.Id,
                s.ProductId,
                productName = s.Product != null ? s.Product.Name : $"Product #{s.ProductId}",
                productImage = s.Product != null ? s.Product.Image : "📦",
                s.QuantityChange,
                s.Reason,
                s.CreatedAt
            })
            .ToListAsync();

        return Ok(logs);
    }

    /// <summary>Inventory report for a product with date range — opening, in, out, net, current stock + logs</summary>
    [HttpGet("report")]
    public async Task<ActionResult> GetStockReport([FromQuery] int productId, [FromQuery] DateTime? fromDate = null, [FromQuery] DateTime? toDate = null)
    {
        var product = await _context.Products.FindAsync(productId);
        if (product == null)
            return NotFound($"Product with id {productId} not found.");

        var startOfDay = fromDate.HasValue ? fromDate.Value.Date : DateTime.UtcNow.Date.AddDays(-7);
        var endOfDay = toDate.HasValue ? toDate.Value.Date.AddDays(1).AddTicks(-1) : DateTime.UtcNow;

        // Opening stock = sum of all changes before fromDate
        var openingStock = await _context.StockLogs
            .Where(s => s.ProductId == productId && s.CreatedAt < startOfDay)
            .SumAsync(s => (int?)s.QuantityChange) ?? 0;

        // Logs in range
        var logsQuery = _context.StockLogs
            .Where(s => s.ProductId == productId && s.CreatedAt >= startOfDay && s.CreatedAt <= endOfDay);

        var totalIn = await logsQuery.Where(s => s.QuantityChange > 0).SumAsync(s => (int?)s.QuantityChange) ?? 0;
        var totalOut = await logsQuery.Where(s => s.QuantityChange < 0).SumAsync(s => (int?)s.QuantityChange) ?? 0;

        var logs = await logsQuery
            .OrderByDescending(s => s.CreatedAt)
            .Select(s => new
            {
                s.Id,
                s.QuantityChange,
                s.Reason,
                s.CreatedAt,
                type = s.QuantityChange > 0 ? "In" : "Out"
            })
            .ToListAsync();

        return Ok(new
        {
            productId = product.Id,
            productName = product.Name,
            productImage = product.Image,
            productType = product.ProductType,
            fromDate = startOfDay,
            toDate = endOfDay,
            openingStock,
            totalIn,
            totalOut,
            netChange = totalIn + totalOut,
            currentStock = product.StockQuantity,
            logs
        });
    }
}
