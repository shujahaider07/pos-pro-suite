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
    public async Task<ActionResult> GetDashboard(
        [FromQuery] string? cashier = null,
        [FromQuery] string? role = null,
        [FromQuery] DateTime? fromDate = null,
        [FromQuery] DateTime? toDate = null)
    {
        var now = DateTime.UtcNow;
        var today = now.Date;
        var weekStart = today.AddDays(-(int)today.DayOfWeek);
        var monthStart = new DateTime(today.Year, today.Month, 1);

        var query = _context.Orders.Where(o => o.Status == "Completed");

        if (!string.Equals(role, "admin", StringComparison.OrdinalIgnoreCase))
        {
            if (!string.IsNullOrWhiteSpace(cashier))
            {
                var normalized = cashier.Trim().ToLower();
                query = query.Where(o =>
                    (o.CashierName != null && o.CashierName.ToLower() == normalized) ||
                    (o.CashierEmail != null && o.CashierEmail.ToLower() == normalized));
            }
        }
        else if (!string.IsNullOrWhiteSpace(cashier) && cashier.ToLower() != "all")
        {
            var normalized = cashier.Trim().ToLower();
            query = query.Where(o =>
                (o.CashierName != null && o.CashierName.ToLower() == normalized) ||
                (o.CashierEmail != null && o.CashierEmail.ToLower() == normalized));
        }

        // Date range filter — apply to all date-bounded metrics
        var hasCustomDate = fromDate.HasValue || toDate.HasValue;
        var dateFrom = fromDate?.Date ?? DateTime.MinValue;
        var dateTo = toDate?.Date ?? DateTime.MaxValue;
        if (hasCustomDate)
            query = query.Where(o => o.CreatedAt.Date >= dateFrom && o.CreatedAt.Date <= dateTo);

        var completedOrders = query;

        var todayOrders   = completedOrders.Where(o => o.CreatedAt >= today);
        var weekOrders    = completedOrders.Where(o => o.CreatedAt >= weekStart);
        var monthOrders   = completedOrders.Where(o => o.CreatedAt >= monthStart);

        var todayRevenue   = await todayOrders.SumAsync(o => (decimal?)o.TotalAmount) ?? 0;
        var weekRevenue    = await weekOrders.SumAsync(o => (decimal?)o.TotalAmount) ?? 0;
        var monthRevenue   = await monthOrders.SumAsync(o => (decimal?)o.TotalAmount) ?? 0;
        var totalOrders    = await completedOrders.CountAsync();
        var todayOrderCount = await todayOrders.CountAsync();

        var avgOrderValue = totalOrders > 0
            ? await completedOrders.AverageAsync(o => o.TotalAmount)
            : 0;

        // Cashier sales breakdown — filter by date when custom range is set
        var allOrdersForBreakdown = _context.Orders.AsQueryable();
        if (hasCustomDate)
            allOrdersForBreakdown = allOrdersForBreakdown.Where(o => o.CreatedAt.Date >= dateFrom && o.CreatedAt.Date <= dateTo);

        var cashierPerformance = await allOrdersForBreakdown
            .GroupBy(o => string.IsNullOrWhiteSpace(o.CashierName) ? "Staff" : o.CashierName)
            .Select(g => new
            {
                cashier = g.Key,
                totalSales = g.Where(o => o.Status == "Completed").Sum(o => o.TotalAmount),
                completedOrders = g.Count(o => o.Status == "Completed"),
                returnedOrders = g.Count(o => o.Status == "Returned" || o.Status == "Partially Returned")
            })
            .OrderByDescending(c => c.totalSales)
            .ToListAsync();

        // Top selling items — respect date filter
        var orderItemsBase = _context.OrderItems
            .Include(i => i.Product)
            .Include(i => i.Order)
            .Where(i => i.Order != null && i.Order.Status == "Completed")
            .AsQueryable();
        if (hasCustomDate)
            orderItemsBase = orderItemsBase.Where(i => i.Order!.CreatedAt.Date >= dateFrom && i.Order!.CreatedAt.Date <= dateTo);

        var topItems = await orderItemsBase
            .GroupBy(i => i.Product!.Name)
            .Select(g => new
            {
                name     = g.Key,
                quantity = g.Sum(i => i.Quantity),
                revenue  = g.Sum(i => i.UnitPrice * i.Quantity)
            })
            .OrderByDescending(x => x.revenue)
            .Take(5)
            .ToListAsync();

        // Sales trend (last 7 days or custom range span)
        var salesTrend = await completedOrders
            .GroupBy(o => o.CreatedAt.Date)
            .Select(g => new { day = g.Key, sales = g.Sum(o => o.TotalAmount) })
            .OrderBy(x => x.day)
            .ToListAsync();

        // Category performance — respect date filter, include revenue + units sold
        var categoryPerformanceRaw = await orderItemsBase
            .GroupBy(i => i.Product!.CategoryId)
            .Select(g => new
            {
                name = g.Key,
                revenue = g.Sum(i => i.UnitPrice * i.Quantity),
                unitsSold = g.Sum(i => i.Quantity),
                orderCount = g.Select(i => i.OrderId).Distinct().Count()
            })
            .OrderByDescending(c => c.revenue)
            .ToListAsync();

        var totalCatRevenue = categoryPerformanceRaw.Sum(c => c.revenue);
        var categoryPerformanceWithDetails = categoryPerformanceRaw.Select(c => new
        {
            name = c.name,
            revenue = c.revenue,
            unitsSold = c.unitsSold,
            orderCount = c.orderCount,
            share = totalCatRevenue > 0 ? Math.Round(c.revenue * 100 / totalCatRevenue, 2) : 0
        }).ToList();

        var categoryPercentages = categoryPerformanceWithDetails
            .Select(c => new { name = c.name, value = c.share })
            .ToList();

        // Payment method breakdown (Cash vs Digital)
        var paymentBreakdown = await completedOrders
            .GroupBy(o => o.PaymentMethod)
            .Select(g => new { method = g.Key, count = g.Count(), total = g.Sum(o => o.TotalAmount) })
            .ToListAsync();

        // Stock alerts
        var lowStockCount = await _context.Products.CountAsync(p => p.StockQuantity <= 5);
        var lowStockItems = await _context.Products
            .Where(p => p.StockQuantity <= 5)
            .OrderBy(p => p.StockQuantity)
            .Select(p => new { p.Id, p.Name, p.StockQuantity, p.Image })
            .Take(5)
            .ToListAsync();

        var outOfStockCount = await _context.Products.CountAsync(p => p.StockQuantity == 0);

        return Ok(new
        {
            todayRevenue,
            weeklyRevenue  = weekRevenue,
            monthlyRevenue = monthRevenue,
            totalOrders,
            todayOrderCount,
            avgOrderValue,
            cashierPerformance,
            topItems,
            salesTrend = salesTrend.Select(x => new { day = x.day.ToString("ddd"), sales = x.sales }),
            categoryPerformance = categoryPercentages,
            categorySalesBreakdown = categoryPerformanceWithDetails,
            paymentBreakdown,
            lowStockCount,
            lowStockItems,
            outOfStockCount
        });
    }
}
