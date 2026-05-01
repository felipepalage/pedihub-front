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
public sealed class TablesController(PediHubDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<MerchantTable>>> GetAll(CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var tables = await dbContext.MerchantTables
            .Where(x => x.MerchantId == merchantId)
            .OrderBy(x => x.Number)
            .ToListAsync(cancellationToken);
        return Ok(tables);
    }

    [HttpPost]
    public async Task<ActionResult<MerchantTable>> Create(CreateTableRequest request, CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var merchant = await dbContext.Merchants.FindAsync(merchantId);
        if (merchant is null) return NotFound();

        var exists = await dbContext.MerchantTables
            .AnyAsync(x => x.MerchantId == merchantId && x.Number == request.Number.Trim(), cancellationToken);

        if (exists)
            return BadRequest(new { message = "Esta mesa já está cadastrada." });

        var table = new MerchantTable
        {
            MerchantId = merchantId,
            Number = request.Number,
            QrCodeUrl = $"https://pedihub.com.br/{merchant.Slug}?table={request.Number}"
        };

        dbContext.MerchantTables.Add(table);
        await dbContext.SaveChangesAsync(cancellationToken);
        return Ok(table);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id, CancellationToken cancellationToken)
    {
        var merchantId = User.GetRequiredMerchantId();
        var table = await dbContext.MerchantTables.FirstOrDefaultAsync(x => x.MerchantId == merchantId && x.Id == id, cancellationToken);
        if (table is null) return NotFound();

        dbContext.MerchantTables.Remove(table);
        await dbContext.SaveChangesAsync(cancellationToken);
        return NoContent();
    }
}

public record CreateTableRequest(string Number);
