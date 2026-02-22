using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosProSuite.Api.Data;
using PosProSuite.Api.Models;

namespace PosProSuite.Api.Controllers;

public record ProductCreateRequest(string Name, decimal Price, string CategoryId, string? Subcategory, string Image, bool Available);

public record ProductUpdateRequest(string Name, decimal Price, string CategoryId, string? Subcategory, string Image, bool Available);

[ApiController]
[Route("api/[controller]")]
public class ProductsController : ControllerBase
{
    private readonly PosDbContext _context;

    public ProductsController(PosDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult> GetProducts([FromQuery] string? categoryId, [FromQuery] string? subcategory, [FromQuery] string? search)
    {
        var query = _context.Products.AsQueryable();

        if (!string.IsNullOrWhiteSpace(categoryId) && categoryId != "all")
        {
            query = query.Where(p => p.CategoryId == categoryId);
        }

        if (!string.IsNullOrWhiteSpace(subcategory))
        {
            query = query.Where(p => p.Subcategory == subcategory);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var lowered = search.ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(lowered));
        }

        var products = await query
            .OrderBy(p => p.Name)
            .ToListAsync();

        return Ok(products);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult> GetProduct(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
        {
            return NotFound();
        }

        return Ok(product);
    }

    [HttpPost]
    public async Task<ActionResult> CreateProduct([FromBody] ProductCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Name is required");
        }

        if (request.Price < 0)
        {
            return BadRequest("Price cannot be negative");
        }

        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == request.CategoryId);
        if (!categoryExists)
        {
            return BadRequest("Invalid category");
        }

        ProductEntity product = new()
        {
            Name = request.Name,
            Price = request.Price,
            CategoryId = request.CategoryId,
            Subcategory = request.Subcategory,
            Image = request.Image,
            Available = request.Available
        };

        _context.Products.Add(product);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetProduct), new { id = product.Id }, product);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult> UpdateProduct(int id, [FromBody] ProductUpdateRequest request)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
        {
            return NotFound();
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Name is required");
        }

        if (request.Price < 0)
        {
            return BadRequest("Price cannot be negative");
        }

        var categoryExists = await _context.Categories.AnyAsync(c => c.Id == request.CategoryId);
        if (!categoryExists)
        {
            return BadRequest("Invalid category");
        }

        product.Name = request.Name;
        product.Price = request.Price;
        product.CategoryId = request.CategoryId;
        product.Subcategory = request.Subcategory;
        product.Image = request.Image;
        product.Available = request.Available;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> DeleteProduct(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null)
        {
            return NotFound();
        }

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
