using Microsoft.EntityFrameworkCore;
using PosProSuite.Api.Models;

namespace PosProSuite.Api.Data;

public static class DbSeeder
{
    public static async Task SeedAsync(PosDbContext context)
    {
        await context.Database.EnsureCreatedAsync();

        if (!await context.Categories.AnyAsync())
        {
            var categories = new List<CategoryEntity>
            {
                new() { Id = "all",         Name = "All Items",   Icon = "🛒" },
                new() { Id = "snacks",      Name = "Snacks",      Icon = "🍟" },
                new() { Id = "drinks",      Name = "Drinks",      Icon = "🥤" },
                new() { Id = "biscuits",    Name = "Biscuits",    Icon = "🍪" },
                new() { Id = "stationery",  Name = "Stationery",  Icon = "✏️" },
                new() { Id = "dairy",       Name = "Dairy",       Icon = "🥛" },
                new() { Id = "confectionery", Name = "Sweets",    Icon = "🍬" },
            };

            context.Categories.AddRange(categories);

            var subcategories = new List<SubcategoryEntity>
            {
                new() { Name = "Chips",      CategoryId = "snacks" },
                new() { Name = "Nuts",       CategoryId = "snacks" },
                new() { Name = "Noodles",    CategoryId = "snacks" },
                new() { Name = "Cold",       CategoryId = "drinks" },
                new() { Name = "Hot",        CategoryId = "drinks" },
                new() { Name = "Energy",     CategoryId = "drinks" },
                new() { Name = "Cream",      CategoryId = "biscuits" },
                new() { Name = "Plain",      CategoryId = "biscuits" },
                new() { Name = "Pens",       CategoryId = "stationery" },
                new() { Name = "Notebooks",  CategoryId = "stationery" },
                new() { Name = "Erasers",    CategoryId = "stationery" },
                new() { Name = "Milk",       CategoryId = "dairy" },
                new() { Name = "Yogurt",     CategoryId = "dairy" },
                new() { Name = "Candy",      CategoryId = "confectionery" },
                new() { Name = "Chocolate",  CategoryId = "confectionery" },
                new() { Name = "Gum",        CategoryId = "confectionery" },
            };

            context.Subcategories.AddRange(subcategories);
            await context.SaveChangesAsync();
        }

        if (!await context.Products.AnyAsync())
        {
            var products = new List<ProductEntity>
            {
                // Snacks
                new() { Id = 1,  Name = "Lays Classic",       Price = 30,  CategoryId = "snacks",      Subcategory = "Chips",     Image = "🥔", Available = true,  StockQuantity = 50, Barcode = "8901234560001" },
                new() { Id = 2,  Name = "Kurkure Masala",     Price = 20,  CategoryId = "snacks",      Subcategory = "Chips",     Image = "🌽", Available = true,  StockQuantity = 60, Barcode = "8901234560002" },
                new() { Id = 3,  Name = "Pringles Original",  Price = 150, CategoryId = "snacks",      Subcategory = "Chips",     Image = "🍟", Available = true,  StockQuantity = 20, Barcode = "8901234560003" },
                new() { Id = 4,  Name = "Peanuts Salted",     Price = 25,  CategoryId = "snacks",      Subcategory = "Nuts",      Image = "🥜", Available = true,  StockQuantity = 40, Barcode = "8901234560004" },
                new() { Id = 5,  Name = "Indomie Noodles",    Price = 35,  CategoryId = "snacks",      Subcategory = "Noodles",   Image = "🍜", Available = true,  StockQuantity = 30, Barcode = "8901234560005" },

                // Drinks
                new() { Id = 6,  Name = "Coca Cola 500ml",    Price = 60,  CategoryId = "drinks",      Subcategory = "Cold",      Image = "🥤", Available = true,  StockQuantity = 48, Barcode = "5449000000996" },
                new() { Id = 7,  Name = "Pepsi 500ml",        Price = 60,  CategoryId = "drinks",      Subcategory = "Cold",      Image = "🥤", Available = true,  StockQuantity = 36, Barcode = "4890008100309" },
                new() { Id = 8,  Name = "Mineral Water 500ml",Price = 30,  CategoryId = "drinks",      Subcategory = "Cold",      Image = "💧", Available = true,  StockQuantity = 100,Barcode = "8901234560008" },
                new() { Id = 9,  Name = "Red Bull 250ml",     Price = 150, CategoryId = "drinks",      Subcategory = "Energy",    Image = "⚡", Available = true,  StockQuantity = 24, Barcode = "9002490100070" },
                new() { Id = 10, Name = "Nescafe Sachet",     Price = 25,  CategoryId = "drinks",      Subcategory = "Hot",       Image = "☕", Available = true,  StockQuantity = 80, Barcode = "8901234560010" },
                new() { Id = 11, Name = "Lipton Tea Bag",     Price = 10,  CategoryId = "drinks",      Subcategory = "Hot",       Image = "🍵", Available = true,  StockQuantity = 100,Barcode = "8901234560011" },

                // Biscuits
                new() { Id = 12, Name = "Oreo Original",      Price = 50,  CategoryId = "biscuits",    Subcategory = "Cream",     Image = "🍪", Available = true,  StockQuantity = 40, Barcode = "7622210713780" },
                new() { Id = 13, Name = "Hide & Seek",        Price = 30,  CategoryId = "biscuits",    Subcategory = "Cream",     Image = "🍪", Available = true,  StockQuantity = 35, Barcode = "8901234560013" },
                new() { Id = 14, Name = "Marie Gold",         Price = 25,  CategoryId = "biscuits",    Subcategory = "Plain",     Image = "🫓", Available = true,  StockQuantity = 50, Barcode = "8901234560014" },

                // Stationery
                new() { Id = 15, Name = "Ball Pen Blue",      Price = 10,  CategoryId = "stationery",  Subcategory = "Pens",      Image = "✏️", Available = true,  StockQuantity = 100,Barcode = "8901234560015" },
                new() { Id = 16, Name = "Ball Pen Black",     Price = 10,  CategoryId = "stationery",  Subcategory = "Pens",      Image = "🖊️", Available = true,  StockQuantity = 100,Barcode = "8901234560016" },
                new() { Id = 17, Name = "Eraser White",       Price = 5,   CategoryId = "stationery",  Subcategory = "Erasers",   Image = "🧹", Available = true,  StockQuantity = 80, Barcode = "8901234560017" },
                new() { Id = 18, Name = "A4 Notebook",        Price = 80,  CategoryId = "stationery",  Subcategory = "Notebooks", Image = "📓", Available = true,  StockQuantity = 25, Barcode = "8901234560018" },

                // Dairy
                new() { Id = 19, Name = "Milk Pouch 500ml",   Price = 55,  CategoryId = "dairy",       Subcategory = "Milk",      Image = "🥛", Available = true,  StockQuantity = 20, Barcode = "8901234560019" },
                new() { Id = 20, Name = "Yogurt Cup",         Price = 45,  CategoryId = "dairy",       Subcategory = "Yogurt",    Image = "🍦", Available = true,  StockQuantity = 15, Barcode = "8901234560020" },

                // Confectionery
                new() { Id = 21, Name = "Kit Kat",            Price = 50,  CategoryId = "confectionery",Subcategory = "Chocolate", Image = "🍫", Available = true,  StockQuantity = 40, Barcode = "5000159484695" },
                new() { Id = 22, Name = "Dairy Milk",         Price = 60,  CategoryId = "confectionery",Subcategory = "Chocolate", Image = "🍫", Available = true,  StockQuantity = 35, Barcode = "7622210313231" },
                new() { Id = 23, Name = "Mint Gum",           Price = 20,  CategoryId = "confectionery",Subcategory = "Gum",       Image = "🍬", Available = true,  StockQuantity = 60, Barcode = "8901234560023" },
                new() { Id = 24, Name = "Mixed Candy Bag",    Price = 30,  CategoryId = "confectionery",Subcategory = "Candy",     Image = "🍭", Available = true,  StockQuantity = 45, Barcode = "8901234560024" },
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
                new() { Email = "admin@tuckshop.com",  PasswordHash = "admin123", Role = "admin" },
                new() { Email = "cashier@tuckshop.com",PasswordHash = "cash123",  Role = "employee" }
            };

            context.Users.AddRange(users);
        }

        if (!await context.Settings.AnyAsync())
        {
            context.Settings.Add(new SettingsEntity
            {
                ShopName = "TuckShop POS",
                Tagline = "Quick & Easy Counter Sales",
                Phone = "+92 300 0000000",
                Email = "admin@tuckshop.com",
                Address = "School Campus, Block A",
                Currency = "PKR",
                CurrencySymbol = "Rs",
                GstRate = 18,
                LowStockThreshold = 5,
                ReceiptFooter = "Thank you for your purchase!",
                UpdatedAt = DateTime.UtcNow
            });
        }

        await context.SaveChangesAsync();
    }
}
