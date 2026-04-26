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

export function formatDate(date: string, withTime = false): string {
  const options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  };

  if (withTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.second = '2-digit';
    options.hour12 = false;
  }

  const formatted = new Date(date).toLocaleDateString('id-ID', options);

  return formatted.replace(/\//g, '-').replace(',', '');
}