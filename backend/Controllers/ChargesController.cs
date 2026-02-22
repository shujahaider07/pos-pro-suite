using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosProSuite.Api.Data;
using PosProSuite.Api.Models;

namespace PosProSuite.Api.Controllers;

public record ChargeSettingsRequest(bool TaxEnabled, decimal TaxPercent, bool ServiceEnabled, decimal ServicePercent);

[ApiController]
[Route("api/[controller]")]
public class ChargesController : ControllerBase
{
    private readonly PosDbContext _context;

    public ChargesController(PosDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult> Get()
    {
        var settings = await _context.ChargeSettings.FirstOrDefaultAsync();
        if (settings == null)
        {
            settings = new ChargeSettingsEntity
            {
                TaxEnabled = true,
                TaxPercent = 5,
                ServiceEnabled = true,
                ServicePercent = 2
            };
            _context.ChargeSettings.Add(settings);
            await _context.SaveChangesAsync();
        }

        return Ok(new
        {
            taxEnabled = settings.TaxEnabled,
            taxPercent = settings.TaxPercent,
            serviceEnabled = settings.ServiceEnabled,
            servicePercent = settings.ServicePercent
        });
    }

    [HttpPut]
    public async Task<ActionResult> Update([FromBody] ChargeSettingsRequest request)
    {
        if (request.TaxPercent < 0 || request.ServicePercent < 0)
        {
            return BadRequest("Percent values cannot be negative");
        }

        var settings = await _context.ChargeSettings.FirstOrDefaultAsync();
        if (settings == null)
        {
            settings = new ChargeSettingsEntity();
            _context.ChargeSettings.Add(settings);
        }

        settings.TaxEnabled = request.TaxEnabled;
        settings.TaxPercent = request.TaxPercent;
        settings.ServiceEnabled = request.ServiceEnabled;
        settings.ServicePercent = request.ServicePercent;

        await _context.SaveChangesAsync();

        return NoContent();
    }
}

