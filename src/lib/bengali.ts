// Bengali numeral converter and price formatter
const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

export function toBengaliNum(num: number | string): string {
  return String(num).replace(/\d/g, (d) => bengaliDigits[parseInt(d)]);
}

export function formatBengaliPrice(price: number): string {
  const formatted = price.toLocaleString('en-IN');
  return toBengaliNum(formatted);
}
