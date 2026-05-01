using Microsoft.EntityFrameworkCore;
using PediHub.Api.Models;

namespace PediHub.Api.Data;

public sealed class PediHubDbContext(DbContextOptions<PediHubDbContext> options) : DbContext(options)
{
    public DbSet<Merchant> Merchants => Set<Merchant>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<IntegrationConnection> Integrations => Set<IntegrationConnection>();
    public DbSet<ActivationToken> ActivationTokens => Set<ActivationToken>();
    public DbSet<Coupon> Coupons => Set<Coupon>();
    public DbSet<ModifierGroup> ModifierGroups => Set<ModifierGroup>();
    public DbSet<ModifierOption> ModifierOptions => Set<ModifierOption>();
    public DbSet<OrderItemModifier> OrderItemModifiers => Set<OrderItemModifier>();
    public DbSet<LoyaltyProgram> LoyaltyPrograms => Set<LoyaltyProgram>();
    public DbSet<LoyaltyPoint> LoyaltyPoints => Set<LoyaltyPoint>();
    public DbSet<MerchantTable> MerchantTables => Set<MerchantTable>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.HasDefaultSchema("pedihub");

        modelBuilder.Entity<Merchant>(entity =>
        {
            entity.ToTable("Merchants");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.CompanyName).HasMaxLength(160).IsRequired();
            entity.Property(x => x.Cnpj).HasMaxLength(20).IsRequired();
            entity.Property(x => x.Plan).HasMaxLength(20).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(20).IsRequired();
            entity.Property(x => x.Email).HasMaxLength(180).IsRequired();
            entity.Property(x => x.Phone).HasMaxLength(30).IsRequired();
            entity.Property(x => x.Segment).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Street).HasMaxLength(180).IsRequired();
            entity.Property(x => x.Number).HasMaxLength(20).IsRequired();
            entity.Property(x => x.Neighborhood).HasMaxLength(100).IsRequired();
            entity.Property(x => x.City).HasMaxLength(100).IsRequired();
            entity.Property(x => x.State).HasMaxLength(2).IsRequired();
            entity.Property(x => x.ZipCode).HasMaxLength(12).IsRequired();
            entity.Property(x => x.PrimaryColor).HasMaxLength(20).IsRequired();
            entity.Property(x => x.OpeningHours).HasMaxLength(50).IsRequired();
            entity.Property(x => x.DeliveryFeeBase).HasPrecision(18, 2);
            entity.Property(x => x.MinimumOrder).HasPrecision(18, 2);
            entity.HasIndex(x => x.Cnpj).IsUnique();
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("Users");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.FullName).HasMaxLength(140).IsRequired();
            entity.Property(x => x.Email).HasMaxLength(180).IsRequired();
            entity.Property(x => x.Phone).HasMaxLength(30).IsRequired();
            entity.Property(x => x.PasswordHash).HasMaxLength(512).IsRequired();
            entity.Property(x => x.Role).HasMaxLength(40).IsRequired();
            entity.HasIndex(x => x.Email).IsUnique();
            entity.HasOne(x => x.Merchant)
                .WithMany(x => x.Users)
                .HasForeignKey(x => x.MerchantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.ToTable("Products");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Image).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Name).HasMaxLength(180).IsRequired();
            entity.Property(x => x.Category).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Price).HasPrecision(18, 2);
            entity.HasOne(x => x.Merchant)
                .WithMany(x => x.Products)
                .HasForeignKey(x => x.MerchantId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(x => x.ModifierGroups)
                .WithMany(x => x.Products)
                .UsingEntity<Dictionary<string, object>>(
                    "ModifierGroupProduct",
                    j => j.HasOne<ModifierGroup>().WithMany().HasForeignKey("ModifierGroupsId").OnDelete(DeleteBehavior.Cascade),
                    j => j.HasOne<Product>().WithMany().HasForeignKey("ProductsId").OnDelete(DeleteBehavior.NoAction),
                    j => j.ToTable("ModifierGroupProduct", "pedihub")
                );
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.ToTable("Orders");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Channel).HasMaxLength(30).IsRequired();
            entity.Property(x => x.CustomerName).HasMaxLength(180).IsRequired();
            entity.Property(x => x.Total).HasPrecision(18, 2);
            entity.Property(x => x.DeliveryFee).HasPrecision(18, 2);
            entity.Property(x => x.ChangeFor).HasPrecision(18, 2);
            entity.Property(x => x.Status).HasMaxLength(30).IsRequired();
            entity.Property(x => x.Payment).HasMaxLength(30).IsRequired();
            entity.Property(x => x.Address).HasMaxLength(240);
            entity.Property(x => x.CouponCode).HasMaxLength(30);
            entity.Property(x => x.CouponDiscount).HasPrecision(18, 2);
            entity.HasIndex(x => new { x.MerchantId, x.Number }).IsUnique();
            entity.HasOne(x => x.Merchant)
                .WithMany(x => x.Orders)
                .HasForeignKey(x => x.MerchantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.ToTable("OrderItems");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Name).HasMaxLength(180).IsRequired();
            entity.Property(x => x.UnitPrice).HasPrecision(18, 2);
            entity.HasOne(x => x.Order)
                .WithMany(x => x.Items)
                .HasForeignKey(x => x.OrderId)
                .OnDelete(DeleteBehavior.Cascade);
            entity.HasMany(x => x.Modifiers)
                .WithOne()
                .HasForeignKey(x => x.OrderItemId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<OrderItemModifier>(entity =>
        {
            entity.ToTable("OrderItemModifiers");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Price).HasPrecision(18, 2);
        });

        modelBuilder.Entity<LoyaltyProgram>(entity =>
        {
            entity.ToTable("LoyaltyPrograms", "pedihub");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.PointsPerReal).HasPrecision(18, 2);
            entity.Property(x => x.MinPointsToRedeem).HasPrecision(18, 2);
            entity.Property(x => x.RedeemValue).HasPrecision(18, 2);
        });

        modelBuilder.Entity<LoyaltyPoint>(entity =>
        {
            entity.ToTable("LoyaltyPoints", "pedihub");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Points).HasPrecision(18, 2);
        });

        modelBuilder.Entity<ModifierGroup>(entity =>
        {
            entity.ToTable("ModifierGroups", "pedihub");
            entity.HasKey(x => x.Id);
            entity.HasOne<Merchant>()
                .WithMany()
                .HasForeignKey(x => x.MerchantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ModifierOption>(entity =>
        {
            entity.ToTable("ModifierOptions", "pedihub");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Price).HasPrecision(18, 2);
            entity.HasOne<ModifierGroup>()
                .WithMany(x => x.Options)
                .HasForeignKey(x => x.ModifierGroupId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<IntegrationConnection>(entity =>
        {
            entity.ToTable("Integrations", "pedihub");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Type).HasMaxLength(50).IsRequired();
            entity.Property(x => x.Name).HasMaxLength(100).IsRequired();
            entity.Property(x => x.Description).HasMaxLength(240).IsRequired();
            entity.Property(x => x.Emoji).HasMaxLength(20).IsRequired();
            entity.Property(x => x.Status).HasMaxLength(20).IsRequired();
            entity.HasIndex(x => new { x.MerchantId, x.Type }).IsUnique();
            entity.HasOne(x => x.Merchant)
                .WithMany(x => x.Integrations)
                .HasForeignKey(x => x.MerchantId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<MerchantTable>(entity =>
        {
            entity.ToTable("MerchantTables", "pedihub");
            entity.HasKey(x => x.Id);
        });

        modelBuilder.Entity<ActivationToken>(entity =>
        {
            entity.ToTable("ActivationTokens", "pedihub");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Code).HasMaxLength(30).IsRequired();
            entity.HasIndex(x => x.Code).IsUnique();
        });
        
        modelBuilder.Entity<Coupon>(entity =>
        {
            entity.ToTable("Coupons", "pedihub");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Code).HasMaxLength(30).IsRequired();
            entity.Property(x => x.Type).HasMaxLength(20).IsRequired();
            entity.Property(x => x.DiscountAmount).HasPrecision(18, 2);
            entity.Property(x => x.MinOrderValue).HasPrecision(18, 2);
            entity.HasIndex(x => new { x.MerchantId, x.Code }).IsUnique();
            entity.HasOne<Merchant>()
                .WithMany()
                .HasForeignKey(x => x.MerchantId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
