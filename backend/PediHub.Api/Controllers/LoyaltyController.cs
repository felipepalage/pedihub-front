using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PediHub.Api.Data;
using PediHub.Api.Extensions;
using PediHub.Api.Models;

namespace PediHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class LoyaltyController(PediHubDbContext dbContext) : ControllerBase
{
    [HttpGet("program")]
    public async Task<ActionResult<LoyaltyProgram>> GetProgram(CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var program = await dbContext.LoyaltyPrograms.FirstOrDefaultAsync(x => x.MerchantId == merchantId, cancellationToken);
        
        if (program is null)
        {
            program = new LoyaltyProgram { MerchantId = merchantId };
            dbContext.LoyaltyPrograms.Add(program);
            await dbContext.SaveChangesAsync(cancellationToken);
        }

        return Ok(program);
    }

    [HttpPut("program")]
    public async Task<ActionResult<LoyaltyProgram>> UpdateProgram(LoyaltyProgram request, CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var program = await dbContext.LoyaltyPrograms.FirstOrDefaultAsync(x => x.MerchantId == merchantId, cancellationToken);

        if (program is null)
        {
            program = new LoyaltyProgram { MerchantId = merchantId };
            dbContext.LoyaltyPrograms.Add(program);
        }

        program.IsActive = request.IsActive;
        program.PointsPerReal = request.PointsPerReal;
        program.MinPointsToRedeem = request.MinPointsToRedeem;
        program.RedeemValue = request.RedeemValue;

        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(program);
    }
}
