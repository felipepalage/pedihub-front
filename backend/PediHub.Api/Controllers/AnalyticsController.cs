using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PediHub.Api.Contracts;
using PediHub.Api.Data;
using PediHub.Api.Extensions;
using System.Security.Claims;

namespace PediHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class AnalyticsController(PediHubDbContext dbContext) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<ActionResult<AnalyticsSummaryDto>> GetSummary(CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var today = DateTimeOffset.UtcNow.Date;

        var totalRevenue = await dbContext.Orders
            .Where(x => x.MerchantId == merchantId && x.Status == "finalizado")
            .SumAsync(x => x.Total, cancellationToken);

        var todayOrders = await dbContext.Orders
            .Where(x => x.MerchantId == merchantId && x.OrderedAt >= today)
            .CountAsync(cancellationToken);

        var topProductsData = await dbContext.OrderItems
            .Where(x => x.Order.MerchantId == merchantId && x.Order.Status == "finalizado")
            .GroupBy(x => x.Name)
            .Select(g => new
            {
                Name = g.Key,
                TotalSold = g.Sum(x => x.Quantity),
                TotalRevenue = g.Sum(x => x.Quantity * x.UnitPrice)
            })
            .OrderByDescending(x => x.TotalSold)
            .Take(5)
            .ToListAsync(cancellationToken);

        var topProducts = topProductsData
            .Select(x => new TopProductDto(x.Name, x.TotalSold, x.TotalRevenue))
            .ToList();

        return Ok(new AnalyticsSummaryDto(totalRevenue, todayOrders, topProducts));
    }
}

public record AnalyticsSummaryDto(decimal TotalRevenue, int TodayOrders, List<TopProductDto> TopProducts);
