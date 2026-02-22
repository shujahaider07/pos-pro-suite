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
}
