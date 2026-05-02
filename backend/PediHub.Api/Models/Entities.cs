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
    public string Slug { get; set; } = string.Empty;
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
    public string WhatsAppNumber { get; set; } = string.Empty;
    public string LogoUrl { get; set; } = string.Empty;
    public string BannerUrl { get; set; } = string.Empty;
    public string PixKey { get; set; } = string.Empty;
    public string MercadoPagoAccessToken { get; set; } = string.Empty;
    public string PrimaryColor { get; set; } = "#E53935";
    public string OpeningHours { get; set; } = "11:00 - 23:00";
    public int AveragePrepMinutes { get; set; } = 35;
    public decimal DeliveryFeeBase { get; set; } = 8m;
    public decimal MinimumOrder { get; set; } = 25m;
    public bool AutoAcceptOrders { get; set; }
    public DateTimeOffset ValidUntil { get; set; }
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
    public string Description { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public bool Available { get; set; } = true;
    public int Stock { get; set; }
    public bool Promo { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<ModifierGroup> ModifierGroups { get; set; } = new List<ModifierGroup>();
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
    public string Type { get; set; } = "delivery"; // "delivery" or "pickup"
    public string? Address { get; set; }
    
    // New fields for WhatsApp integration and delivery details
    public string CustomerPhone { get; set; } = string.Empty;
    public decimal DeliveryFee { get; set; }
    public decimal? ChangeFor { get; set; }
    public string Street { get; set; } = string.Empty;
    public string AddressNumber { get; set; } = string.Empty;
    public string Neighborhood { get; set; } = string.Empty;
    public string Complement { get; set; } = string.Empty;
    public string ReferencePoint { get; set; } = string.Empty;
    public string? CouponCode { get; set; }
    public decimal CouponDiscount { get; set; }

    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;

    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}

public class ModifierGroup
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MerchantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int MinQuantity { get; set; } = 0;
    public int MaxQuantity { get; set; } = 1;
    public bool IsRequired => MinQuantity > 0;
    
    public ICollection<ModifierOption> Options { get; set; } = new List<ModifierOption>();
    public ICollection<Product> Products { get; set; } = new List<Product>();
}

public class ModifierOption
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid ModifierGroupId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
}

public sealed class OrderItem
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderId { get; set; }
    public string Name { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }

    public Order Order { get; set; } = null!;
    public ICollection<OrderItemModifier> Modifiers { get; set; } = new List<OrderItemModifier>();
}

public class OrderItemModifier
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OrderItemId { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
}

public class Coupon
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MerchantId { get; set; }
    public string Code { get; set; } = string.Empty;
    public string Type { get; set; } = "fixed"; // fixed or percentage
    public decimal DiscountAmount { get; set; }
    public decimal MinOrderValue { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime? ExpiryDate { get; set; }
    public int? UsageLimit { get; set; }
    public int UsageCount { get; set; } = 0;
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

public class LoyaltyProgram
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MerchantId { get; set; }
    public bool IsActive { get; set; }
    public decimal PointsPerReal { get; set; } = 1;
    public decimal MinPointsToRedeem { get; set; } = 100;
    public decimal RedeemValue { get; set; } = 10; // 100 points = 10 BRL discount
}

public class LoyaltyPoint
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MerchantId { get; set; }
    public string CustomerPhone { get; set; } = string.Empty;
    public decimal Points { get; set; }
    public DateTimeOffset UpdatedAt { get; set; } = DateTimeOffset.UtcNow;
}

public class MerchantTable
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid MerchantId { get; set; }
    public string Number { get; set; } = string.Empty;
    public string QrCodeUrl { get; set; } = string.Empty;
}

public sealed class ActivationToken
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Code { get; set; } = string.Empty;
    public int Months { get; set; }
    public bool IsUsed { get; set; }
    public Guid? UsedByMerchantId { get; set; }
    public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;
    public DateTimeOffset? UsedAt { get; set; }
}
