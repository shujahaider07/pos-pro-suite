using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PosProSuite.Api.Data;

namespace PosProSuite.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly PosDbContext _context;

    public DashboardController(PosDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult> GetDashboard()
    {
        var now = DateTime.UtcNow;
        var today = now.Date;
        var weekStart = today.AddDays(-(int)today.DayOfWeek);
        var monthStart = new DateTime(today.Year, today.Month, 1);

        var completedOrders = _context.Orders.Where(o => o.Status == "Completed");

        var todayOrders = completedOrders.Where(o => o.CreatedAt >= today);
        var weekOrders = completedOrders.Where(o => o.CreatedAt >= weekStart);
        var monthOrders = completedOrders.Where(o => o.CreatedAt >= monthStart);

        var todayRevenue = await todayOrders.SumAsync(o => (decimal?)o.TotalAmount) ?? 0;
        var weekRevenue = await weekOrders.SumAsync(o => (decimal?)o.TotalAmount) ?? 0;
        var monthRevenue = await monthOrders.SumAsync(o => (decimal?)o.TotalAmount) ?? 0;
        var totalOrders = await completedOrders.CountAsync();

        var avgOrderValue = totalOrders > 0
            ? await completedOrders.AverageAsync(o => o.TotalAmount)
            : 0;

        var topItems = await _context.OrderItems
            .Include(i => i.Product)
            .Where(i => i.Order != null && i.Order.Status == "Completed")
            .GroupBy(i => i.Product!.Name)
            .Select(g => new
            {
                name = g.Key,
                quantity = g.Sum(i => i.Quantity),
                revenue = g.Sum(i => i.UnitPrice * i.Quantity)
            })
            .OrderByDescending(x => x.revenue)
            .Take(5)
            .ToListAsync();

        var salesTrend = await completedOrders
            .GroupBy(o => o.CreatedAt.Date)
            .Select(g => new
            {
                day = g.Key,
                sales = g.Sum(o => o.TotalAmount)
            })
            .OrderBy(x => x.day)
            .ToListAsync();

        var categoryPerformance = await _context.OrderItems
            .Include(i => i.Product)
            .Where(i => i.Order != null && i.Order.Status == "Completed")
            .GroupBy(i => i.Product!.CategoryId)
            .Select(g => new
            {
                name = g.Key,
                value = g.Sum(i => i.UnitPrice * i.Quantity)
            })
            .ToListAsync();

        var totalCategoryValue = categoryPerformance.Sum(c => c.value);
        IEnumerable<object> categoryPercentages;
        if (totalCategoryValue > 0)
        {
            categoryPercentages = categoryPerformance.Select(c => new
            {
                name = c.name,
                value = Math.Round(c.value * 100 / totalCategoryValue, 2)
            });
        }
        else
        {
            categoryPercentages = Array.Empty<object>();
        }

        var employeePerformance = await completedOrders
            .Where(o => o.CreatedBy != null && o.CreatedBy != "")
            .GroupBy(o => o.CreatedBy)
            .Select(g => new
            {
                name = g.Key!,
                orders = g.Count(),
                revenue = g.Sum(o => o.TotalAmount)
            })
            .OrderByDescending(x => x.revenue)
            .ToListAsync();

        var result = new
        {
            todayRevenue,
            weeklyRevenue = weekRevenue,
            monthlyRevenue = monthRevenue,
            totalOrders,
            avgOrderValue,
            topItems,
            salesTrend = salesTrend.Select(x => new
            {
                day = x.day.ToString("ddd"),
                sales = x.sales
            }),
            categoryPerformance = categoryPercentages,
            employeePerformance
        };

        return Ok(result);
    }
}
