using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PediHub.Api.Contracts;
using PediHub.Api.Data;
using PediHub.Api.Models;

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
            status
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
        var total = totalItems + deliveryFee;

        var addressString = request.Type == "delivery" 
            ? $"{request.Street}, {request.AddressNumber} - {request.Neighborhood}, {request.City} - {request.State} (CEP: {request.ZipCode})"
            : "Retirada no Local";

        if (!string.IsNullOrWhiteSpace(request.Complement)) addressString += $" Comp: {request.Complement}";

        var order = new Order
        {
            MerchantId = merchant.Id,
            Number = nextNumber,
            Channel = "site", // Indicates it came from the digital menu
            CustomerName = request.CustomerName.Trim(),
            CustomerPhone = request.CustomerPhone.Trim(),
            Status = merchant.AutoAcceptOrders ? "aceito" : "novo",
            Payment = request.Payment,
            Total = total,
            Address = addressString,
            DeliveryFee = deliveryFee,
            ChangeFor = request.ChangeFor,
            Street = request.Street ?? "",
            AddressNumber = request.AddressNumber ?? "",
            Neighborhood = request.Neighborhood ?? "",
            Complement = request.Complement ?? "",
            ReferencePoint = request.ReferencePoint ?? ""
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

        return Ok(new { message = "Pedido realizado com sucesso!", orderNumber = order.Number });
    }

    [HttpGet("orders/{orderNumber:int}")]
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
            order.Status,
            order.Payment,
            order.Address,
            order.CustomerPhone,
            order.DeliveryFee,
            order.ChangeFor,
            order.Street,
            order.AddressNumber,
            order.Neighborhood,
            order.Complement,
            order.ReferencePoint,
            order.Items.Select(i => new OrderItemDto(i.Name, i.Quantity, i.UnitPrice)).ToList()));
    }
}
