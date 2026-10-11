# TuckShop POS — Small ERP Inventory (Recipe / BOM) System

## Overview

Small ERP style inventory system jo **Bill of Materials (BOM)** concept use karta hai. Har saleable product ke neeche uske ingredients (raw materials) define hote hain. Jab koi product sell hota hai, us product ka apna stock + uske saare ingredients ka stock automatically minus ho jata hai.

### Real-World Example

```
Fruit Chaat (Saleable Product)
  ├── 1 × Plate (Ingredient)
  ├── 1 × Spoon (Ingredient)
  └── 1 × Tissue Paper (Ingredient)
```

Jab cashier 2x Fruit Chaat sell karega:
- Fruit Chaat stock: **-2**
- Plate stock: **-2**
- Spoon stock: **-2**
- Tissue Paper stock: **-2**

---

## Data Model

### Product Types

Har product ka ek `ProductType` field hota hai:

| Value | Description | POS Visibility |
|-------|-------------|----------------|
| `Saleable` | Jo product counter pe sale hota hai (Lays, Fruit Chaat, etc.) | ✅ Dikhta hai |
| `Ingredient` | Raw material (Plate, Spoon, Straw, Glass) | ❌ Hide hai |

> Default `ProductType` = `Saleable`. Existing products (jinka ProductType empty hai) bhi Saleable hi treat hote hain.

### RecipeItemEntity (BOM Table)

```csharp
public class RecipeItemEntity
{
    public int Id { get; set; }
    public int ProductId { get; set; }      // Parent saleable product (Fruit Chaat)
    public int IngredientId { get; set; }    // Ingredient product (Plate)
    public decimal Quantity { get; set; }    // 1 plate per Fruit Chaat
}
```

---

## API Endpoints

### Products — Type Filter

```
GET /api/products?type=Saleable     # Sirf saleable items (POS ke liye)
GET /api/products?type=Ingredient   # Sirf ingredients
GET /api/products?type=all          # Sab (Admin inventory ke liye)
```

Default `type=Saleable`. Response mein `productType` field bhi aati hai.

### Recipe / BOM Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/recipe/{productId}` | Get all ingredients of a product |
| `POST` | `/api/recipe` | Add ingredient to product recipe |
| `PUT` | `/api/recipe/{id}` | Update ingredient quantity |
| `DELETE` | `/api/recipe/{id}` | Remove ingredient from recipe |

**POST /api/recipe** body:
```json
{
  "productId": 5,
  "ingredientId": 30,
  "quantity": 1
}
```

> Agar same product-ingredient pair already exist karta hai toh quantity add ho jati hai (merge).

---

## Stock Deduction Logic

### On Sale (`OrdersController.CompleteOrder`)

Jab order complete hota hai, har sold item ke liye:

1. **Product stock minus** — existing behavior (jaise abhi hota hai)
2. **Recipe load karo** — us product ke saare `RecipeItem`s fetch karo
3. **Har ingredient ka stock minus** — `ingredient.StockQuantity -= recipe.Quantity × item.Quantity`
4. **Stock logs** — har deduction ke liye `StockLogEntity` create hota hai

Stock log reasons:
- Product: `"Sale"`
- Ingredient: `"Sale (Fruit Chaat)"`

### On Return (`OrdersController.ReturnOrderItems`)

Return par reverse process:
- Product stock wapas add
- Saare ingredients ka stock bhi wapas add
- Stock log reason: `"Return (Fruit Chaat) Order #TK-..."`

> Decimal quantities ke liye `Math.Ceiling` use hota hai (e.g. 0.5 plate × 3 sales = 2 plates deduct).

---

## Frontend UI

### Inventory Tab — 3 Sub-Tabs

Admin Dashboard → Inventory ke andar 3 sub-tabs hain:

#### 1. Products 📦
- Saleable products ki grid
- Har product card pe **"📋 Recipe"** button hai
- Add Stock, Edit, Labels buttons

