using System.Text.Json;
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

    public record CreateCategoryDto(string Name, string? Icon, object? Subcategories);
    public record UpdateCategoryDto(string? Name, string? Icon, object? Subcategories);

    private static List<string> NormalizeSubcategories(object? subcategories)
    {
        if (subcategories == null)
            return new List<string>();

        if (subcategories is JsonElement je)
        {
            switch (je.ValueKind)
            {
                case JsonValueKind.Array:
                    return je.EnumerateArray()
                        .Select(e => e.GetString())
                        .Where(s => !string.IsNullOrWhiteSpace(s))
                        .Select(s => s!.Trim())
                        .ToList();
                case JsonValueKind.String:
                    var str = je.GetString();
                    if (string.IsNullOrWhiteSpace(str))
                        return new List<string>();
                    return str.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                        .ToList();
            }
        }

        if (subcategories is string s)
        {
            if (string.IsNullOrWhiteSpace(s))
                return new List<string>();
            return s.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
                .ToList();
        }

        if (subcategories is IEnumerable<string> enumerable)
        {
            return enumerable.Where(s => !string.IsNullOrWhiteSpace(s)).Select(s => s.Trim()).ToList();
        }

        return new List<string>();
    }

    [HttpPost]
    public async Task<ActionResult> CreateCategory([FromBody] CreateCategoryDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Name))
            ModelState.AddModelError(nameof(dto.Name), "Category name is required.");

        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var categoryId = dto.Name.Trim().ToLower().Replace(" ", "-");
        var existing = await _context.Categories.FindAsync(categoryId);
        if (existing != null)
        {
            return BadRequest("Category already exists");
        }

        var cat = new CategoryEntity
        {
            Id = categoryId,
            Name = dto.Name.Trim(),
            Icon = string.IsNullOrWhiteSpace(dto.Icon) ? "🏪" : dto.Icon.Trim()
        };
        _context.Categories.Add(cat);

        var subs = NormalizeSubcategories(dto.Subcategories);
        foreach (var sub in subs)
        {
            _context.Subcategories.Add(new SubcategoryEntity { Name = sub, CategoryId = categoryId });
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
            category.Name = dto.Name.Trim();

        if (!string.IsNullOrWhiteSpace(dto.Icon))
            category.Icon = dto.Icon.Trim();

        if (dto.Subcategories != null)
        {
            var incoming = NormalizeSubcategories(dto.Subcategories)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var existingNames = category.Subcategories
                .Select(s => s.Name)
                .ToHashSet(StringComparer.OrdinalIgnoreCase);

            var toRemove = category.Subcategories
                .Where(s => !incoming.Contains(s.Name))
                .ToList();

            foreach (var rem in toRemove)
                _context.Subcategories.Remove(rem);

            var toAdd = incoming.Except(existingNames, StringComparer.OrdinalIgnoreCase);
            foreach (var name in toAdd)
                _context.Subcategories.Add(new SubcategoryEntity { Name = name, CategoryId = category.Id });
        }

        await _context.SaveChangesAsync();
        return Ok(new { id = category.Id, name = category.Name, icon = category.Icon });
    }
}

