using System.Text.Json.Serialization;

namespace PosProSuite.Api.Models;

public class ProductEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string CategoryId { get; set; } = string.Empty;
    public string? Subcategory { get; set; }
    public string Image { get; set; } = string.Empty;
    public bool Available { get; set; }
    public int StockQuantity { get; set; } = 0;
    public string? Barcode { get; set; }
}

public class CategoryEntity
{
    public string Id { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;
    public ICollection<SubcategoryEntity> Subcategories { get; set; } = new List<SubcategoryEntity>();
}

public class SubcategoryEntity
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string CategoryId { get; set; } = string.Empty;
    public CategoryEntity? Category { get; set; }
}

public class OrderEntity
{
    public int Id { get; set; }
    public string OrderNumber { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string Status { get; set; } = "Active";
    public decimal TotalAmount { get; set; }
    public string PaymentMethod { get; set; } = "Cash";
    public string? CashierName { get; set; } = "Staff";
    public string? CashierEmail { get; set; } = string.Empty;
    public ICollection<OrderItemEntity> Items { get; set; } = new List<OrderItemEntity>();
}

public class OrderItemEntity
{
    public int Id { get; set; }
    public int OrderId { get; set; }
    public OrderEntity? Order { get; set; }
    public int ProductId { get; set; }
    public ProductEntity? Product { get; set; }
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
}

public class StockLogEntity
{
    public int Id { get; set; }
    public int ProductId { get; set; }
    public ProductEntity? Product { get; set; }
    public int QuantityChange { get; set; }   // +ve = stock added, -ve = sold/deducted
    public string Reason { get; set; } = "Sale"; // "Sale", "StockIn", "Adjustment"
    public DateTime CreatedAt { get; set; }
}

public class UserEntity
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "employee";
}
