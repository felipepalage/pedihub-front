using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PediHub.Api.Contracts;
using PediHub.Api.Data;
using PediHub.Api.Extensions;
using PediHub.Api.Models;

namespace PediHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class OrdersController(PediHubDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<OrderListItemDto>>> GetAll([FromQuery] string? filter, [FromQuery] string? search, CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var today = DateTimeOffset.UtcNow.Date;

        var query = dbContext.Orders
            .AsNoTracking()
            .Where(x => x.MerchantId == merchantId);

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalized = search.Trim().ToLowerInvariant();
            query = query.Where(x =>
                x.CustomerName.ToLower().Contains(normalized) ||
                x.Number.ToString().Contains(normalized));
        }

        query = filter?.Trim().ToLowerInvariant() switch
        {
            "hoje" => query.Where(x => x.OrderedAt >= today),
            "pendentes" => query.Where(x => x.Status == "novo" || x.Status == "aceito" || x.Status == "preparando" || x.Status == "saiu_entrega"),
            "finalizados" => query.Where(x => x.Status == "finalizado"),
            "cancelados" => query.Where(x => x.Status == "cancelado"),
            _ => query,
        };

        var orders = await query
            .OrderByDescending(x => x.OrderedAt)
            .Select(x => new OrderListItemDto(
                x.Id,
                x.Number,
                x.Channel,
                x.CustomerName,
                x.Total,
                x.OrderedAt.ToLocalTime().ToString("HH:mm"),
                x.Status,
                x.Payment))
            .ToListAsync(cancellationToken);

        return Ok(orders);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<OrderDetailDto>> GetById(Guid id, CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var order = await dbContext.Orders
            .AsNoTracking()
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.MerchantId == merchantId && x.Id == id, cancellationToken);

        if (order is null)
        {
            return NotFound();
        }

        return Ok(new OrderDetailDto(
            order.Id,
            order.Number,
            order.Channel,
            order.CustomerName,
            order.Total,
            order.OrderedAt.ToLocalTime().ToString("HH:mm"),
            order.Status,
            order.Payment,
            order.Address,
            order.Items.Select(item => new OrderItemDto(item.Name, item.Quantity, item.UnitPrice)).ToList()));
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<OrderDetailDto>> UpdateStatus(Guid id, UpdateOrderStatusRequest request, CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        if (!DomainRules.OrderStatuses.Contains(request.Status))
        {
            return BadRequest(new { message = "Status invalido." });
        }

        var order = await dbContext.Orders
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.MerchantId == merchantId && x.Id == id, cancellationToken);

        if (order is null)
        {
            return NotFound();
        }

        order.Status = request.Status;
        order.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new OrderDetailDto(
            order.Id,
            order.Number,
            order.Channel,
            order.CustomerName,
            order.Total,
            order.OrderedAt.ToLocalTime().ToString("HH:mm"),
            order.Status,
            order.Payment,
            order.Address,
            order.Items.Select(item => new OrderItemDto(item.Name, item.Quantity, item.UnitPrice)).ToList()));
    }

    [HttpPost("{id:guid}/advance")]
    public async Task<ActionResult<OrderDetailDto>> Advance(Guid id, CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var order = await dbContext.Orders
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.MerchantId == merchantId && x.Id == id, cancellationToken);

        if (order is null)
        {
            return NotFound();
        }

        order.Status = order.Status switch
        {
            "novo" => "aceito",
            "aceito" => "preparando",
            "preparando" => "saiu_entrega",
            "saiu_entrega" => "finalizado",
            _ => order.Status,
        };
        order.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new OrderDetailDto(
            order.Id,
            order.Number,
            order.Channel,
            order.CustomerName,
            order.Total,
            order.OrderedAt.ToLocalTime().ToString("HH:mm"),
            order.Status,
            order.Payment,
            order.Address,
            order.Items.Select(item => new OrderItemDto(item.Name, item.Quantity, item.UnitPrice)).ToList()));
    }
}
