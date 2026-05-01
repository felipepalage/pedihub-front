using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PediHub.Api.Contracts;
using PediHub.Api.Data;
using PediHub.Api.Models;

namespace PediHub.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/[controller]")]
public sealed class AdminController(PediHubDbContext dbContext) : ControllerBase
{
    private bool IsSuperAdmin()
    {
        var role = User.Claims.FirstOrDefault(x => x.Type == System.Security.Claims.ClaimTypes.Role)?.Value;
        return role == "SuperAdmin";
    }

    [HttpGet("merchants")]
    public async Task<IActionResult> GetMerchants(CancellationToken cancellationToken)
    {
        if (!IsSuperAdmin()) return Forbid();

        var merchants = await dbContext.Merchants
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new AdminMerchantDto(x.Id, x.CompanyName, x.Cnpj, x.Plan, x.Status, x.CreatedAt, x.ValidUntil))
            .ToListAsync(cancellationToken);

        return Ok(merchants);
    }

    [HttpGet("tokens")]
    public async Task<IActionResult> GetTokens(CancellationToken cancellationToken)
    {
        if (!IsSuperAdmin()) return Forbid();

        var tokens = await dbContext.ActivationTokens
            .OrderByDescending(x => x.CreatedAt)
            .Select(x => new ActivationTokenDto(x.Id, x.Code, x.Months, x.IsUsed, x.CreatedAt, x.UsedAt))
            .ToListAsync(cancellationToken);

        return Ok(tokens);
    }

    [HttpPost("tokens")]
    public async Task<IActionResult> CreateToken([FromBody] GenerateTokenRequest request, CancellationToken cancellationToken)
    {
        if (!IsSuperAdmin()) return Forbid();

        var token = new ActivationToken
        {
            Months = request.Months,
            Code = GenerateRandomCode()
        };

        dbContext.ActivationTokens.Add(token);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Ok(new ActivationTokenDto(token.Id, token.Code, token.Months, token.IsUsed, token.CreatedAt, token.UsedAt));
    }

    private static string GenerateRandomCode()
    {
        var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        var random = new Random();
        var code = new string(Enumerable.Repeat(chars, 8).Select(s => s[random.Next(s.Length)]).ToArray());
        return code;
    }
}
