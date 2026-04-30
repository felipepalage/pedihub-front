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
    string Status);

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
public sealed record CreateProductRequest(string Image, string Name, string Category, decimal Price, bool Available, int Stock, bool Promo);
public sealed record UpdateProductRequest(string Image, string Name, string Category, decimal Price, bool Available, int Stock, bool Promo);

public sealed record ProductDto(
    Guid Id,
    string Image,
    string Name,
    string Category,
    decimal Price,
    bool Available,
    int Stock,
    bool Promo);

public sealed record CustomerSummaryDto(
    Guid Id,
    string Company,
    string Plan,
    string Status,
    DateTimeOffset? LastAccessAt,
    DateTimeOffset SignupDate);

public sealed record ReportSummaryBlockDto(string Label, string Value);

public sealed record TopProductDto(string Name, int Sold, decimal Revenue);
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
    string BannerUrl);

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
    string BannerUrl);

public sealed record IntegrationDto(
    string Id,
    string Name,
    string Description,
    string Status,
    string Emoji);
