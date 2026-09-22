// Generates a valid EAN-13 style 13-digit barcode with check digit.
// Uses random country + manufacturer seed + 5 random product digits + Luhn-ish check digit.
export const generateBarcode = (productId?: number): string => {
  const countryCode = '890'; // India / Pakistan region prefix for generic FMCG
  const mfrCode = '12345';   // In future this could be stored per-supplier

  // If productId provided, use padded, otherwise random
  let itemRef: string;
  if (productId) {
    itemRef = String(productId).padStart(5, '0').slice(-5);
  } else {
    itemRef = Math.floor(10000 + Math.random() * 89999).toString();
  }

  const first12 = `${countryCode}${mfrCode}${itemRef}`;

  // EAN-13 check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(first12[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const check = (10 - (sum % 10)) % 10;
  return `${first12}${check}`;
};
