using System.Security.Claims;

namespace PediHub.Api.Extensions;

public static class ClaimsPrincipalExtensions
{
    public static Guid GetRequiredUserId(this ClaimsPrincipal principal)
    {
        var raw = principal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("Token sem identificador do usuario.");

        return Guid.Parse(raw);
    }

    public static Guid GetRequiredMerchantId(this ClaimsPrincipal principal)
    {
        var raw = principal.FindFirstValue("merchant_id")
            ?? throw new InvalidOperationException("Token sem identificador da empresa.");

        return Guid.Parse(raw);
    }
}
