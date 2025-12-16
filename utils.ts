export const formatNumber = (num: number | undefined | null): string => {
  if (num === undefined || num === null || isNaN(num)) return '-';
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const getTodayDateString = (): string => {
  return new Date().toLocaleDateString('en-US', { month: '2-digit', day: '2-digit' });
};