using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosProSuite.Api.Data;

namespace PosProSuite.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class CategoriesController : ControllerBase
{
    private readonly PosDbContext _context;

    public CategoriesController(PosDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult> GetCategories()
    {
        var categories = await _context.Categories
            .Include(c => c.Subcategories)
            .OrderBy(c => c.Id)
            .ToListAsync();

        var result = categories.Select(c => new
        {
            id = c.Id,
            name = c.Name,
            icon = c.Icon,
            subcategories = c.Subcategories
                .OrderBy(s => s.Id)
                .Select(s => s.Name)
                .ToArray()
        });

        return Ok(result);
    }
}

