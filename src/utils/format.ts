export function formatMoney(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(n);
}

export function formatQty(n: number): string {
  return new Intl.NumberFormat('id-ID').format(n);
}
