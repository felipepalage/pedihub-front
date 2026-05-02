using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PediHub.Api.Contracts;
using PediHub.Api.Data;
using PediHub.Api.Models;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Json;

namespace PediHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class StoreController(PediHubDbContext dbContext) : ControllerBase
{
    [HttpGet("{slug}")]
    public async Task<ActionResult<StorePublicDto>> GetStoreInfo(string slug, CancellationToken cancellationToken)
    {
        var merchant = await dbContext.Merchants
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Slug == slug, cancellationToken);

        if (merchant is null)
        {
            return NotFound(new { message = "Loja não encontrada." });
        }

        // Check if trial/subscription is valid
        var isExpired = merchant.ValidUntil < DateTimeOffset.UtcNow && merchant.Status != "ativo"; // allow bypass if manual set to ativo
        var status = isExpired ? "fechado" : "aberto";

        var dto = new StorePublicDto(
            merchant.Id,
            merchant.CompanyName,
            merchant.Slug,
            merchant.LogoUrl,
            merchant.BannerUrl,
            merchant.PrimaryColor,
            merchant.Phone,
            merchant.OpeningHours,
            merchant.DeliveryFeeBase,
            merchant.MinimumOrder,
            merchant.PixKey,
            status,
            !string.IsNullOrWhiteSpace(merchant.MercadoPagoAccessToken)
        );

