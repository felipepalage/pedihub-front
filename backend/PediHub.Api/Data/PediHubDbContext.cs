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
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.ToTable("Orders");
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Channel).HasMaxLength(30).IsRequired();
            entity.Property(x => x.CustomerName).HasMaxLength(180).IsRequired();
            entity.Property(x => x.Total).HasPrecision(18, 2);
            entity.Property(x => x.Status).HasMaxLength(30).IsRequired();
            entity.Property(x => x.Payment).HasMaxLength(30).IsRequired();
            entity.Property(x => x.Address).HasMaxLength(240);
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
        });

        modelBuilder.Entity<IntegrationConnection>(entity =>
        {
            entity.ToTable("Integrations");
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
    }
}
