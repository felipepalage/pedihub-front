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
            .Include(x => x.ModifierGroups)
                .ThenInclude(x => x.Options)
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
            .ToListAsync(cancellationToken);

        return Ok(products.Select(MapProduct).ToList());
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
            Description = request.Description?.Trim() ?? string.Empty,
            Category = request.Category.Trim(),
            Price = request.Price,
            Available = request.Available,
            Stock = request.Stock,
            Promo = request.Promo,
        };

        if (request.ModifierGroups != null)
        {
            foreach (var gDto in request.ModifierGroups)
            {
                var group = new ModifierGroup
                {
                    MerchantId = merchantId,
                    Name = gDto.Name,
                    MinQuantity = gDto.MinQuantity,
                    MaxQuantity = gDto.MaxQuantity,
                    Options = gDto.Options.Select(o => new ModifierOption
                    {
                        Name = o.Name,
                        Price = o.Price
                    }).ToList()
                };
                product.ModifierGroups.Add(group);
            }
        }

        dbContext.Products.Add(product);
        await dbContext.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetAll), new { id = product.Id }, MapProduct(product));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<ProductDto>> Update(Guid id, UpdateProductRequest request, CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var product = await dbContext.Products
            .Include(x => x.ModifierGroups)
                .ThenInclude(x => x.Options)
            .FirstOrDefaultAsync(x => x.MerchantId == merchantId && x.Id == id, cancellationToken);
            
        if (product is null)
        {
            return NotFound();
        }

        product.Image = string.IsNullOrWhiteSpace(request.Image) ? "🍽️" : request.Image.Trim();
        product.Name = request.Name.Trim();
        product.Description = request.Description?.Trim() ?? string.Empty;
        product.Category = request.Category.Trim();
        product.Price = request.Price;
        product.Available = request.Available;
        product.Stock = request.Stock;
        product.Promo = request.Promo;
        product.UpdatedAt = DateTimeOffset.UtcNow;

        // Simple sync: clear and re-add for now (could be optimized)
        product.ModifierGroups.Clear();
        if (request.ModifierGroups != null)
        {
            foreach (var gDto in request.ModifierGroups)
            {
                if (gDto.Id.HasValue && gDto.Id.Value != Guid.Empty)
                {
                    var existingGroup = await dbContext.ModifierGroups
                        .Include(x => x.Options)
                        .FirstOrDefaultAsync(x => x.Id == gDto.Id.Value && x.MerchantId == merchantId, cancellationToken);
                    
                    if (existingGroup != null)
                    {
                        existingGroup.Name = gDto.Name;
                        existingGroup.MinQuantity = gDto.MinQuantity;
                        existingGroup.MaxQuantity = gDto.MaxQuantity;
                        
                        // Quick sync options
                        dbContext.ModifierOptions.RemoveRange(existingGroup.Options);
                        existingGroup.Options = gDto.Options.Select(o => new ModifierOption
                        {
                            ModifierGroupId = existingGroup.Id,
                            Name = o.Name,
                            Price = o.Price
                        }).ToList();

                        product.ModifierGroups.Add(existingGroup);
                        continue;
                    }
                }

                var group = new ModifierGroup
                {
                    MerchantId = merchantId,
                    Name = gDto.Name,
                    MinQuantity = gDto.MinQuantity,
                    MaxQuantity = gDto.MaxQuantity,
                    Options = gDto.Options.Select(o => new ModifierOption
                    {
                        Name = o.Name,
                        Price = o.Price
                    }).ToList()
                };
                product.ModifierGroups.Add(group);
            }
        }

        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(MapProduct(product));
    }

    [HttpPatch("{id:guid}/availability")]
    public async Task<ActionResult<ProductDto>> ToggleAvailability(Guid id, CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var product = await dbContext.Products.FirstOrDefaultAsync(x => x.MerchantId == merchantId && x.Id == id, cancellationToken);
        if (product is null) return NotFound();

        product.Available = !product.Available;
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(MapProduct(product));
    }

    [HttpPost("{id:guid}/duplicate")]
    public async Task<ActionResult<ProductDto>> Duplicate(Guid id, CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var original = await dbContext.Products
            .Include(x => x.ModifierGroups)
                .ThenInclude(x => x.Options)
            .FirstOrDefaultAsync(x => x.MerchantId == merchantId && x.Id == id, cancellationToken);

        if (original is null) return NotFound();

        var duplicate = new Product
        {
            MerchantId = merchantId,
            Image = original.Image,
            Name = $"{original.Name} (Copia)",
            Description = original.Description,
            Category = original.Category,
            Price = original.Price,
            Available = original.Available,
            Stock = original.Stock,
            Promo = original.Promo,
            ModifierGroups = original.ModifierGroups.Select(g => new ModifierGroup
            {
                MerchantId = merchantId,
                Name = g.Name,
                MinQuantity = g.MinQuantity,
                MaxQuantity = g.MaxQuantity,
                Options = g.Options.Select(o => new ModifierOption
                {
                    Name = o.Name,
                    Price = o.Price
                }).ToList()
            }).ToList()
        };

        dbContext.Products.Add(duplicate);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(MapProduct(duplicate));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var product = await dbContext.Products
            .Include(x => x.ModifierGroups)
            .FirstOrDefaultAsync(x => x.MerchantId == merchantId && x.Id == id, cancellationToken);
        if (product is null) return NotFound();

        product.ModifierGroups.Clear();
        dbContext.Products.Remove(product);
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    private static ProductDto MapProduct(Product p) => new(
        p.Id,
        p.Image,
        p.Name,
        p.Description,
        p.Category,
        p.Price,
        p.Available,
        p.Stock,
        p.Promo,
        p.ModifierGroups.Select(g => new ModifierGroupDto(
            g.Id,
            g.Name,
            g.MinQuantity,
            g.MaxQuantity,
            g.Options.Select(o => new ModifierOptionDto(o.Id, o.Name, o.Price)).ToList()
        )).ToList()
    );
}
