using Microsoft.EntityFrameworkCore;
using PosProSuite.Api.Models;

namespace PosProSuite.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(PosDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        if (!await context.Tables.AnyAsync())
        {
            var tables = new List<TableEntity>
            {
                new() { Id = 1, Name = "T1", Status = "available", Capacity = 4 },
                new() { Id = 2, Name = "T2", Status = "occupied", Capacity = 4, OrderTotal = 1250, ElapsedMinutes = 32, OrderId = "ORD-2041" },
                new() { Id = 3, Name = "T3", Status = "occupied", Capacity = 6, OrderTotal = 890, ElapsedMinutes = 15, OrderId = "ORD-2042" },
                new() { Id = 4, Name = "T4", Status = "available", Capacity = 2 },
                new() { Id = 5, Name = "T5", Status = "reserved", Capacity = 4 },
                new() { Id = 6, Name = "T6", Status = "available", Capacity = 6 },
                new() { Id = 7, Name = "T7", Status = "occupied", Capacity = 4, OrderTotal = 2100, ElapsedMinutes = 48, OrderId = "ORD-2039" },
                new() { Id = 8, Name = "T8", Status = "available", Capacity = 2 },
                new() { Id = 9, Name = "T9", Status = "reserved", Capacity = 8 },
                new() { Id = 10, Name = "T10", Status = "available", Capacity = 4 }
            };

            using (var transaction = await context.Database.BeginTransactionAsync())
            {
                await context.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT [Tables] ON");
                context.Tables.AddRange(tables);
                await context.SaveChangesAsync();
                await context.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT [Tables] OFF");
                await transaction.CommitAsync();
            }
        }

        if (!await context.Categories.AnyAsync())
        {
            var categories = new List<CategoryEntity>
            {
                new() { Id = "all", Name = "All Items", Icon = "🍽️" },
                new() { Id = "starters", Name = "Starters", Icon = "🥗" },
                new() { Id = "mains", Name = "Main Course", Icon = "🍖" },
                new() { Id = "pizza", Name = "Pizza", Icon = "🍕" },
                new() { Id = "burgers", Name = "Burgers", Icon = "🍔" },
                new() { Id = "beverages", Name = "Beverages", Icon = "🥤" },
                new() { Id = "desserts", Name = "Desserts", Icon = "🍰" }
            };

            context.Categories.AddRange(categories);

            var subcategories = new List<SubcategoryEntity>
            {
                new() { Name = "Soups", CategoryId = "starters" },
                new() { Name = "Salads", CategoryId = "starters" },
                new() { Name = "Appetizers", CategoryId = "starters" },
                new() { Name = "Chicken", CategoryId = "mains" },
                new() { Name = "Seafood", CategoryId = "mains" },
                new() { Name = "Vegetarian", CategoryId = "mains" },
                new() { Name = "Classic", CategoryId = "pizza" },
                new() { Name = "Premium", CategoryId = "pizza" },
                new() { Name = "Beef", CategoryId = "burgers" },
                new() { Name = "Chicken", CategoryId = "burgers" },
                new() { Name = "Veggie", CategoryId = "burgers" },
                new() { Name = "Hot", CategoryId = "beverages" },
                new() { Name = "Cold", CategoryId = "beverages" },
                new() { Name = "Juices", CategoryId = "beverages" },
                new() { Name = "Cakes", CategoryId = "desserts" },
                new() { Name = "Ice Cream", CategoryId = "desserts" }
            };

            context.Subcategories.AddRange(subcategories);
        }

        if (!await context.Products.AnyAsync())
        {
            var products = new List<ProductEntity>
            {
                new() { Id = 1, Name = "Caesar Salad", Price = 320, CategoryId = "starters", Subcategory = "Salads", Image = "🥗", Available = true },
                new() { Id = 2, Name = "Tomato Soup", Price = 220, CategoryId = "starters", Subcategory = "Soups", Image = "🍲", Available = true },
                new() { Id = 3, Name = "Spring Rolls", Price = 280, CategoryId = "starters", Subcategory = "Appetizers", Image = "🥟", Available = true },
                new() { Id = 4, Name = "Grilled Chicken", Price = 550, CategoryId = "mains", Subcategory = "Chicken", Image = "🍗", Available = true },
                new() { Id = 5, Name = "Butter Chicken", Price = 480, CategoryId = "mains", Subcategory = "Chicken", Image = "🍛", Available = true },
                new() { Id = 6, Name = "Fish & Chips", Price = 520, CategoryId = "mains", Subcategory = "Seafood", Image = "🐟", Available = true },
                new() { Id = 7, Name = "Paneer Tikka", Price = 380, CategoryId = "mains", Subcategory = "Vegetarian", Image = "🧀", Available = true },
                new() { Id = 8, Name = "Margherita Pizza", Price = 420, CategoryId = "pizza", Subcategory = "Classic", Image = "🍕", Available = true },
                new() { Id = 9, Name = "Pepperoni Pizza", Price = 520, CategoryId = "pizza", Subcategory = "Classic", Image = "🍕", Available = true },
                new() { Id = 10, Name = "BBQ Chicken Pizza", Price = 580, CategoryId = "pizza", Subcategory = "Premium", Image = "🍕", Available = false },
                new() { Id = 11, Name = "Classic Burger", Price = 350, CategoryId = "burgers", Subcategory = "Beef", Image = "🍔", Available = true },
                new() { Id = 12, Name = "Cheese Burger", Price = 400, CategoryId = "burgers", Subcategory = "Beef", Image = "🍔", Available = true },
                new() { Id = 13, Name = "Chicken Burger", Price = 380, CategoryId = "burgers", Subcategory = "Chicken", Image = "🍔", Available = true },
                new() { Id = 14, Name = "Espresso", Price = 150, CategoryId = "beverages", Subcategory = "Hot", Image = "☕", Available = true },
                new() { Id = 15, Name = "Iced Latte", Price = 200, CategoryId = "beverages", Subcategory = "Cold", Image = "🧊", Available = true },
                new() { Id = 16, Name = "Fresh Orange Juice", Price = 180, CategoryId = "beverages", Subcategory = "Juices", Image = "🍊", Available = true },
                new() { Id = 17, Name = "Chocolate Cake", Price = 280, CategoryId = "desserts", Subcategory = "Cakes", Image = "🍫", Available = true },
                new() { Id = 18, Name = "Vanilla Ice Cream", Price = 180, CategoryId = "desserts", Subcategory = "Ice Cream", Image = "🍨", Available = true }
            };

            using (var transaction = await context.Database.BeginTransactionAsync())
            {
                await context.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT [Products] ON");
                context.Products.AddRange(products);
                await context.SaveChangesAsync();
                await context.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT [Products] OFF");
                await transaction.CommitAsync();
            }
        }

        if (!await context.Users.AnyAsync())
        {
            var users = new List<UserEntity>
            {
                new() { Email = "admin@restaurant.com", PasswordHash = "admin123", Role = "admin" },
                new() { Email = "staff@restaurant.com", PasswordHash = "staff123", Role = "employee" }
            };

            context.Users.AddRange(users);
        }

        if (!await context.ChargeSettings.AnyAsync())
        {
            var settings = new ChargeSettingsEntity
            {
                TaxEnabled = true,
                TaxPercent = 5,
                ServiceEnabled = true,
                ServicePercent = 2
            };

            context.ChargeSettings.Add(settings);
        }

        await context.SaveChangesAsync();
    }
}
