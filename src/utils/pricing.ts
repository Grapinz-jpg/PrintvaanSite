/**
 * Calculates the price per square foot based on tiered logic for "Normal flex"
 * @param sqft Total square footage
 * @returns Price per square foot in ₹
 */
export const calculateNormalFlexPrice = (sqft: number): number => {
  if (sqft <= 12) return 12;
  if (sqft <= 30) return 10;
  if (sqft <= 50) return 8;
  if (sqft <= 80) return 7.5;
  if (sqft <= 500) return 7;
  if (sqft <= 1000) return 6.5;
  return 6;
};

/**
 * General price calculator
 * @param width Width in feet
 * @param height Height in feet
 * @param category Product category
 * @param basePrice Default base price if not tiered
 * @returns Total price and price per unit
 */
export const calculatePrice = (
  width: number,
  height: number,
  category: string,
  basePrice: number
) => {
  const sqft = width * height;
  let pricePerSqft = basePrice;

  if (category === 'Normal flex') {
    pricePerSqft = calculateNormalFlexPrice(sqft);
  }

  return {
    sqft,
    pricePerSqft,
    totalPrice: sqft * pricePerSqft,
  };
};
