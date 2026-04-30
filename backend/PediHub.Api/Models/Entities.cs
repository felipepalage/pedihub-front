namespace PediHub.Api.Models;

public static class DomainRules
{
    public static readonly string[] OrderStatuses =
    [
        "novo",
        "aceito",
        "preparando",
        "saiu_entrega",
        "finalizado",
        "cancelado",
    ];

    public static readonly string[] Channels = ["ifood", "whatsapp", "site", "balcao"];
    public static readonly string[] Payments = ["pix", "credito", "debito", "dinheiro"];
    public static readonly string[] IntegrationStatuses = ["ativo", "em_breve", "disponivel"];
    public static readonly string[] MerchantPlans = ["Starter", "Pro", "Enterprise"];
    public static readonly string[] MerchantStatuses = ["ativo", "trial", "inativo"];
}

public sealed class Merchant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string CompanyName { get; set; } = string.Empty;
    public string Cnpj { get; set; } = string.Empty;
    public string Plan { get; set; } = "Starter";
    public string Status { get; set; } = "trial";
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Segment { get; set; } = string.Empty;
    public int UnitCount { get; set; } = 1;
    public string Street { get; set; } = string.Empty;
    public string Number { get; set; } = string.Empty;
    public string Neighborhood { get; set; } = string.Empty;
    public string City { get; set; } = string.Empty;
    public string State { get; set; } = string.Empty;
    public string ZipCode { get; set; } = string.Empty;
    public string LogoUrl { get; set; } = string.Empty;
    public string BannerUrl { get; set; } = string.Empty;
    public string PrimaryColor { get; set; } = "#E53935";
    public string OpeningHours { get; set; } = "11:00 - 23:00";
    public int AveragePrepMinutes { get; set; } = 35;
    public decimal DeliveryFeeBase { get; set; } = 8m;
    public decimal MinimumOrder { get; set; } = 25m;
    public bool AutoAcceptOrders { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? LastAccessAt { get; set; }

    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Product> Products { get; set; } = new List<Product>();
    public ICollection<Order> Orders { get; set; } = new List<Order>();
    public ICollection<IntegrationConnection> Integrations { get; set; } = new List<IntegrationConnection>();
}

public sealed class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MerchantId { get; set; }
    public Merchant Merchant { get; set; } = null!;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "Owner";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? LastLoginAt { get; set; }
}

public sealed class Product
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MerchantId { get; set; }
    public Merchant Merchant { get; set; } = null!;
    public string Image { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public bool Available { get; set; } = true;
    public int Stock { get; set; }
    public bool Promo { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public sealed class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MerchantId { get; set; }
    public Merchant Merchant { get; set; } = null!;
    public int Number { get; set; }
    public string Channel { get; set; } = "site";
    public string CustomerName { get; set; } = string.Empty;
    public decimal Total { get; set; }
    public DateTimeOffset OrderedAt { get; set; } = DateTimeOffset.UtcNow;
    public string Status { get; set; } = "novo";
    public string Payment { get; set; } = "pix";
    public string? Address { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}

public sealed class OrderItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}

public sealed class IntegrationConnection
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MerchantId { get; set; }
    public Merchant Merchant { get; set; } = null!;
    public string Type { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Emoji { get; set; } = string.Empty;
    public string Status { get; set; } = "disponivel";
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? ConnectedAt { get; set; }
}
