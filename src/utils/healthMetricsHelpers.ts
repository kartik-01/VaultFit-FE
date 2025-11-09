// Shared helper functions for health metric detail views

export function formatDate(dateString: string, format: 'short' | 'long'): string {
  const date = new Date(dateString);
  if (format === 'short') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export function formatMonth(monthKey: string): string {
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatWeekLabel(weekStartDate: string): string {
  const date = new Date(weekStartDate);
  const weekEnd = new Date(date);
  weekEnd.setDate(date.getDate() + 6);
  
  const startMonth = date.toLocaleDateString('en-US', { month: 'short' });
  const endMonth = weekEnd.toLocaleDateString('en-US', { month: 'short' });
  const startDay = date.getDate();
  const endDay = weekEnd.getDate();
  const year = date.getFullYear();
  
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}, ${year}`;
  } else {
    return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
  }
}

export function groupByWeek(data: Array<{ date: string; value: number }>): Array<{
  weekNumber: number;
  total: number;
  average: number;
  days: number;
  weekStartDate: string;
}> {
  const weeks = new Map<number, { total: number; count: number; weekStart: Date }>();
  
  data.forEach(item => {
    const date = new Date(item.date);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0);
    const weekKey = Math.floor(weekStart.getTime() / (1000 * 60 * 60 * 24 * 7));
    
    const existing = weeks.get(weekKey) || { total: 0, count: 0, weekStart };
    weeks.set(weekKey, {
      total: existing.total + item.value,
      count: existing.count + 1,
      weekStart: existing.weekStart,
    });
  });

  return Array.from(weeks.entries())
    .map(([weekKey, { total, count, weekStart }], idx) => ({
      weekNumber: Array.from(weeks.keys()).length - idx,
      total,
      average: total / count,
      days: count,
      weekStartDate: weekStart.toISOString().split('T')[0],
    }))
    .reverse();
}

export function groupByMonth(data: Array<{ date: string; value: number }>): Array<{
  month: string;
  total: number;
  average: number;
  days: number;
}> {
  const months = new Map<string, { total: number; count: number }>();
  
  data.forEach(item => {
    const date = new Date(item.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    
    const existing = months.get(monthKey) || { total: 0, count: 0 };
    months.set(monthKey, {
      total: existing.total + item.value,
      count: existing.count + 1,
    });
  });

  return Array.from(months.entries())
    .map(([month, { total, count }]) => ({
      month,
      total,
      average: total / count,
      days: count,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function groupByYear(data: Array<{ date: string; value: number }>): Array<{
  year: number;
  total: number;
  average: number;
  days: number;
  bestDay: number;
  bestDayDate: string;
}> {
  const years = new Map<number, { total: number; count: number; days: Array<{ date: string; value: number }> }>();
  
  data.forEach(item => {
    const date = new Date(item.date);
    const year = date.getFullYear();
    
    const existing = years.get(year) || { total: 0, count: 0, days: [] };
    years.set(year, {
      total: existing.total + item.value,
      count: existing.count + 1,
      days: [...existing.days, item],
    });
  });

  return Array.from(years.entries())
    .map(([year, { total, count, days }]) => {
      const bestDay = days.length > 0
        ? days.reduce((best, current) => 
            current.value > best.value ? current : best, 
            days[0]
          )
        : { value: 0, date: '' };
      return {
        year,
        total,
        average: total / count,
        days: count,
        bestDay: bestDay.value,
        bestDayDate: bestDay.date,
      };
    })
    .sort((a, b) => a.year - b.year);
}

