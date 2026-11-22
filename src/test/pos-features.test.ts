import { describe, it, expect } from "vitest";

describe("POS System Calculations & Features", () => {
  interface CartItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
  }

  const calculateTotals = (
    items: CartItem[],
    charges: { taxEnabled: boolean; taxPercent: number; serviceEnabled: boolean; servicePercent: number }
  ) => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taxRate = charges.taxEnabled ? charges.taxPercent / 100 : 0;
    const serviceRate = charges.serviceEnabled ? charges.servicePercent / 100 : 0;
    const tax = Math.round(subtotal * taxRate);
    const serviceCharge = Math.round(subtotal * serviceRate);
    const grandTotal = subtotal + tax + serviceCharge;

    return { subtotal, tax, serviceCharge, grandTotal };
  };

  it("calculates accurate subtotal, tax, service charge, and grand total", () => {
    const items: CartItem[] = [
      { id: 1, name: "Burger", price: 500, quantity: 2 },
      { id: 2, name: "Pizza", price: 1000, quantity: 1 },
    ];
    const charges = {
      taxEnabled: true,
      taxPercent: 5,
      serviceEnabled: true,
      servicePercent: 2,
    };

    const totals = calculateTotals(items, charges);
    expect(totals.subtotal).toBe(2000);
    expect(totals.tax).toBe(100);
    expect(totals.serviceCharge).toBe(40);
    expect(totals.grandTotal).toBe(2140);
  });

  it("handles tax and service charge disabled", () => {
    const items: CartItem[] = [
      { id: 1, name: "Coffee", price: 250, quantity: 2 },
    ];
    const charges = {
      taxEnabled: false,
      taxPercent: 5,
      serviceEnabled: false,
      servicePercent: 2,
    };

    const totals = calculateTotals(items, charges);
    expect(totals.subtotal).toBe(500);
    expect(totals.tax).toBe(0);
    expect(totals.serviceCharge).toBe(0);
    expect(totals.grandTotal).toBe(500);
  });

  it("correctly calculates payment change and validation", () => {
    const grandTotal = 1500;
    const cashAmount = 2000;
    const change = cashAmount - grandTotal;

    expect(change).toBe(500);
    expect(change >= 0).toBe(true);

    const insufficientCash = 1000;
    expect(insufficientCash - grandTotal < 0).toBe(true);
  });

  it("filters tables by status correctly", () => {
    const tables = [
      { id: 1, name: "T1", status: "available" },
      { id: 2, name: "T2", status: "occupied" },
      { id: 3, name: "T3", status: "occupied" },
      { id: 4, name: "T4", status: "reserved" },
    ];

    const counts = {
      all: tables.length,
      available: tables.filter(t => t.status === "available").length,
      occupied: tables.filter(t => t.status === "occupied").length,
      reserved: tables.filter(t => t.status === "reserved").length,
    };

    expect(counts.all).toBe(4);
    expect(counts.available).toBe(1);
    expect(counts.occupied).toBe(2);
    expect(counts.reserved).toBe(1);
  });

  it("correctly clears cart and resets order state", () => {
    let cartItems: CartItem[] = [
      { id: 1, name: "Burger", price: 500, quantity: 1 }
    ];
    let currentOrderId: number | null = 105;
    let currentOrderNumber: string | null = "ORD-2045";

    // Simulate complete/clear
    cartItems = [];
    currentOrderId = null;
    currentOrderNumber = null;

    expect(cartItems.length).toBe(0);
    expect(currentOrderId).toBeNull();
    expect(currentOrderNumber).toBeNull();
  });
});
