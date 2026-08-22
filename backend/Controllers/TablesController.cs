using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosProSuite.Api.Data;
using PosProSuite.Api.Models;

namespace PosProSuite.Api.Controllers;

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
    public async Task<ActionResult<TableEntity>> CreateTable([FromBody] TableEntity table)
    {
        _context.Tables.Add(table);
        await _context.SaveChangesAsync();
        return CreatedAtAction(nameof(GetTable), new { id = table.Id }, table);
    }

    [HttpPatch("{id:int}/status")]
    public async Task<ActionResult> UpdateTableStatus(int id, [FromBody] string status)
    {
        var table = await _context.Tables.FindAsync(id);
        if (table == null) return NotFound();

        table.Status = status.ToLower();
        await _context.SaveChangesAsync();
        return Ok(table);
    }
}
