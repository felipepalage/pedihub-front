using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PediHub.Api.Data;
using PediHub.Api.Models;
using System.Security.Claims;

namespace PediHub.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public sealed class CouponsController(PediHubDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Coupon>>> GetMyCoupons(CancellationToken cancellationToken)
    {
        var merchantId = GetMerchantId();
        var coupons = await dbContext.Coupons
            .Where(x => x.MerchantId == merchantId)
            .OrderByDescending(x => x.IsActive)
            .ToListAsync(cancellationToken);

        return Ok(coupons);
    }

    [HttpPost]
    public async Task<ActionResult<Coupon>> Create(CreateCouponRequest request, CancellationToken cancellationToken)
    {
        var merchantId = GetMerchantId();
        
        var coupon = new Coupon
        {
            Id = Guid.NewGuid(),
            MerchantId = merchantId,
            Code = request.Code.ToUpper().Trim(),
            Type = request.Type,
            DiscountAmount = request.DiscountAmount,
            ExpiryDate = request.ExpiryDate,
            UsageLimit = request.UsageLimit,
            IsActive = true
        };

        dbContext.Coupons.Add(coupon);
        await dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetMyCoupons), new { id = coupon.Id }, coupon);
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var merchantId = GetMerchantId();
        var coupon = await dbContext.Coupons
            .FirstOrDefaultAsync(x => x.Id == id && x.MerchantId == merchantId, cancellationToken);

        if (coupon == null) return NotFound();

        dbContext.Coupons.Remove(coupon);
        await dbContext.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private Guid GetMerchantId()
    {
        var claim = User.FindFirst("merchant_id")?.Value;
        return Guid.TryParse(claim, out var id) ? id : Guid.Empty;
    }
}

public record CreateCouponRequest(
    string Code, 
    string Type, 
    decimal DiscountAmount, 
    DateTime? ExpiryDate = null, 
    int? UsageLimit = null
);
