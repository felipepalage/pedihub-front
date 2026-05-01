namespace PediHub.Api.Contracts;

public sealed record RegisterRequest(
    string FullName,
    string Phone,
    string Email,
    string Password,
    string CompanyName,
    string Cnpj,
    int UnitCount,
    string Segment,
    string Street,
    string Number,
    string Neighborhood,
    string City,
    string State,
    string ZipCode);

public sealed record LoginRequest(string Email, string Password);

public sealed record AuthUserDto(
    Guid UserId,
    Guid MerchantId,
    string FullName,
    string Email,
    string MerchantName,
    string Plan,
    string Status,
    string? LogoUrl,
    string Role,
    DateTimeOffset ValidUntil);

public sealed record AuthResponse(string Token, DateTimeOffset ExpiresAt, AuthUserDto User);

public sealed record DashboardStatsDto(
    int OrdersToday,
    decimal RevenueToday,
    decimal AverageTicketToday,
    int PendingOrders,
    int DeliveredOrders,
    int CancelledOrders,
    decimal OrdersDeltaPercent,
    decimal RevenueDeltaPercent,
    decimal AverageTicketDeltaPercent);

public sealed record SalesPointDto(string Day, decimal Value);
public sealed record HourPointDto(string Hour, int Value);
public sealed record ChannelMixDto(string Name, decimal Value, string Channel);
public sealed record DashboardAlertDto(string Text, string Severity);

public sealed record OrderItemDto(string Name, int Qty, decimal Price);

public sealed record OrderListItemDto(
    Guid Id,
    int Number,
    string Channel,
    string Customer,
    decimal Total,
    string Time,
    string Status,
    string Payment);

public sealed record OrderDetailDto(
    Guid Id,
    int Number,
    string Channel,
    string Customer,
    decimal Total,
    string Time,
    string Status,
    string Payment,
    string? Address,
    string CustomerPhone,
    decimal DeliveryFee,
    decimal? ChangeFor,
    string Street,
    string AddressNumber,
    string Neighborhood,
    string Complement,
    string ReferencePoint,
    IReadOnlyList<OrderItemDto> Items);

public sealed record DashboardSummaryDto(
    string MerchantName,
    string Plan,
    DashboardStatsDto Stats,
    IReadOnlyList<SalesPointDto> SalesByDay,
    IReadOnlyList<HourPointDto> OrdersByHour,
    IReadOnlyList<ChannelMixDto> ChannelMix,
    IReadOnlyList<DashboardAlertDto> Alerts,
    IReadOnlyList<OrderListItemDto> RecentOrders);

public sealed record UpdateOrderStatusRequest(string Status);
public sealed record ModifierOptionDto(Guid? Id, string Name, decimal Price);
public sealed record ModifierGroupDto(Guid? Id, string Name, int MinQuantity, int MaxQuantity, IReadOnlyList<ModifierOptionDto> Options);

public sealed record CreateProductRequest(
    string Image, 
    string Name, 
    string Description, 
    string Category, 
    decimal Price, 
    bool Available, 
    int Stock, 
    bool Promo,
    IReadOnlyList<ModifierGroupDto>? ModifierGroups = null);

public sealed record UpdateProductRequest(
    string Image, 
    string Name, 
    string Description, 
    string Category, 
    decimal Price, 
    bool Available, 
    int Stock, 
    bool Promo,
    IReadOnlyList<ModifierGroupDto>? ModifierGroups = null);

public sealed record ProductDto(
    Guid Id,
    string Image,
    string Name,
    string? Description,
    string Category,
    decimal Price,
    bool Available,
    int Stock,
    bool Promo,
    IReadOnlyList<ModifierGroupDto> ModifierGroups);

public sealed record CustomerSummaryDto(
    Guid Id,
    string Company,
    string Plan,
    string Status,
    DateTimeOffset? LastAccessAt,
    DateTimeOffset SignupDate);

public sealed record ReportSummaryBlockDto(string Label, string Value);

public sealed record TopProductDto(string Name, int TotalSold, decimal TotalRevenue);
public sealed record MonthlyPointDto(string Month, decimal Value);

public sealed record ReportsResponseDto(
    IReadOnlyList<ReportSummaryBlockDto> Summary,
    IReadOnlyList<MonthlyPointDto> MonthlySales,
    IReadOnlyList<HourPointDto> OrdersByHour,
    IReadOnlyList<TopProductDto> TopProducts,
    IReadOnlyList<SalesPointDto> WeeklySales);

public sealed record SettingsDto(
    string CompanyName,
    string Cnpj,
    string Phone,
    string Email,
    string Street,
    string Number,
    string Neighborhood,
    string City,
    string State,
    string ZipCode,
    string OpeningHours,
    int AveragePrepMinutes,
    decimal DeliveryFeeBase,
    decimal MinimumOrder,
    bool AutoAcceptOrders,
    string PrimaryColor,
    string LogoUrl,
    string BannerUrl,
    string PixKey,
    string MercadoPagoAccessToken,
    string WhatsAppNumber);

public sealed record UpdateSettingsRequest(
    string CompanyName,
    string Cnpj,
    string Phone,
    string Email,
    string Street,
    string Number,
    string Neighborhood,
    string City,
    string State,
    string ZipCode,
    string OpeningHours,
    int AveragePrepMinutes,
    decimal DeliveryFeeBase,
    decimal MinimumOrder,
    bool AutoAcceptOrders,
    string PrimaryColor,
    string LogoUrl,
    string BannerUrl,
    string PixKey,
    string MercadoPagoAccessToken,
    string WhatsAppNumber);

public sealed record IntegrationDto(
    string Id,
    string Name,
    string Description,
    string Status,
    string Emoji);

public sealed record ActivateTokenRequest(string Code);

public sealed record AdminMerchantDto(
    Guid Id,
    string CompanyName,
    string Cnpj,
    string Plan,
    string Status,
    DateTimeOffset CreatedAt,
    DateTimeOffset ValidUntil);

public sealed record ActivationTokenDto(
    Guid Id,
    string Code,
    int Months,
    bool IsUsed,
    DateTimeOffset CreatedAt,
    DateTimeOffset? UsedAt);

public sealed record GenerateTokenRequest(int Months);

public sealed record StorePublicDto(
    Guid Id,
    string CompanyName,
    string Slug,
    string LogoUrl,
    string BannerUrl,
    string PrimaryColor,
    string Phone,
    string OpeningHours,
    decimal DeliveryFeeBase,
    decimal MinimumOrder,
    string PixKey,
    string Status);

public sealed record StoreProductDto(
    Guid Id,
    string Image,
    string Name,
    string Description,
    decimal Price,
    bool Promo);

public sealed record StoreCartItem(
    Guid ProductId,
    string Name,
    int Quantity,
    decimal UnitPrice);

public sealed record PlaceOrderRequest(
    string CustomerName,
    string CustomerPhone,
    string Type, // "delivery" or "pickup"
    string Payment, // "pix", "cartao", "dinheiro"
    decimal? ChangeFor,
    string ZipCode,
    string Street,
    string AddressNumber,
    string Neighborhood,
    string City,
    string State,
    string Complement,
    string ReferencePoint,
    IReadOnlyList<StoreCartItem> Items);
