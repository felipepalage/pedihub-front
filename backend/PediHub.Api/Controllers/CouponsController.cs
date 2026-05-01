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
public sealed class CouponsController(PediHubDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Coupon>>> Get(CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var coupons = await dbContext.Coupons
            .Where(x => x.MerchantId == merchantId)
            .OrderByDescending(x => x.IsActive)
            .ThenBy(x => x.Code)
            .ToListAsync(cancellationToken);

        return Ok(coupons);
    }

    [HttpPost]
    public async Task<ActionResult<Coupon>> Create(Coupon coupon, CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        
        // Validar se ja existe um cupom com mesmo codigo para este lojista
        var exists = await dbContext.Coupons
            .AnyAsync(x => x.MerchantId == merchantId && x.Code == coupon.Code.ToUpper().Trim(), cancellationToken);

        if (exists)
            return BadRequest(new { message = "Já existe um cupom com este código." });

        coupon.Id = Guid.NewGuid();
        coupon.MerchantId = merchantId;
        coupon.Code = coupon.Code.ToUpper().Trim();
        coupon.UsageCount = 0;

        dbContext.Coupons.Add(coupon);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Ok(coupon);
    }

    [HttpDelete("{id}")]
    public async Task<ActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var coupon = await dbContext.Coupons
            .FirstOrDefaultAsync(x => x.Id == id && x.MerchantId == merchantId, cancellationToken);

        if (coupon == null)
            return NotFound();

        dbContext.Coupons.Remove(coupon);
        await dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpPatch("{id}/toggle")]
    public async Task<ActionResult> Toggle(Guid id, CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var coupon = await dbContext.Coupons
            .FirstOrDefaultAsync(x => x.Id == id && x.MerchantId == merchantId, cancellationToken);

        if (coupon == null)
            return NotFound();

        coupon.IsActive = !coupon.IsActive;
        await dbContext.SaveChangesAsync(cancellationToken);

        return Ok(coupon);
    }
}
