using Microsoft.EntityFrameworkCore;
using PosProSuite.Api.Models;

namespace PosProSuite.Api.Data;

public class PosDbContext : DbContext
{
    public PosDbContext(DbContextOptions<PosDbContext> options) : base(options)
    {
    }

    public DbSet<ProductEntity> Products => Set<ProductEntity>();
    public DbSet<CategoryEntity> Categories => Set<CategoryEntity>();
    public DbSet<SubcategoryEntity> Subcategories => Set<SubcategoryEntity>();
    public DbSet<OrderEntity> Orders => Set<OrderEntity>();
    public DbSet<OrderItemEntity> OrderItems => Set<OrderItemEntity>();
    public DbSet<StockLogEntity> StockLogs => Set<StockLogEntity>();
    public DbSet<UserEntity> Users => Set<UserEntity>();
    public DbSet<SettingsEntity> Settings => Set<SettingsEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<CategoryEntity>()
            .HasMany(c => c.Subcategories)
            .WithOne(s => s.Category)
            .HasForeignKey(s => s.CategoryId);

        modelBuilder.Entity<OrderEntity>()
            .HasMany(o => o.Items)
            .WithOne(i => i.Order)
            .HasForeignKey(i => i.OrderId);

        modelBuilder.Entity<StockLogEntity>()
            .HasOne(s => s.Product)
            .WithMany()
            .HasForeignKey(s => s.ProductId);
    }
}
