using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosProSuite.Api.Data;
using PosProSuite.Api.Models;

namespace PosProSuite.Api.Controllers;

public record TableCreateRequest(string Name, int Capacity);

public record TableUpdateRequest(string Name, int Capacity);

[ApiController]
[Route("api/[controller]")]
public class TablesController : ControllerBase
{
    private readonly PosDbContext _context;

    public TablesController(PosDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TableEntity>>> GetTables()
    {
        var tables = await _context.Tables
            .OrderBy(t => t.Id)
            .ToListAsync();

        var now = DateTime.UtcNow;

        var heldItemsByTable = await _context.OrderItems
            .Where(i => i.Order != null && i.Order.Status == "Held")
            .GroupBy(i => i.Order!.TableId)
            .Select(g => new
            {
                TableId = g.Key,
                Count = g.Sum(i => i.Quantity)
            })
            .ToDictionaryAsync(x => x.TableId, x => x.Count);

        var activeOrders = await _context.Orders
            .Where(o => o.Status == "Active" || o.Status == "Held")
            .GroupBy(o => o.TableId)
            .Select(g => new
            {
                TableId = g.Key,
                CreatedAt = g.Max(o => o.CreatedAt)
            })
            .ToDictionaryAsync(x => x.TableId, x => x.CreatedAt);

        foreach (var table in tables)
        {
            table.HoldItems = heldItemsByTable.TryGetValue(table.Id, out var holdCount)
                ? holdCount
                : 0;

            if (table.Status == "occupied" && activeOrders.TryGetValue(table.Id, out var createdAt))
            {
                var minutes = (int)Math.Floor((now - createdAt).TotalMinutes);
                if (minutes < 0)
                {
                    minutes = 0;
                }

                table.ElapsedMinutes = minutes;
            }
            else
            {
                table.ElapsedMinutes = null;
            }
        }

        return Ok(tables);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TableEntity>> GetTable(int id)
    {
        var table = await _context.Tables.FirstOrDefaultAsync(t => t.Id == id);
        if (table == null)
        {
            return NotFound();
        }

        return Ok(table);
    }

    [HttpPost]
    public async Task<ActionResult<TableEntity>> CreateTable([FromBody] TableCreateRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Name is required");
        }

        if (request.Capacity <= 0)
        {
            return BadRequest("Capacity must be greater than zero");
        }

        TableEntity table = new()
        {
            Name = request.Name,
            Capacity = request.Capacity,
            Status = "available",
            OrderTotal = null,
            ElapsedMinutes = null,
            OrderId = null
        };

        _context.Tables.Add(table);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetTable), new { id = table.Id }, table);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult> UpdateTable(int id, [FromBody] TableUpdateRequest request)
    {
        var table = await _context.Tables.FirstOrDefaultAsync(t => t.Id == id);
        if (table == null)
        {
            return NotFound();
        }

        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest("Name is required");
        }

        if (request.Capacity <= 0)
        {
            return BadRequest("Capacity must be greater than zero");
        }

        table.Name = request.Name;
        table.Capacity = request.Capacity;

        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<ActionResult> DeleteTable(int id)
    {
        var table = await _context.Tables.FirstOrDefaultAsync(t => t.Id == id);
        if (table == null)
        {
            return NotFound();
        }

        var hasOrders = await _context.Orders.AnyAsync(o => o.TableId == id);
        if (hasOrders)
        {
            return BadRequest("Cannot delete table that has orders");
        }

        _context.Tables.Remove(table);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
