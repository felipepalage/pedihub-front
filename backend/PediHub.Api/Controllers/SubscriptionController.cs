using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PediHub.Api.Contracts;
using PediHub.Api.Data;

namespace PediHub.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public sealed class SubscriptionController(PediHubDbContext dbContext) : ControllerBase
{
    [HttpPost("activate")]
    public async Task<IActionResult> ActivateToken([FromBody] ActivateTokenRequest request, CancellationToken cancellationToken)
    {
        var merchantIdClaim = User.Claims.FirstOrDefault(x => x.Type == "merchant_id")?.Value;
        if (!Guid.TryParse(merchantIdClaim, out var merchantId))
        {
            return Unauthorized();
        }

        var code = request.Code.Trim();
        var token = await dbContext.ActivationTokens.FirstOrDefaultAsync(x => x.Code == code, cancellationToken);

        if (token is null || token.IsUsed)
        {
            return BadRequest(new { message = "Token inválido ou já utilizado." });
        }

        var merchant = await dbContext.Merchants.FirstOrDefaultAsync(x => x.Id == merchantId, cancellationToken);
        if (merchant is null)
        {
            return NotFound(new { message = "Estabelecimento não encontrado." });
        }

        token.IsUsed = true;
        token.UsedAt = DateTimeOffset.UtcNow;
        token.UsedByMerchantId = merchantId;

        // If the merchant is already expired, start counting from today. Otherwise, add to the current ValidUntil.
        var baseDate = merchant.ValidUntil < DateTimeOffset.UtcNow ? DateTimeOffset.UtcNow : merchant.ValidUntil;
        merchant.ValidUntil = baseDate.AddDays(30 * token.Months);
        merchant.Status = "ativo";

        await dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new { message = "Plano ativado com sucesso!", validUntil = merchant.ValidUntil });
    }
}
