using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosProSuite.Api.Data;
using PosProSuite.Api.Models;

namespace PosProSuite.Api.Controllers;

public record CreateRecipeItemRequest(int ProductId, int IngredientId, decimal Quantity);
public record UpdateRecipeItemRequest(decimal Quantity);

[ApiController]
[Route("api/[controller]")]
public class RecipeController : ControllerBase
{
    private readonly PosDbContext _context;

    public RecipeController(PosDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult> GetAllRecipeProductIds()
    {
        var productIds = await _context.RecipeItems
            .Select(r => r.ProductId)
            .Distinct()
            .ToListAsync();

        return Ok(productIds);
    }

    [HttpGet("{productId:int}")]
    public async Task<ActionResult> GetRecipe(int productId)
    {
        var recipe = await _context.RecipeItems
            .Where(r => r.ProductId == productId)
            .Include(r => r.Ingredient)
            .Select(r => new
            {
                r.Id,
                r.ProductId,
                r.IngredientId,
                r.Quantity,
                ingredientName = r.Ingredient != null ? r.Ingredient.Name : $"Ingredient #{r.IngredientId}",
                ingredientImage = r.Ingredient != null ? r.Ingredient.Image : "📦",
                ingredientStock = r.Ingredient != null ? r.Ingredient.StockQuantity : 0
            })
            .OrderBy(r => r.Id)
            .ToListAsync();

        return Ok(recipe);
    }

    [HttpPost]
    public async Task<ActionResult> AddRecipeItem([FromBody] CreateRecipeItemRequest request)
    {
        if (request.Quantity <= 0)
            return BadRequest("Quantity must be greater than 0.");

        if (request.ProductId == request.IngredientId)
            return BadRequest("A product cannot be an ingredient of itself.");

        var product = await _context.Products.FindAsync(request.ProductId);
        if (product == null) return NotFound($"Product with id {request.ProductId} not found.");

        var ingredient = await _context.Products.FindAsync(request.IngredientId);
        if (ingredient == null) return NotFound($"Ingredient with id {request.IngredientId} not found.");

        var existing = await _context.RecipeItems
            .FirstOrDefaultAsync(r => r.ProductId == request.ProductId && r.IngredientId == request.IngredientId);

        if (existing != null)
        {
            existing.Quantity += request.Quantity;
            await _context.SaveChangesAsync();
            return Ok(existing);
        }

        var recipeItem = new RecipeItemEntity
        {
            ProductId = request.ProductId,
            IngredientId = request.IngredientId,
            Quantity = request.Quantity
        };

        _context.RecipeItems.Add(recipeItem);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetRecipe), new { productId = request.ProductId }, recipeItem);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult> UpdateRecipeItem(int id, [FromBody] UpdateRecipeItemRequest request)
    {
        if (request.Quantity <= 0)
            return BadRequest("Quantity must be greater than 0.");

        var recipeItem = await _context.RecipeItems.FindAsync(id);
        if (recipeItem == null) return NotFound();

        recipeItem.Quantity = request.Quantity;
        await _context.SaveChangesAsync();

        return Ok(recipeItem);
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> DeleteRecipeItem(int id)
    {
        var recipeItem = await _context.RecipeItems.FindAsync(id);
        if (recipeItem == null) return NotFound();

        _context.RecipeItems.Remove(recipeItem);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
