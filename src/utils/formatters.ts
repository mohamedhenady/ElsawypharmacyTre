export const formatCurrency = (amount: number | undefined | null, currency = 'ج.م'): string => {
  const val = Number(amount) || 0;
  return `${val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ${currency}`;
};

export const formatNumber = (val: number | undefined | null): string => {
  const num = Number(val) || 0;
  return num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

export const formatDateArabic = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};
