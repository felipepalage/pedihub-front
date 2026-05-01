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
public sealed class SettingsController(PediHubDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<SettingsDto>> Get(CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var merchant = await dbContext.Merchants.AsNoTracking().FirstAsync(x => x.Id == merchantId, cancellationToken);

        return Ok(Map(merchant));
    }

    [HttpPut]
    public async Task<ActionResult<SettingsDto>> Update(UpdateSettingsRequest request, CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var merchant = await dbContext.Merchants.FirstAsync(x => x.Id == merchantId, cancellationToken);

        merchant.CompanyName = request.CompanyName.Trim();
        merchant.Cnpj = request.Cnpj.Trim();
        merchant.Phone = request.Phone.Trim();
        merchant.Email = request.Email.Trim().ToLowerInvariant();
        merchant.Street = request.Street.Trim();
        merchant.Number = request.Number.Trim();
        merchant.Neighborhood = request.Neighborhood.Trim();
        merchant.City = request.City.Trim();
        merchant.State = request.State.Trim().ToUpperInvariant();
        merchant.ZipCode = request.ZipCode.Trim();
        merchant.OpeningHours = request.OpeningHours.Trim();
        merchant.AveragePrepMinutes = request.AveragePrepMinutes;
        merchant.DeliveryFeeBase = request.DeliveryFeeBase;
        merchant.MinimumOrder = request.MinimumOrder;
        merchant.AutoAcceptOrders = request.AutoAcceptOrders;
        merchant.PrimaryColor = request.PrimaryColor.Trim();
        merchant.LogoUrl = request.LogoUrl.Trim();
        merchant.BannerUrl = request.BannerUrl.Trim();
        merchant.PixKey = request.PixKey.Trim();
        merchant.MercadoPagoAccessToken = request.MercadoPagoAccessToken.Trim();
        merchant.WhatsAppNumber = request.WhatsAppNumber.Trim();

        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(Map(merchant));
    }

    private static SettingsDto Map(Models.Merchant merchant)
    {
        return new SettingsDto(
            merchant.CompanyName,
            merchant.Cnpj,
            merchant.Phone,
            merchant.Email,
            merchant.Street,
            merchant.Number,
            merchant.Neighborhood,
            merchant.City,
            merchant.State,
            merchant.ZipCode,
            merchant.OpeningHours,
            merchant.AveragePrepMinutes,
            merchant.DeliveryFeeBase,
            merchant.MinimumOrder,
            merchant.AutoAcceptOrders,
            merchant.PrimaryColor,
            merchant.LogoUrl,
            merchant.BannerUrl,
            merchant.PixKey,
            merchant.MercadoPagoAccessToken,
            merchant.WhatsAppNumber,
            merchant.Slug);
    }
}
