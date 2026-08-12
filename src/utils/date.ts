/**
 * Add days to a date.
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);

  result.setDate(result.getDate() + days);

  return result;
}

/**
 * Add minutes to a date.
 */
export function addMinutes(date: Date, minutes: number): Date {
  const result = new Date(date);

  result.setMinutes(result.getMinutes() + minutes);

  return result;
}
