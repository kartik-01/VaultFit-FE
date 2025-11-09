import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Moon, TrendingUp, Target, Award, Lightbulb, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { formatDate, formatWeekLabel, formatMonth, groupByWeek, groupByMonth, groupByYear } from '../utils/healthMetricsHelpers';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface SleepDetailViewProps {
  sleepData: Array<{ date: string; deep: number; light: number; rem: number }>;
  onBack: () => void;
}

type TimeRange = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function SleepDetailView({ sleepData, onBack }: SleepDetailViewProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');
  const [error, setError] = useState<string | null>(null);
  
  // Convert sleep data to format compatible with grouping functions
  const convertedData = useMemo(() => {
    try {
      if (!sleepData || sleepData.length === 0) return [];
      return sleepData.map(item => ({
        date: item.date,
        value: item.deep + item.light + item.rem, // Total sleep hours
      }));
    } catch (err) {
      console.error('Error converting sleep data:', err);
      setError('Error processing sleep data');
      return [];
    }
  }, [sleepData]);
  
  const sortedData = useMemo(() => {
    try {
      if (!sleepData || sleepData.length === 0) return [];
      return [...sleepData].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    } catch (err) {
      console.error('Error sorting sleep data:', err);
      setError('Error processing sleep data');
      return [];
    }
  }, [sleepData]);
  
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [selectedYearIndex, setSelectedYearIndex] = useState(0);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  useEffect(() => {
    if (sortedData.length > 0) {
      try {
        setSelectedDateIndex(sortedData.length - 1);
        const weeks = groupByWeek(convertedData);
        if (weeks.length > 0) setSelectedWeekIndex(weeks.length - 1);
        const months = groupByMonth(convertedData);
        if (months.length > 0) setSelectedMonthIndex(months.length - 1);
        const years = groupByYear(convertedData);
        if (years.length > 0) setSelectedYearIndex(years.length - 1);
      } catch (error) {
        console.error('Error initializing date indices:', error);
      }
    }
  }, [sortedData.length, convertedData]);

  const processedData = useMemo(() => {
    try {
      if (!sortedData || sortedData.length === 0) return null;

      switch (timeRange) {
        case 'daily': {
          const totalDays = sortedData.length;
          const currentIndex = Math.max(0, Math.min(selectedDateIndex, totalDays - 1));
          const selectedDay = sortedData[currentIndex];
          
          const startIndex = Math.max(0, currentIndex - 3);
          const endIndex = Math.min(totalDays, currentIndex + 4);
          const visibleDays = sortedData.slice(startIndex, endIndex);
          
          return {
            chartData: visibleDays.map((item, idx) => ({
              date: formatDate(item.date, 'short'),
              deep: Math.round(item.deep * 10) / 10,
              light: Math.round(item.light * 10) / 10,
              rem: Math.round(item.rem * 10) / 10,
              total: Math.round((item.deep + item.light + item.rem) * 10) / 10,
              isSelected: startIndex + idx === currentIndex,
            })),
            selectedDay,
            currentIndex,
            totalDays,
            canGoPrev: currentIndex > 0,
            canGoNext: currentIndex < totalDays - 1,
            stats: {
              total: selectedDay ? (selectedDay.deep + selectedDay.light + selectedDay.rem) : 0,
              deep: selectedDay?.deep || 0,
              light: selectedDay?.light || 0,
              rem: selectedDay?.rem || 0,
              average: visibleDays.length > 0 
                ? visibleDays.reduce((sum, item) => sum + item.deep + item.light + item.rem, 0) / visibleDays.length 
                : 0,
            },
          };
        }
        case 'weekly': {
          const weeks = groupByWeek(convertedData);
          const totalWeeks = weeks.length;
          const currentWeekIndex = Math.max(0, Math.min(selectedWeekIndex, totalWeeks - 1));
          const selectedWeek = weeks[currentWeekIndex];
          
          // Get sleep data for the selected week
          const weekStart = new Date(selectedWeek.weekStartDate);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 6);
          const weekSleepData = sortedData.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= weekStart && itemDate <= weekEnd;
          });
          
          const weekTotals = weekSleepData.reduce((acc, item) => ({
            deep: acc.deep + item.deep,
            light: acc.light + item.light,
            rem: acc.rem + item.rem,
          }), { deep: 0, light: 0, rem: 0 });
          
          const startIndex = Math.max(0, currentWeekIndex - 1);
          const endIndex = Math.min(totalWeeks, currentWeekIndex + 3);
          const visibleWeeks = weeks.slice(startIndex, endIndex);
          
          const chartData = visibleWeeks.map((week, idx) => {
            const wStart = new Date(week.weekStartDate);
            const wEnd = new Date(wStart);
            wEnd.setDate(wStart.getDate() + 6);
            const wData = sortedData.filter(item => {
              const itemDate = new Date(item.date);
              return itemDate >= wStart && itemDate <= wEnd;
            });
            const totals = wData.reduce((acc, item) => ({
              deep: acc.deep + item.deep,
              light: acc.light + item.light,
              rem: acc.rem + item.rem,
            }), { deep: 0, light: 0, rem: 0 });
            
            return {
              week: `Week ${week.weekNumber}`,
              weekLabel: formatWeekLabel(week.weekStartDate),
              deep: Math.round(totals.deep * 10) / 10,
              light: Math.round(totals.light * 10) / 10,
              rem: Math.round(totals.rem * 10) / 10,
              total: Math.round((totals.deep + totals.light + totals.rem) * 10) / 10,
              isSelected: startIndex + idx === currentWeekIndex,
            };
          });

          return {
            chartData,
            selectedWeek,
            currentWeekIndex,
            totalWeeks,
            canGoPrev: currentWeekIndex > 0,
            canGoNext: currentWeekIndex < totalWeeks - 1,
            stats: {
              total: weekTotals.deep + weekTotals.light + weekTotals.rem,
              deep: weekTotals.deep,
              light: weekTotals.light,
              rem: weekTotals.rem,
              average: selectedWeek?.average || 0,
            },
          };
        }
        case 'monthly': {
          const months = groupByMonth(convertedData);
          const totalMonths = months.length;
          const currentMonthIndex = Math.max(0, Math.min(selectedMonthIndex, totalMonths - 1));
          const selectedMonth = months[currentMonthIndex];
          
          const monthStart = new Date(selectedMonth.month + '-01');
          const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
          const monthSleepData = sortedData.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate >= monthStart && itemDate <= monthEnd;
          });
          
          const monthTotals = monthSleepData.reduce((acc, item) => ({
            deep: acc.deep + item.deep,
            light: acc.light + item.light,
            rem: acc.rem + item.rem,
          }), { deep: 0, light: 0, rem: 0 });
          
          const startIndex = Math.max(0, currentMonthIndex - 2);
          const endIndex = Math.min(totalMonths, currentMonthIndex + 4);
          const visibleMonths = months.slice(startIndex, endIndex);
          
          const chartData = visibleMonths.map((month, idx) => {
            const mStart = new Date(month.month + '-01');
            const mEnd = new Date(mStart.getFullYear(), mStart.getMonth() + 1, 0);
            const mData = sortedData.filter(item => {
              const itemDate = new Date(item.date);
              return itemDate >= mStart && itemDate <= mEnd;
            });
            const totals = mData.reduce((acc, item) => ({
              deep: acc.deep + item.deep,
              light: acc.light + item.light,
              rem: acc.rem + item.rem,
            }), { deep: 0, light: 0, rem: 0 });
            
            return {
              month: formatMonth(month.month),
              deep: Math.round(totals.deep * 10) / 10,
              light: Math.round(totals.light * 10) / 10,
              rem: Math.round(totals.rem * 10) / 10,
              total: Math.round((totals.deep + totals.light + totals.rem) * 10) / 10,
              isSelected: startIndex + idx === currentMonthIndex,
            };
          });

          return {
            chartData,
            selectedMonth,
            currentMonthIndex,
            totalMonths,
            canGoPrev: currentMonthIndex > 0,
            canGoNext: currentMonthIndex < totalMonths - 1,
            stats: {
              total: monthTotals.deep + monthTotals.light + monthTotals.rem,
              deep: monthTotals.deep,
              light: monthTotals.light,
              rem: monthTotals.rem,
              average: selectedMonth?.average || 0,
            },
          };
        }
        case 'yearly': {
          const years = groupByYear(convertedData);
          const totalYears = years.length;
          const currentYearIndex = Math.max(0, Math.min(selectedYearIndex, totalYears - 1));
          const selectedYear = years[currentYearIndex];
          
          const yearSleepData = sortedData.filter(item => {
            const itemDate = new Date(item.date);
            return itemDate.getFullYear() === selectedYear.year;
          });
          
          const yearTotals = yearSleepData.reduce((acc, item) => ({
            deep: acc.deep + item.deep,
            light: acc.light + item.light,
            rem: acc.rem + item.rem,
          }), { deep: 0, light: 0, rem: 0 });
          
          const chartData = years.map((year, idx) => {
            const yData = sortedData.filter(item => {
              const itemDate = new Date(item.date);
              return itemDate.getFullYear() === year.year;
            });
            const totals = yData.reduce((acc, item) => ({
              deep: acc.deep + item.deep,
              light: acc.light + item.light,
              rem: acc.rem + item.rem,
            }), { deep: 0, light: 0, rem: 0 });
            
            return {
              year: year.year.toString(),
              deep: Math.round(totals.deep * 10) / 10,
              light: Math.round(totals.light * 10) / 10,
              rem: Math.round(totals.rem * 10) / 10,
              total: Math.round((totals.deep + totals.light + totals.rem) * 10) / 10,
              isSelected: idx === currentYearIndex,
            };
          });

          return {
            chartData,
            selectedYear,
            currentYearIndex,
            totalYears,
            canGoPrev: currentYearIndex > 0,
            canGoNext: currentYearIndex < totalYears - 1,
            stats: {
              total: yearTotals.deep + yearTotals.light + yearTotals.rem,
              deep: yearTotals.deep,
              light: yearTotals.light,
              rem: yearTotals.rem,
              average: selectedYear?.average || 0,
            },
          };
        }
        default:
          return null;
      }
    } catch (err) {
      console.error('Error processing data:', err);
      setError(err instanceof Error ? err.message : 'Error processing data');
      return null;
    }
  }, [sortedData, convertedData, timeRange, selectedDateIndex, selectedWeekIndex, selectedMonthIndex, selectedYearIndex]);

  const formatHours = (hours: number) => {
    const h = Math.floor(hours);
    const m = Math.round((hours % 1) * 60);
    return `${h}h ${m}m`;
  };

  if (error) {
    return (
      <div className="min-h-screen pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Card className="glass-card border-red-500/50">
            <CardContent className="p-6 text-center">
              <p className="text-red-600 dark:text-red-500 mb-2">Error: {error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!processedData || sortedData.length === 0) {
    return (
      <div className="min-h-screen pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No sleep data available</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background via-purple-500/5 to-background">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-5xl mx-auto lg:max-w-6xl">
          <div className="mb-6">
            <Button variant="ghost" onClick={onBack} className="mb-4 hover:bg-muted/50">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-500 dark:from-purple-700 dark:to-indigo-700 flex items-center justify-center">
                    <Moon className="w-6 h-6 text-white" />
                  </div>
                  Sleep
                </h1>
                <p className="text-muted-foreground mt-2">Track your sleep quality and patterns</p>
              </div>
            </div>
          </div>

          <div className="mb-6 space-y-4 max-w-5xl mx-auto">
            <Tabs value={timeRange} onValueChange={(v) => {
              const newRange = v as TimeRange;
              setTimeRange(newRange);
              if (newRange === 'daily' && sortedData.length > 0) {
                setSelectedDateIndex(sortedData.length - 1);
              } else if (newRange === 'weekly') {
                const weeks = groupByWeek(convertedData);
                setSelectedWeekIndex(weeks.length > 0 ? weeks.length - 1 : 0);
              } else if (newRange === 'monthly') {
                const months = groupByMonth(convertedData);
                setSelectedMonthIndex(months.length > 0 ? months.length - 1 : 0);
              } else if (newRange === 'yearly') {
                const years = groupByYear(convertedData);
                setSelectedYearIndex(years.length > 0 ? years.length - 1 : 0);
              }
            }}>
              <TabsList className="glass-card p-1 border-border w-full sm:w-auto">
                <TabsTrigger value="daily" className="flex-1 sm:flex-initial">Daily</TabsTrigger>
                <TabsTrigger value="weekly" className="flex-1 sm:flex-initial">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="flex-1 sm:flex-initial">Monthly</TabsTrigger>
                <TabsTrigger value="yearly" className="flex-1 sm:flex-initial">Yearly</TabsTrigger>
              </TabsList>
            </Tabs>
            
            {processedData && (
              <div className="flex items-center justify-between gap-2 sm:gap-4 w-full">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (timeRange === 'daily' && processedData.canGoPrev) {
                      setSelectedDateIndex(prev => Math.max(0, prev - 1));
                    } else if (timeRange === 'weekly' && processedData.canGoPrev) {
                      setSelectedWeekIndex(prev => Math.max(0, prev - 1));
                    } else if (timeRange === 'monthly' && processedData.canGoPrev) {
                      setSelectedMonthIndex(prev => Math.max(0, prev - 1));
                    } else if (timeRange === 'yearly' && processedData.canGoPrev) {
                      setSelectedYearIndex(prev => Math.max(0, prev - 1));
                    }
                  }}
                  disabled={!processedData.canGoPrev}
                  className="h-10 w-10 sm:h-9 sm:w-9 flex-shrink-0"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                
                <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                  <PopoverTrigger asChild>
                    <div className="flex-1 text-center cursor-pointer hover:bg-muted/50 rounded-lg p-2 transition-colors min-w-0 flex items-center justify-center">
                      {timeRange === 'daily' && processedData.selectedDay && (
                        <div>
                          <p className="text-lg font-semibold text-foreground flex items-center justify-center gap-2">
                            {formatDate(processedData.selectedDay.date, 'long')}
                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {processedData.currentIndex + 1} of {processedData.totalDays} nights
                          </p>
                        </div>
                      )}
                      {timeRange === 'weekly' && processedData.selectedWeek && (
                        <div>
                          <p className="text-lg font-semibold text-foreground flex items-center justify-center gap-2">
                            {formatWeekLabel(processedData.selectedWeek.weekStartDate)}
                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Week {processedData.currentWeekIndex + 1} of {processedData.totalWeeks}
                          </p>
                        </div>
                      )}
                      {timeRange === 'monthly' && processedData.selectedMonth && (
                        <div>
                          <p className="text-lg font-semibold text-foreground flex items-center justify-center gap-2">
                            {formatMonth(processedData.selectedMonth.month)}
                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Month {processedData.currentMonthIndex + 1} of {processedData.totalMonths}
                          </p>
                        </div>
                      )}
                      {timeRange === 'yearly' && processedData.selectedYear && (
                        <div>
                          <p className="text-lg font-semibold text-foreground flex items-center justify-center gap-2">
                            {processedData.selectedYear.year}
                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Year {processedData.currentYearIndex + 1} of {processedData.totalYears}
                          </p>
                        </div>
                      )}
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    {timeRange === 'daily' && sortedData.length > 0 && (
                      <div className="p-2 max-h-[400px] overflow-y-auto">
                        <div className="space-y-1">
                          {sortedData.map((item, index) => {
                            const itemDate = new Date(item.date);
                            const isSelected = item.date === processedData.selectedDay?.date;
                            const total = item.deep + item.light + item.rem;
                            return (
                              <button
                                key={item.date}
                                onClick={() => {
                                  setSelectedDateIndex(index);
                                  setDatePickerOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-md transition-colors ${
                                  isSelected
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-accent hover:text-accent-foreground'
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-semibold">
                                      {itemDate.toLocaleDateString('en-US', { 
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                      })}
                                    </p>
                                    <p className="text-sm opacity-80">
                                      {formatHours(total)}
                                    </p>
                                  </div>
                                  {isSelected && (
                                    <Check className="w-5 h-5" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {timeRange === 'weekly' && processedData && 'currentWeekIndex' in processedData && 'totalWeeks' in processedData && (
                      <Select
                        value={(processedData.currentWeekIndex ?? 0).toString()}
                        onValueChange={(v) => {
                          setSelectedWeekIndex(parseInt(v));
                          setDatePickerOpen(false);
                        }}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: processedData.totalWeeks ?? 0 }, (_, i) => {
                            const weekData = processedData.chartData[i];
                            const weekLabel = weekData && 'weekLabel' in weekData ? weekData.weekLabel : '';
                            return (
                              <SelectItem key={i} value={i.toString()}>
                                {weekLabel ? formatWeekLabel(weekLabel) : `Week ${i + 1}`}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}
                    {timeRange === 'monthly' && processedData && 'currentMonthIndex' in processedData && (
                      <Select
                        value={(processedData.currentMonthIndex ?? 0).toString()}
                        onValueChange={(v) => {
                          setSelectedMonthIndex(parseInt(v));
                          setDatePickerOpen(false);
                        }}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {processedData.chartData.map((item, idx) => {
                            const month = 'month' in item ? item.month : '';
                            return (
                              <SelectItem key={idx} value={idx.toString()}>
                                {month}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}
                    {timeRange === 'yearly' && processedData && 'currentYearIndex' in processedData && (
                      <Select
                        value={(processedData.currentYearIndex ?? 0).toString()}
                        onValueChange={(v) => {
                          setSelectedYearIndex(parseInt(v));
                          setDatePickerOpen(false);
                        }}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {processedData.chartData.map((item, idx) => {
                            const year = 'year' in item ? item.year : '';
                            return (
                              <SelectItem key={idx} value={idx.toString()}>
                                {year}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    )}
                  </PopoverContent>
                </Popover>
                
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => {
                    if (timeRange === 'daily' && processedData.canGoNext) {
                      setSelectedDateIndex(prev => Math.min(sortedData.length - 1, prev + 1));
                    } else if (timeRange === 'weekly' && processedData.canGoNext) {
                      setSelectedWeekIndex(prev => prev + 1);
                    } else if (timeRange === 'monthly' && processedData.canGoNext) {
                      setSelectedMonthIndex(prev => prev + 1);
                    } else if (timeRange === 'yearly' && processedData.canGoNext) {
                      setSelectedYearIndex(prev => prev + 1);
                    }
                  }}
                  disabled={!processedData.canGoNext}
                  className="h-10 w-10 sm:h-9 sm:w-9 flex-shrink-0"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6 max-w-5xl mx-auto">
            <Card className="glass-card border-border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Total</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatHours(processedData.stats.total)}
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card border-border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Deep</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatHours(processedData.stats.deep)}
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card border-border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Light</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatHours(processedData.stats.light)}
                </p>
              </CardContent>
            </Card>
            <Card className="glass-card border-border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">REM</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatHours(processedData.stats.rem)}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card border-border mb-6 max-w-5xl mx-auto">
            <CardHeader>
              <CardTitle>Sleep Stages</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={processedData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey={timeRange === 'daily' ? 'date' : timeRange === 'weekly' ? 'weekLabel' : timeRange === 'monthly' ? 'month' : 'year'} className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="deep" stackId="1" fill="#8b5cf6" name="Deep" />
                  <Bar dataKey="light" stackId="1" fill="#a78bfa" name="Light" />
                  <Bar dataKey="rem" stackId="1" fill="#c4b5fd" name="REM" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

