using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PediHub.Api.Contracts;
using PediHub.Api.Data;
using PediHub.Api.Models;
using PediHub.Api.Services;

namespace PediHub.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public sealed class AuthController(
    PediHubDbContext dbContext,
    IPasswordService passwordService,
    IJwtTokenService jwtTokenService) : ControllerBase
{
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var cnpj = request.Cnpj.Trim();

        if (await dbContext.Users.AnyAsync(x => x.Email == email, cancellationToken))
        {
            return Conflict(new { message = "Ja existe um usuario com este email." });
        }

        if (await dbContext.Merchants.AnyAsync(x => x.Cnpj == cnpj, cancellationToken))
        {
            return Conflict(new { message = "Ja existe uma empresa com este CPF/CNPJ." });
        }

        var baseSlug = GenerateSlug(request.CompanyName);
        var slug = baseSlug;
        var slugCounter = 1;
        while (await dbContext.Merchants.AnyAsync(x => x.Slug == slug, cancellationToken))
        {
            slug = $"{baseSlug}-{slugCounter++}";
        }

        var merchant = new Merchant
        {
            CompanyName = request.CompanyName.Trim(),
            Slug = slug,
            Cnpj = cnpj,
            Plan = "Starter",
            Status = "trial",
            Email = email,
            Phone = request.Phone.Trim(),
            Segment = request.Segment.Trim(),
            UnitCount = request.UnitCount <= 0 ? 1 : request.UnitCount,
            Street = request.Street.Trim(),
            Number = request.Number.Trim(),
            Neighborhood = request.Neighborhood.Trim(),
            City = request.City.Trim(),
            State = request.State.Trim().ToUpperInvariant(),
            ZipCode = request.ZipCode.Trim(),
            ValidUntil = DateTimeOffset.UtcNow.AddDays(7),
        };

        var user = new User
        {
            Merchant = merchant,
            FullName = request.FullName.Trim(),
            Email = email,
            Phone = request.Phone.Trim(),
            PasswordHash = passwordService.Hash(request.Password),
            Role = email == "fguilherme545@gmail.com" ? "SuperAdmin" : "Owner",
            LastLoginAt = DateTimeOffset.UtcNow,
        };

        merchant.LastAccessAt = user.LastLoginAt;

        dbContext.Merchants.Add(merchant);
        dbContext.Users.Add(user);
        dbContext.Integrations.AddRange(IntegrationCatalog.CreateDefaults(merchant.Id));

        await dbContext.SaveChangesAsync(cancellationToken);

        var token = jwtTokenService.Generate(user, merchant);
        return Ok(new AuthResponse(token.Token, token.ExpiresAt, ToUserDto(user, merchant)));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request, CancellationToken cancellationToken)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await dbContext.Users
            .Include(x => x.Merchant)
            .FirstOrDefaultAsync(x => x.Email == email, cancellationToken);

        if (user is null || !passwordService.Verify(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Email ou senha invalidos." });
        }

        user.LastLoginAt = DateTimeOffset.UtcNow;
        user.Merchant.LastAccessAt = user.LastLoginAt;
        await dbContext.SaveChangesAsync(cancellationToken);

        var token = jwtTokenService.Generate(user, user.Merchant);
        return Ok(new AuthResponse(token.Token, token.ExpiresAt, ToUserDto(user, user.Merchant)));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<AuthUserDto>> Me(CancellationToken cancellationToken)
    {
        if (!(User.Identity?.IsAuthenticated ?? false))
        {
            return Unauthorized();
        }

        var email = User.Claims.FirstOrDefault(x => x.Type == System.Security.Claims.ClaimTypes.Email)?.Value;
        if (string.IsNullOrWhiteSpace(email))
        {
            return Unauthorized();
        }

        var user = await dbContext.Users
            .Include(x => x.Merchant)
            .FirstOrDefaultAsync(x => x.Email == email, cancellationToken);

        return user is null ? Unauthorized() : Ok(ToUserDto(user, user.Merchant));
    }

    private static AuthUserDto ToUserDto(User user, Merchant merchant)
    {
        return new AuthUserDto(user.Id, merchant.Id, user.FullName, user.Email, merchant.CompanyName, merchant.Plan, merchant.Status, merchant.LogoUrl, user.Role, merchant.ValidUntil);
    }

    private static string RemoveDiacritics(string text) 
    {
        var normalizedString = text.Normalize(System.Text.NormalizationForm.FormD);
        var stringBuilder = new System.Text.StringBuilder(capacity: normalizedString.Length);

        for (int i = 0; i < normalizedString.Length; i++)
        {
            char c = normalizedString[i];
            var unicodeCategory = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c);
            if (unicodeCategory != System.Globalization.UnicodeCategory.NonSpacingMark)
            {
                stringBuilder.Append(c);
            }
        }

        return stringBuilder.ToString().Normalize(System.Text.NormalizationForm.FormC);
    }

    private static string GenerateSlug(string name)
    {
        var slug = RemoveDiacritics(name).ToLowerInvariant();
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"[^a-z0-9\s-]", "");
        slug = System.Text.RegularExpressions.Regex.Replace(slug, @"\s+", "-").Trim('-');
        return slug;
    }
}
