// Helper to extract unique spanned calendar years between start and end dates
export function calculateSpannedYears(startDate: string | Date, endDate: string | Date): number[] {
  const start = new Date(startDate).getFullYear();
  const end = new Date(endDate).getFullYear();
  const years: number[] = [];
  for (let y = start; y <= end; y++) {
    years.push(y);
  }
  return years;
}