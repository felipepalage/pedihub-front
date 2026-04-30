using PediHub.Api.Models;

namespace PediHub.Api.Services;

public sealed record IntegrationTemplate(string Type, string Name, string Description, string Emoji, string Status);

public static class IntegrationCatalog
{
    public static readonly IReadOnlyList<IntegrationTemplate> Templates =
    [
        new("ifood", "iFood", "Receba pedidos do iFood diretamente no PEDIHUB.", "🛵", "em_breve"),
        new("whatsapp", "WhatsApp", "Atendimento e pedidos via WhatsApp Business.", "💬", "disponivel"),
        new("site", "Site proprio", "Cardapio digital com link e QR Code.", "🌐", "disponivel"),
        new("marketplace", "Marketplace PEDIHUB", "Em breve: apareca em nossa vitrine.", "🛍️", "em_breve"),
    ];

    public static List<IntegrationConnection> CreateDefaults(Guid merchantId)
    {
        return Templates
            .Select(template => new IntegrationConnection
            {
                MerchantId = merchantId,
                Type = template.Type,
                Name = template.Name,
                Description = template.Description,
                Emoji = template.Emoji,
                Status = template.Status,
            })
            .ToList();
    }
}
