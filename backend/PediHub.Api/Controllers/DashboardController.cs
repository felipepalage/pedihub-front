using System.Globalization;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PediHub.Api.Contracts;
using PediHub.Api.Data;
using PediHub.Api.Extensions;

namespace PediHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class DashboardController(PediHubDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<DashboardSummaryDto>> Get(CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var merchant = await dbContext.Merchants.FirstAsync(x => x.Id == merchantId, cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var todayStart = now.Date;
        var yesterdayStart = todayStart.AddDays(-1);

        var orders = await dbContext.Orders
            .AsNoTracking()
            .Where(x => x.MerchantId == merchantId)
            .OrderByDescending(x => x.OrderedAt)
            .ToListAsync(cancellationToken);

        var products = await dbContext.Products
            .AsNoTracking()
            .Where(x => x.MerchantId == merchantId)
            .ToListAsync(cancellationToken);

        var integrations = await dbContext.Integrations
            .AsNoTracking()
            .Where(x => x.MerchantId == merchantId)
            .ToListAsync(cancellationToken);

        var todayOrders = orders.Where(x => x.OrderedAt >= todayStart).ToList();
        var yesterdayOrders = orders.Where(x => x.OrderedAt >= yesterdayStart && x.OrderedAt < todayStart).ToList();

        var pendingCount = todayOrders.Count(x => x.Status is "novo" or "aceito" or "preparando" or "saiu_entrega");
        var deliveredCount = todayOrders.Count(x => x.Status == "finalizado");
        var cancelledCount = todayOrders.Count(x => x.Status == "cancelado");

        var todayRevenue = todayOrders.Where(x => x.Status != "cancelado").Sum(x => x.Total);
        var yesterdayRevenue = yesterdayOrders.Where(x => x.Status != "cancelado").Sum(x => x.Total);

        var avgTicketToday = todayOrders.Count == 0 ? 0m : todayRevenue / todayOrders.Count;
        var avgTicketYesterday = yesterdayOrders.Count == 0 ? 0m : yesterdayRevenue / yesterdayOrders.Count;

        var recentOrders = orders
            .Take(5)
            .Select(MapOrderList)
            .ToList();

        var salesByDay = Enumerable.Range(0, 7)
            .Select(offset =>
            {
                var day = todayStart.AddDays(-(6 - offset));
                var revenue = orders
                    .Where(x => x.OrderedAt >= day && x.OrderedAt < day.AddDays(1) && x.Status != "cancelado")
                    .Sum(x => x.Total);

                return new SalesPointDto(
                    CultureInfo.GetCultureInfo("pt-BR").DateTimeFormat.GetAbbreviatedDayName(day.DayOfWeek),
                    revenue);
            })
            .ToList();

        var hours = new[] { 10, 11, 12, 13, 14, 18, 19, 20, 21 };
        var ordersByHour = hours
            .Select(hour => new HourPointDto($"{hour}h", todayOrders.Count(x => x.OrderedAt.Hour == hour)))
            .ToList();

        var totalOrdersForMix = orders.Count;
        var channelMix = new[] { "ifood", "whatsapp", "site", "balcao" }
            .Select(channel =>
            {
                var count = orders.Count(x => x.Channel == channel);
                var percent = totalOrdersForMix == 0 ? 0 : Math.Round((decimal)count * 100 / totalOrdersForMix, 2);
                return new ChannelMixDto(ChannelLabel(channel), percent, channel);
            })
            .ToList();

        var alerts = new List<DashboardAlertDto>();
        foreach (var product in products.Where(x => x.Stock <= 5).OrderBy(x => x.Stock).Take(2))
        {
            alerts.Add(new DashboardAlertDto($"Estoque baixo: {product.Name} ({product.Stock} un.)", "warning"));
        }

        var oldestPending = todayOrders
            .Where(x => x.Status is "novo" or "aceito")
            .OrderBy(x => x.OrderedAt)
            .FirstOrDefault();

        if (oldestPending is not null)
        {
            var minutes = Math.Max(1, (int)Math.Round((now - oldestPending.OrderedAt).TotalMinutes));
            alerts.Add(new DashboardAlertDto($"Pedido #{oldestPending.Number} aguardando aceite ha {minutes} min", "destructive"));
        }

        if (integrations.All(x => x.Type != "ifood" || x.Status != "ativo"))
        {
            alerts.Add(new DashboardAlertDto("iFood ainda nao conectado.", "info"));
        }

        var summary = new DashboardSummaryDto(
            merchant.CompanyName,
            merchant.Plan,
            new DashboardStatsDto(
                todayOrders.Count,
                todayRevenue,
                avgTicketToday,
                pendingCount,
                deliveredCount,
                cancelledCount,
                PercentDelta(todayOrders.Count, yesterdayOrders.Count),
                PercentDelta(todayRevenue, yesterdayRevenue),
                PercentDelta(avgTicketToday, avgTicketYesterday)),
            salesByDay,
            ordersByHour,
            channelMix,
            alerts,
            recentOrders);

        return Ok(summary);
    }

    private static decimal PercentDelta(decimal current, decimal previous)
    {
        if (previous == 0)
        {
            return current == 0 ? 0 : 100;
        }

        return Math.Round(((current - previous) / previous) * 100, 2);
    }

    private static OrderListItemDto MapOrderList(Models.Order order)
    {
        return new OrderListItemDto(
            order.Id,
            order.Number,
            order.Channel,
            order.CustomerName,
            order.Total,
            order.OrderedAt.ToLocalTime().ToString("HH:mm"),
            order.Status,
            order.Payment);
    }

    private static string ChannelLabel(string channel) =>
        channel switch
        {
            "ifood" => "iFood",
            "whatsapp" => "WhatsApp",
            "site" => "Site proprio",
            "balcao" => "Balcao",
            _ => channel,
        };
}
