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
public sealed class ProductsController(PediHubDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<ProductDto>>> GetAll([FromQuery] string? category, [FromQuery] string? search, CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var query = dbContext.Products
            .AsNoTracking()
            .Where(x => x.MerchantId == merchantId);

        if (!string.IsNullOrWhiteSpace(category) && !string.Equals(category, "Todas", StringComparison.OrdinalIgnoreCase))
        {
            query = query.Where(x => x.Category == category);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalized = search.Trim().ToLowerInvariant();
            query = query.Where(x => x.Name.ToLower().Contains(normalized));
        }

        var products = await query
            .OrderBy(x => x.Name)
            .Select(x => new ProductDto(
                x.Id,
                x.Image,
                x.Name,
                x.Category,
                x.Price,
                x.Available,
                x.Stock,
                x.Promo))
            .ToListAsync(cancellationToken);

        return Ok(products);
    }

    [HttpPost]
    public async Task<ActionResult<ProductDto>> Create(CreateProductRequest request, CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var product = new Product
        {
            MerchantId = merchantId,
            Image = string.IsNullOrWhiteSpace(request.Image) ? "🍽️" : request.Image.Trim(),
            Name = request.Name.Trim(),
            Category = request.Category.Trim(),
            Price = request.Price,
            Available = request.Available,
            Stock = request.Stock,
            Promo = request.Promo,
        };

        dbContext.Products.Add(product);
        await dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetAll), new { id = product.Id }, MapProduct(product));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ProductDto>> Update(Guid id, UpdateProductRequest request, CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var product = await dbContext.Products.FirstOrDefaultAsync(x => x.MerchantId == merchantId && x.Id == id, cancellationToken);
        if (product is null)
        {
            return NotFound();
        }

        product.Image = string.IsNullOrWhiteSpace(request.Image) ? "🍽️" : request.Image.Trim();
        product.Name = request.Name.Trim();
        product.Category = request.Category.Trim();
        product.Price = request.Price;
        product.Available = request.Available;
        product.Stock = request.Stock;
        product.Promo = request.Promo;
        product.UpdatedAt = DateTimeOffset.UtcNow;

        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(MapProduct(product));
    }

    [HttpPatch("{id:guid}/availability")]
    public async Task<ActionResult<ProductDto>> ToggleAvailability(Guid id, CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var product = await dbContext.Products.FirstOrDefaultAsync(x => x.MerchantId == merchantId && x.Id == id, cancellationToken);
        if (product is null)
        {
            return NotFound();
        }

        product.Available = !product.Available;
        product.UpdatedAt = DateTimeOffset.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(MapProduct(product));
    }

    [HttpPost("{id:guid}/duplicate")]
    public async Task<ActionResult<ProductDto>> Duplicate(Guid id, CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var source = await dbContext.Products.AsNoTracking().FirstOrDefaultAsync(x => x.MerchantId == merchantId && x.Id == id, cancellationToken);
        if (source is null)
        {
            return NotFound();
        }

        var duplicate = new Product
        {
            MerchantId = merchantId,
            Image = source.Image,
            Name = $"{source.Name} (Copia)",
            Category = source.Category,
            Price = source.Price,
            Available = source.Available,
            Stock = source.Stock,
            Promo = source.Promo,
        };

        dbContext.Products.Add(duplicate);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(MapProduct(duplicate));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var product = await dbContext.Products.FirstOrDefaultAsync(x => x.MerchantId == merchantId && x.Id == id, cancellationToken);
        if (product is null)
        {
            return NotFound();
        }

        dbContext.Products.Remove(product);
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static ProductDto MapProduct(Product product)
    {
        return new ProductDto(product.Id, product.Image, product.Name, product.Category, product.Price, product.Available, product.Stock, product.Promo);
    }
}
