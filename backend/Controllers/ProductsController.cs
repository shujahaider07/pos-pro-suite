using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosProSuite.Api.Data;
using PosProSuite.Api.Models;

namespace PosProSuite.Api.Controllers;

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

            // Yahan humne Name ke sath-sath Barcode par bhi filter laga diya hai
            query = query.Where(p =>
                p.Name.ToLower().Contains(lowered) ||
                (!string.IsNullOrEmpty(p.Barcode) && p.Barcode.ToLower().Contains(lowered))
            );
        }

        var products = await query
            .OrderBy(p => p.Name)
            .ToListAsync();

        return Ok(products.Select(p => new
        {
            id = p.Id,
            name = p.Name,
            price = p.Price,
            category = p.CategoryId,
            categoryId = p.CategoryId,
            subcategory = p.Subcategory,
            image = p.Image,
            available = p.Available,
            stockQuantity = p.StockQuantity,
            barcode = p.Barcode
        }));
    }

    [HttpPost]
    public async Task<ActionResult<ProductEntity>> CreateProduct([FromBody] ProductEntity product)
    {
        _context.Products.Add(product);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetProducts), new { id = product.Id }, product);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<ProductEntity>> UpdateProduct(int id, [FromBody] ProductEntity product)
    {
        if (product == null) return BadRequest();

        if (product.Id != 0 && product.Id != id)
            return BadRequest("Product ID in body does not match URL ID.");

        var existing = await _context.Products.FindAsync(id);
        if (existing == null) return NotFound();

        // Ensure the incoming entity has the correct ID
        product.Id = id;

        // Copy values from incoming product to the tracked entity
        _context.Entry(existing).CurrentValues.SetValues(product);

        await _context.SaveChangesAsync();
        return Ok(product);
    }

    [HttpPatch("{id:int}/stock")]
    public async Task<ActionResult> ToggleStock(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();

        product.Available = !product.Available;
        await _context.SaveChangesAsync();
        return Ok(product);
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> DeleteProduct(int id)
    {
        var product = await _context.Products.FindAsync(id);
        if (product == null) return NotFound();

        _context.Products.Remove(product);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

