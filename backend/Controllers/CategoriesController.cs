using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosProSuite.Api.Data;
using PosProSuite.Api.Models;

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

    public record CreateCategoryDto(string Name, string Icon, string? Subcategories);
    public record UpdateCategoryDto(string? Name, string? Icon, string? Subcategories);

    [HttpPost]
    public async Task<ActionResult> CreateCategory([FromBody] CreateCategoryDto dto)
    {
        var categoryId = dto.Name.ToLower().Replace(" ", "-");
        var existing = await _context.Categories.FindAsync(categoryId);
        if (existing != null)
        {
            return BadRequest("Category already exists");
        }

        var cat = new CategoryEntity
        {
            Id = categoryId,
            Name = dto.Name,
            Icon = string.IsNullOrWhiteSpace(dto.Icon) ? "🍽️" : dto.Icon
        };
        _context.Categories.Add(cat);

        if (!string.IsNullOrWhiteSpace(dto.Subcategories))
        {
            var subs = dto.Subcategories.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            foreach (var sub in subs)
            {
                _context.Subcategories.Add(new SubcategoryEntity { Name = sub, CategoryId = categoryId });
            }
        }

        await _context.SaveChangesAsync();
        return Ok(new { id = cat.Id, name = cat.Name, icon = cat.Icon });
    }

    [HttpPut("{id}")]
    public async Task<ActionResult> UpdateCategory(string id, [FromBody] UpdateCategoryDto dto)
    {
        var category = await _context.Categories
            .Include(c => c.Subcategories)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (category == null)
            return NotFound();

        if (!string.IsNullOrWhiteSpace(dto.Name))
            category.Name = dto.Name;

        if (!string.IsNullOrWhiteSpace(dto.Icon))
            category.Icon = dto.Icon;

        if (dto.Subcategories != null)
        {
            var incoming = dto.Subcategories
                .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var existingNames = category.Subcategories
                .Select(s => s.Name)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            // Remove subcategories not present in incoming list
            var toRemove = category.Subcategories
                .Where(s => !incoming.Contains(s.Name))
                .ToList();

            foreach (var rem in toRemove)
                _context.Subcategories.Remove(rem);

            // Add new subcategories that don't already exist
            var toAdd = incoming.Except(existingNames, StringComparer.OrdinalIgnoreCase);
            foreach (var name in toAdd)
                _context.Subcategories.Add(new SubcategoryEntity { Name = name, CategoryId = category.Id });
        }

        await _context.SaveChangesAsync();
        return Ok(new { id = category.Id, name = category.Name, icon = category.Icon });
    }
}

