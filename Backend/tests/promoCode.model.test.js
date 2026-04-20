const { PromoCode } = require("../Model/PromoCode_model");

describe("PromoCode business logic", () => {
  test("isValid rejects orders that do not meet the minimum amount", () => {
    const promoCode = new PromoCode({
      code: "SAVE20",
      discountType: "percentage",
      discountValue: 20,
      minAmount: 500,
      validFrom: new Date(Date.now() - 60_000),
      validUntil: new Date(Date.now() + 60_000),
    });

    const result = promoCode.isValid(300);

    expect(result).toMatchObject({ valid: false });
    expect(result.error).toContain("500");
  });

  test("isValid rejects promo codes that have reached their usage limit", () => {
    const promoCode = new PromoCode({
      code: "LIMITED",
      discountType: "fixed",
      discountValue: 100,
      usageLimit: 2,
      usedCount: 2,
      validFrom: new Date(Date.now() - 60_000),
      validUntil: new Date(Date.now() + 60_000),
    });

    expect(promoCode.isValid(800)).toEqual({
      valid: false,
      error: "Promo code usage limit reached",
    });
  });

  test("calculateDiscount caps percentage discounts using maxDiscount", () => {
    const promoCode = new PromoCode({
      code: "BIGSAVE",
      discountType: "percentage",
      discountValue: 25,
      maxDiscount: 150,
      validUntil: new Date(Date.now() + 60_000),
    });

    expect(promoCode.calculateDiscount(1_000)).toBe(150);
  });

  test("calculateDiscount never lets a fixed discount exceed the order total", () => {
    const promoCode = new PromoCode({
      code: "FLAT500",
      discountType: "fixed",
      discountValue: 500,
      validUntil: new Date(Date.now() + 60_000),
    });

    expect(promoCode.calculateDiscount(320)).toBe(320);
  });
});
