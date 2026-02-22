using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosProSuite.Api.Data;

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
            query = query.Where(p => p.Name.ToLower().Contains(lowered));
        }

        var products = await query
            .OrderBy(p => p.Name)
            .ToListAsync();

        return Ok(products);
    }
}

