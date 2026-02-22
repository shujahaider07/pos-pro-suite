using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosProSuite.Api.Data;
using PosProSuite.Api.Models;

namespace PosProSuite.Api.Controllers;

public record CategoryCreateRequest(string Id, string Name, string Icon);

public record CategoryUpdateRequest(string Name, string Icon);

public record SubcategoryCreateRequest(string Name);

public record SubcategoryUpdateRequest(string Name);

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

    [HttpGet("manage")]
    public async Task<ActionResult> GetCategoriesForManagement()
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
                .Select(s => new { id = s.Id, name = s.Name })
                .ToArray()
        });

        return Ok(result);
    }

    [HttpPost]
    public async Task<ActionResult> CreateCategory([FromBody] CategoryCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Id) || string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Id and Name are required");
        }

        var exists = await _context.Categories.AnyAsync(c => c.Id == request.Id);
        if (exists)
        {
            return Conflict("Category with this Id already exists");
        }

        CategoryEntity category = new()
        {
            Id = request.Id,
            Name = request.Name,
            Icon = request.Icon
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCategories), new { id = category.Id }, category);
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateCategory(string id, [FromBody] CategoryUpdateRequest request)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category == null)
        {
            return NotFound();
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Name is required");
        }

        category.Name = request.Name;
        category.Icon = request.Icon;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> DeleteCategory(string id)
    {
        var category = await _context.Categories
            .Include(c => c.Subcategories)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
        {
            return NotFound();
        }

        var hasProducts = await _context.Products.AnyAsync(p => p.CategoryId == id);
        if (hasProducts)
        {
            return BadRequest("Cannot delete category with products");
        }

        _context.Subcategories.RemoveRange(category.Subcategories);
        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("{categoryId}/subcategories")]
    public async Task<ActionResult> CreateSubcategory(string categoryId, [FromBody] SubcategoryCreateRequest request)
    {
        var category = await _context.Categories.FindAsync(categoryId);
        if (category == null)
        {
            return NotFound("Category not found");
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Name is required");
        }

        SubcategoryEntity subcategory = new()
        {
            Name = request.Name,
            CategoryId = categoryId
        };

        _context.Subcategories.Add(subcategory);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetCategories), new { id = categoryId }, subcategory);
    }

    [HttpPut("subcategories/{id:int}")]
    public async Task<ActionResult> UpdateSubcategory(int id, [FromBody] SubcategoryUpdateRequest request)
    {
        var subcategory = await _context.Subcategories.FindAsync(id);
        if (subcategory == null)
        {
            return NotFound();
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Name is required");
        }

        subcategory.Name = request.Name;
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("subcategories/{id:int}")]
    public async Task<ActionResult> DeleteSubcategory(int id)
    {
        var subcategory = await _context.Subcategories.FindAsync(id);
        if (subcategory == null)
        {
            return NotFound();
        }

        _context.Subcategories.Remove(subcategory);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
