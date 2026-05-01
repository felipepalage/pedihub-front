using System.Globalization;
using System.Text;
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
public sealed class ReportsController(PediHubDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<ReportsResponseDto>> Get(CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var orders = await dbContext.Orders
            .AsNoTracking()
            .Include(x => x.Items)
            .Where(x => x.MerchantId == merchantId)
            .ToListAsync(cancellationToken);

        var now = DateTimeOffset.UtcNow;
        var monthStart = new DateTimeOffset(now.Year, now.Month, 1, 0, 0, 0, TimeSpan.Zero);
        var monthOrders = orders.Where(x => x.OrderedAt >= monthStart).ToList();
        var revenueMonth = monthOrders.Where(x => x.Status != "cancelado").Sum(x => x.Total);
        var avgTicket = monthOrders.Count == 0 ? 0m : revenueMonth / monthOrders.Count;
        var cancelRate = monthOrders.Count == 0 ? 0m : Math.Round((decimal)monthOrders.Count(x => x.Status == "cancelado") * 100 / monthOrders.Count, 2);

        var summary = new List<ReportSummaryBlockDto>
        {
            new("Faturamento mensal", Currency(revenueMonth)),
            new("Ticket medio", Currency(avgTicket)),
            new("Cancelamentos", $"{cancelRate:0.##}%"),
            new("Pedidos no mes", monthOrders.Count.ToString("0", CultureInfo.InvariantCulture)),
        };

        var monthlySales = Enumerable.Range(0, 6)
            .Select(offset =>
            {
                var start = monthStart.AddMonths(-(5 - offset));
                var end = start.AddMonths(1);
                var value = orders
                    .Where(x => x.OrderedAt >= start && x.OrderedAt < end && x.Status != "cancelado")
                    .Sum(x => x.Total);
                return new MonthlyPointDto(start.ToString("MMM", CultureInfo.GetCultureInfo("pt-BR")), value);
            })
            .ToList();

        var hours = Enumerable.Range(0, 24)
            .Where(hour => monthOrders.Any(x => x.OrderedAt.Hour == hour))
            .DefaultIfEmpty(11)
            .Distinct()
            .OrderBy(x => x)
            .Select(hour => new HourPointDto($"{hour}h", monthOrders.Count(x => x.OrderedAt.Hour == hour)))
            .ToList();

        var topProducts = monthOrders
            .SelectMany(x => x.Items)
            .GroupBy(x => x.Name)
            .Select(group => new TopProductDto(group.Key, group.Sum(x => x.Quantity), group.Sum(x => x.Quantity * x.UnitPrice)))
            .OrderByDescending(x => x.TotalSold)
            .Take(10)
            .ToList();

        var weeklySales = Enumerable.Range(0, 7)
            .Select(offset =>
            {
                var day = now.Date.AddDays(-(6 - offset));
                var value = orders
                    .Where(x => x.OrderedAt >= day && x.OrderedAt < day.AddDays(1) && x.Status != "cancelado")
                    .Sum(x => x.Total);
                return new SalesPointDto(CultureInfo.GetCultureInfo("pt-BR").DateTimeFormat.GetAbbreviatedDayName(day.DayOfWeek), value);
            })
            .ToList();

        return Ok(new ReportsResponseDto(summary, monthlySales, hours, topProducts, weeklySales));
    }

    [HttpGet("export/csv")]
    public async Task<IActionResult> ExportCsv(CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var orders = await dbContext.Orders
            .AsNoTracking()
            .Include(x => x.Items)
            .Where(x => x.MerchantId == merchantId)
            .OrderByDescending(x => x.OrderedAt)
            .ToListAsync(cancellationToken);

        var csv = new StringBuilder();
        csv.AppendLine("Numero,Data,Canal,Cliente,Status,Pagamento,Total,Itens");
        foreach (var order in orders)
        {
            var items = string.Join(" | ", order.Items.Select(item => $"{item.Quantity}x {item.Name}"));
            csv.AppendLine($"{order.Number},{order.OrderedAt:yyyy-MM-dd HH:mm},{order.Channel},{Escape(order.CustomerName)},{order.Status},{order.Payment},{order.Total:0.00},{Escape(items)}");
        }

        return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", "pedihub-relatorio.csv");
    }

    private static string Escape(string value)
    {
        return $"\"{value.Replace("\"", "\"\"")}\"";
    }

    private static string Currency(decimal value)
    {
        return value.ToString("C", CultureInfo.GetCultureInfo("pt-BR"));
    }
}
