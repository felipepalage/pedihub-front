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
public sealed class IntegrationsController(PediHubDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<IntegrationDto>>> GetAll(CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var items = await dbContext.Integrations
            .AsNoTracking()
            .Where(x => x.MerchantId == merchantId)
            .OrderBy(x => x.Name)
            .Select(x => new IntegrationDto(x.Type, x.Name, x.Description, x.Status, x.Emoji))
            .ToListAsync(cancellationToken);

        return Ok(items);
    }

    [HttpPost("{id}/connect")]
    public async Task<ActionResult<IntegrationDto>> Connect(string id, CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var integration = await dbContext.Integrations.FirstOrDefaultAsync(x => x.MerchantId == merchantId && x.Type == id, cancellationToken);
        if (integration is null)
        {
            return NotFound();
        }

        if (integration.Status == "em_breve")
        {
            return BadRequest(new { message = "Esta integracao ainda nao esta disponivel." });
        }

        integration.Status = "ativo";
        integration.ConnectedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new IntegrationDto(integration.Type, integration.Name, integration.Description, integration.Status, integration.Emoji));
    }

    [HttpPost("{id}/disconnect")]
    public async Task<ActionResult<IntegrationDto>> Disconnect(string id, CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var integration = await dbContext.Integrations.FirstOrDefaultAsync(x => x.MerchantId == merchantId && x.Type == id, cancellationToken);
        if (integration is null)
        {
            return NotFound();
        }

        if (integration.Status == "em_breve")
        {
            return BadRequest(new { message = "Esta integracao ainda nao esta disponivel." });
        }

        integration.Status = "disponivel";
        integration.ConnectedAt = null;
        await dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new IntegrationDto(integration.Type, integration.Name, integration.Description, integration.Status, integration.Emoji));
    }
}
