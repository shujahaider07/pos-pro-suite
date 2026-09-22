using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosProSuite.Api.Data;
using PosProSuite.Api.Models;

namespace PosProSuite.Api.Controllers;

public record UpdateSettingsRequest(
    string? ShopName,
    string? Tagline,
    string? Phone,
    string? Email,
    string? Address,
    string? Currency,
    string? CurrencySymbol,
    decimal? GstRate,
    int? LowStockThreshold,
    string? ReceiptFooter
);

[ApiController]
[Route("api/[controller]")]
public class SettingsController : ControllerBase
{
    private readonly PosDbContext _context;

    public SettingsController(PosDbContext context)
    {
        _context = context;
    }

    /// <summary>Get current shop settings (GST rate, shop info, etc.)</summary>
    [HttpGet]
    public async Task<ActionResult> GetSettings()
    {
        var settings = await _context.Settings
            .OrderBy(s => s.Id)
            .FirstOrDefaultAsync();

        if (settings == null)
            return NotFound("Settings not found. Please ensure seed data was applied.");

        return Ok(new
        {
            settings.Id,
            settings.ShopName,
            settings.Tagline,
            settings.Phone,
            settings.Email,
            settings.Address,
            settings.Currency,
            settings.CurrencySymbol,
            settings.GstRate,
            settings.LowStockThreshold,
            settings.ReceiptFooter,
            settings.UpdatedAt
        });
    }

    /// <summary>Update shop settings — any field can be updated. GST rate persists to DB.</summary>
    [HttpPut]
    public async Task<ActionResult> UpdateSettings([FromBody] UpdateSettingsRequest request)
    {
        var settings = await _context.Settings
            .OrderBy(s => s.Id)
            .FirstOrDefaultAsync();

        if (settings == null)
            return NotFound("Settings row missing. Please re-seed the database.");

        if (request.ShopName       != null) settings.ShopName          = request.ShopName.Trim();
        if (request.Tagline        != null) settings.Tagline           = request.Tagline.Trim();
        if (request.Phone          != null) settings.Phone             = request.Phone.Trim();
        if (request.Email          != null) settings.Email             = request.Email.Trim();
        if (request.Address        != null) settings.Address           = request.Address.Trim();
        if (request.Currency       != null) settings.Currency          = request.Currency.Trim();
        if (request.CurrencySymbol != null) settings.CurrencySymbol    = request.CurrencySymbol.Trim();

        if (request.GstRate.HasValue)
        {
            if (request.GstRate.Value < 0 || request.GstRate.Value > 100)
                return BadRequest("GST rate must be between 0 and 100.");
            settings.GstRate = request.GstRate.Value;
        }

        if (request.LowStockThreshold.HasValue)
        {
            if (request.LowStockThreshold.Value < 0)
                return BadRequest("Low stock threshold cannot be negative.");
            settings.LowStockThreshold = request.LowStockThreshold.Value;
        }

        if (request.ReceiptFooter != null)
            settings.ReceiptFooter = request.ReceiptFooter.Trim();

        settings.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new
        {
            success = true,
            settings,
            message = "Settings saved successfully."
        });
    }

    /// <summary>Get only the GST rate (lightweight endpoint for POS screens)</summary>
    [HttpGet("gst")]
    public async Task<ActionResult> GetGstRate()
    {
        var gstRate = await _context.Settings
            .OrderBy(s => s.Id)
            .Select(s => s.GstRate)
            .FirstOrDefaultAsync();

        return Ok(new { gstRate = (double)gstRate });
    }
}