        return Ok(dto);
    }

    [HttpGet("{slug}/products")]
    public async Task<ActionResult<IReadOnlyList<StoreProductDto>>> GetStoreProducts(string slug, CancellationToken cancellationToken)
    {
        var merchant = await dbContext.Merchants
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Slug == slug, cancellationToken);

        if (merchant is null)
        {
            return NotFound();
        }

        var products = await dbContext.Products
            .AsNoTracking()
            .Where(x => x.MerchantId == merchant.Id && x.Available)
            .OrderBy(x => x.Category)
            .ThenBy(x => x.Name)
            .Select(x => new StoreProductDto(
                x.Id,
                x.Image,
                x.Name,
                x.Description,
                x.Price,
                x.Promo
            ))
            .ToListAsync(cancellationToken);

        return Ok(products);
    }

    [HttpGet("{slug}/coupons/{code}")]
    public async Task<ActionResult<Coupon>> ValidateCoupon(string slug, string code, CancellationToken cancellationToken)
    {
        var merchant = await dbContext.Merchants
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Slug == slug, cancellationToken);

        if (merchant is null) return NotFound(new { message = "Loja não encontrada." });

        var coupon = await dbContext.Coupons
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.MerchantId == merchant.Id && x.Code == code.ToUpper().Trim() && x.IsActive, cancellationToken);

        if (coupon is null) return NotFound(new { message = "Cupom inválido ou expirado." });

        if (coupon.ExpiryDate.HasValue && coupon.ExpiryDate.Value < DateTimeOffset.UtcNow)
            return BadRequest(new { message = "Este cupom expirou." });

        if (coupon.UsageLimit.HasValue && coupon.UsageCount >= coupon.UsageLimit.Value)
            return BadRequest(new { message = "Este cupom atingiu o limite de uso." });

        return Ok(coupon);
    }

    [HttpPost("{slug}/orders")]
    public async Task<ActionResult> PlaceOrder(string slug, PlaceOrderRequest request, CancellationToken cancellationToken)
    {
        var merchant = await dbContext.Merchants
            .FirstOrDefaultAsync(x => x.Slug == slug, cancellationToken);

        if (merchant is null)
        {
            return NotFound(new { message = "Loja não encontrada." });
        }

        if (merchant.ValidUntil < DateTimeOffset.UtcNow && merchant.Status != "ativo")
        {
            return BadRequest(new { message = "Esta loja não está recebendo pedidos no momento." });
        }

        if (request.Items == null || request.Items.Count == 0)
        {
            return BadRequest(new { message = "O carrinho está vazio." });
        }

        var totalItems = request.Items.Sum(x => x.UnitPrice * x.Quantity);
        if (totalItems < merchant.MinimumOrder)
        {
            return BadRequest(new { message = $"O pedido mínimo é de {merchant.MinimumOrder:C}." });
        }

        // Fetch last order number to increment
        var lastOrder = await dbContext.Orders
            .Where(x => x.MerchantId == merchant.Id)
            .OrderByDescending(x => x.Number)
            .FirstOrDefaultAsync(cancellationToken);

        var nextNumber = (lastOrder?.Number ?? 0) + 1;

        var deliveryFee = request.Type == "delivery" ? merchant.DeliveryFeeBase : 0;
        
        decimal couponDiscount = 0;
        if (!string.IsNullOrWhiteSpace(request.CouponCode))
        {
            var coupon = await dbContext.Coupons
                .FirstOrDefaultAsync(x => x.MerchantId == merchant.Id && x.Code == request.CouponCode.ToUpper().Trim() && x.IsActive, cancellationToken);

            if (coupon != null)
            {
                bool valid = true;
                if (coupon.ExpiryDate.HasValue && coupon.ExpiryDate.Value < DateTimeOffset.UtcNow) valid = false;
                if (coupon.UsageLimit.HasValue && coupon.UsageCount >= coupon.UsageLimit.Value) valid = false;
                if (totalItems < coupon.MinOrderValue) valid = false;

                if (valid)
                {
                    if (coupon.Type == "fixed")
                    {
                        couponDiscount = coupon.DiscountAmount;
                    }
                    else
                    {
                        couponDiscount = Math.Round(totalItems * (coupon.DiscountAmount / 100m), 2);
                    }
                    
                    coupon.UsageCount++;
                }
            }
        }

        var total = totalItems + deliveryFee - couponDiscount;
        if (total < 0) total = 0;

        string addressString;
        if (request.Type == "delivery")
        {
            var parts = new List<string>();
            if (!string.IsNullOrWhiteSpace(request.Street)) parts.Add(request.Street);
            if (!string.IsNullOrWhiteSpace(request.AddressNumber)) parts.Add(request.AddressNumber);
            if (!string.IsNullOrWhiteSpace(request.Neighborhood)) parts.Add(request.Neighborhood);
            if (!string.IsNullOrWhiteSpace(request.City)) parts.Add(request.City);
            if (!string.IsNullOrWhiteSpace(request.State)) parts.Add(request.State);
            if (!string.IsNullOrWhiteSpace(request.ZipCode)) parts.Add($"(CEP: {request.ZipCode})");
            
            addressString = string.Join(", ", parts);
            if (!string.IsNullOrWhiteSpace(request.Complement)) addressString += $" - {request.Complement}";
            if (!string.IsNullOrWhiteSpace(request.ReferencePoint)) addressString += $" (Ref: {request.ReferencePoint})";
        }
        else
        {
            addressString = "Retirada no Local";
        }

        var order = new Order
        {
            MerchantId = merchant.Id,
            Number = nextNumber,
            Channel = "site", // Indicates it came from the digital menu
            CustomerName = request.CustomerName.Trim(),
            CustomerPhone = request.CustomerPhone.Trim(),
            Status = merchant.AutoAcceptOrders ? "aceito" : "novo",
            Payment = request.Payment,
            Type = request.Type,
            Total = total,
            Address = addressString,
            DeliveryFee = deliveryFee,
            ChangeFor = request.ChangeFor,
            Street = request.Street ?? "",
            AddressNumber = request.AddressNumber ?? "",
            Neighborhood = request.Neighborhood ?? "",
            Complement = request.Complement ?? "",
            ReferencePoint = request.ReferencePoint ?? "",
            CouponCode = request.CouponCode?.ToUpper().Trim(),
            CouponDiscount = couponDiscount
        };

        foreach (var item in request.Items)
        {
            order.Items.Add(new OrderItem
            {
                Name = item.Name,
                Quantity = item.Quantity,
                UnitPrice = item.UnitPrice
            });
        }

        dbContext.Orders.Add(order);
        await dbContext.SaveChangesAsync(cancellationToken);

        string? checkoutUrl = null;

        if (request.Payment == "mercado_pago_online" && !string.IsNullOrWhiteSpace(merchant.MercadoPagoAccessToken))
        {
            try
            {
                using var httpClient = new HttpClient();
                httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", merchant.MercadoPagoAccessToken);

                var items = order.Items.Select(i => new
                {
                    title = i.Name,
                    quantity = i.Quantity,
                    currency_id = "BRL",
                    unit_price = (double)i.UnitPrice
                }).ToList();

                if (deliveryFee > 0)
                {
                    items.Add(new
                    {
                        title = "Taxa de Entrega",
                        quantity = 1,
                        currency_id = "BRL",
                        unit_price = (double)deliveryFee
                    });
                }

                if (couponDiscount > 0)
                {
                    items.Add(new
                    {
                        title = "Desconto",
                        quantity = 1,
                        currency_id = "BRL",
                        unit_price = -(double)couponDiscount
                    });
                }

                var preferenceData = new
                {
                    items = items,
                    back_urls = new
                    {
                        success = $"http://localhost:5173/{merchant.Slug}/order/{order.Number}?status=success",
                        failure = $"http://localhost:5173/{merchant.Slug}/order/{order.Number}?status=failure",
                        pending = $"http://localhost:5173/{merchant.Slug}/order/{order.Number}?status=pending"
                    },
                    auto_return = "approved",
                    external_reference = order.Id.ToString()
                };

                var response = await httpClient.PostAsJsonAsync("https://api.mercadopago.com/checkout/preferences", preferenceData, cancellationToken);
                if (response.IsSuccessStatusCode)
                {
                    var result = await response.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>(cancellationToken: cancellationToken);
                    checkoutUrl = result.GetProperty("init_point").GetString();
                }
                else
                {
                    var error = await response.Content.ReadAsStringAsync(cancellationToken);
                    Console.WriteLine($"Erro MercadoPago API: {response.StatusCode} - {error}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao integrar com MercadoPago: {ex.Message}");
            }
        }

        return Ok(new { 
            message = "Pedido realizado com sucesso!", 
            orderNumber = order.Number,
            checkoutUrl = checkoutUrl
        });
    }

    [HttpGet("{slug}/orders/{orderNumber:int}")]
    public async Task<ActionResult<OrderDetailDto>> GetOrder(string slug, int orderNumber, CancellationToken cancellationToken)
    {
        var merchant = await dbContext.Merchants
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.Slug == slug, cancellationToken);

        if (merchant is null) return NotFound();

        var order = await dbContext.Orders
            .AsNoTracking()
            .Include(x => x.Items)
            .FirstOrDefaultAsync(x => x.MerchantId == merchant.Id && x.Number == orderNumber, cancellationToken);

        if (order is null) return NotFound();

        return Ok(new OrderDetailDto(
            order.Id,
            order.Number,
            order.Channel,
            order.CustomerName,
            order.Total,
            order.OrderedAt.ToLocalTime().ToString("HH:mm"),
            order.OrderedAt,
            order.Status,
            order.Payment,
            order.Type,
            order.Address,
            order.CustomerPhone,
            order.DeliveryFee,
            order.ChangeFor,
            order.Street,
            order.AddressNumber,
            order.Neighborhood,
            order.Complement,
            order.ReferencePoint,
            order.Items.Select(i => new OrderItemDto(i.Name, i.Quantity, i.UnitPrice)).ToList(),
            order.CouponCode,
            order.CouponDiscount));
    }
}
