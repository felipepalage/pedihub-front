using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PediHub.Api.Contracts;
using PediHub.Api.Data;

namespace PediHub.Api.Controllers;

[ApiController]
[Authorize(Roles = "SuperAdmin")]
[Route("api/[controller]")]
public sealed class CustomersController(PediHubDbContext dbContext) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IReadOnlyList<CustomerSummaryDto>>> GetAll([FromQuery] string? search, CancellationToken cancellationToken)
    {
        var query = dbContext.Merchants.AsNoTracking().AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var normalized = search.Trim().ToLowerInvariant();
            query = query.Where(x => x.CompanyName.ToLower().Contains(normalized));
        }

        var customers = await query
            .OrderBy(x => x.CompanyName)
            .Select(x => new CustomerSummaryDto(
                x.Id,
                x.CompanyName,
                x.Status,
                x.LastAccessAt,
                x.CreatedAt))
            .ToListAsync(cancellationToken);

        return Ok(customers);
    }
}