#### 2. Ingredients 🥄
- Sirf `ProductType = Ingredient` wale products
- "Add Ingredient" button se naya ingredient add karo
- Product Type automatically "Ingredient" set hota hai

#### 3. Recipes (BOM) 📋
- Sab saleable products ki list dikhti hai
- Koi bhi product select karo → uski recipe manage karo
- "Add Ingredient" → ingredient dropdown + quantity input
- Table mein ingredient name, quantity used, current stock dikhta hai
- Delete button se ingredient recipe se hatao

### Product Add/Edit Modal
- Naya **"Product Type"** dropdown added:
  - `Saleable Item (shown in POS)`
  - `Ingredient / Raw Material (hidden in POS)`

### POS Screen (`OrderScreen`)
- Sirf `Saleable` products dikhte hain
- Ingredients POS pe kabhi nahi dikhte (backend `type=Saleable` filter + frontend client-side filter)

---

## Step-by-Step Setup

1. **Ingredients add karo**
   - Admin → Inventory → **Ingredients** tab
   - "Add Ingredient" → naam, price, stock, Product Type = Ingredient
   - Example: Plate, Spoon, Straw, Glass, Tissue Paper

2. **Recipe define karo**
   - Admin → Inventory → **Recipes (BOM)** tab
   - Saleable product select karo (e.g. Fruit Chaat)
   - "Add Ingredient" → Plate, quantity = 1
   - Repeat: Spoon = 1, Tissue = 1

3. **Stock add karo ingredients mein**
   - Ingredients tab → "Add Stock" button
   - Plates: 100, Spoons: 200, etc.

4. **POS pe sell karo**
   - Cashier → Fruit Chaat add to cart → checkout
   - Backend automatically sab stock deduct kar dega

5. **Verify**
   - Admin → Inventory → Ingredients tab mein stock check karo
   - Stock logs mein `Sale (Fruit Chaat)` entries dikhengi

---

## Low Stock Alerts

Ingredients bhi low stock alert mein include hain:
- `StockQuantity <= 5` → Orange alert
- `StockQuantity == 0` → Red "Out of Stock"

Dashboard "Low Stock Alerts" KPI mein ingredients bhi count hote hain.

---

## Files Changed

### Backend

| File | Change |
|------|--------|
| `backend/Models/Entities.cs` | `ProductType` field + `RecipeItemEntity` |
| `backend/Data/PosDbContext.cs` | `RecipeItems` DbSet + FK relations (Restrict) |
| `backend/Controllers/RecipeController.cs` | **New** — Recipe CRUD |
| `backend/Controllers/OrdersController.cs` | Recipe-based stock deduction (sale + return) |
| `backend/Controllers/ProductsController.cs` | `type` query filter + `productType` in response |
| `backend/Migrations/20261011121630_RecipeBom.cs` | `ProductType` column + `RecipeItems` table |

### Frontend

| File | Change |
|------|--------|
| `src/lib/mock-data.ts` | `productType` field in `Product` interface |
| `src/pages/AdminDashboard.tsx` | 3 inventory sub-tabs + Recipe manager UI + Product Type dropdown |
| `src/pages/OrderScreen.tsx` | Filter ingredients from POS display |

---

## Migration

```bash
# Already created:
dotnet ef migrations add RecipeBom --project backend/PosProSuite.Api.csproj

# Apply to database:
dotnet ef database update --project backend/PosProSuite.Api.csproj
```

Ya agar `Program.cs` mein auto-migration enabled hai toh backend run karte hi apply ho jayega.

---

## Notes

- **Existing products** ka `ProductType` empty hoga → frontend aur backend dono ise `Saleable` treat karte hain
- **Custom open items** (POS mein manual entry) ka stock track nahi hota (existing behavior)
- **Delete restrict** — agar koi ingredient recipe mein use ho raha hai toh us product ko delete nahi kar sakte (FK constraint)
- **Decimal quantities** support — e.g. 0.5 liter milk per cup (Math.Ceiling se round hota hai stock deduction mein)
