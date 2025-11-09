import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Flame, TrendingUp, Target, Award, Lightbulb, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react';
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

interface CaloriesDetailViewProps {
  activeEnergy: Array<{ date: string; value: number }>;
  restingEnergy: Array<{ date: string; value: number }>;
  onBack: () => void;
}

type TimeRange = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function CaloriesDetailView({ activeEnergy, restingEnergy, onBack }: CaloriesDetailViewProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');
  const [error, setError] = useState<string | null>(null);
  
  // Merge active and resting energy by date
  const mergedData = useMemo(() => {
    try {
      const dataMap = new Map<string, { date: string; active: number; resting: number; total: number }>();
      
      activeEnergy.forEach(item => {
        const existing = dataMap.get(item.date) || { date: item.date, active: 0, resting: 0, total: 0 };
        existing.active = item.value;
        existing.total = existing.active + existing.resting;
        dataMap.set(item.date, existing);
      });
      
      restingEnergy.forEach(item => {
        const existing = dataMap.get(item.date) || { date: item.date, active: 0, resting: 0, total: 0 };
        existing.resting = item.value;
        existing.total = existing.active + existing.resting;
        dataMap.set(item.date, existing);
      });
      
      return Array.from(dataMap.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    } catch (err) {
      console.error('Error merging calories data:', err);
      setError('Error processing calories data');
      return [];
    }
  }, [activeEnergy, restingEnergy]);
  
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [selectedYearIndex, setSelectedYearIndex] = useState(0);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  useEffect(() => {
    if (mergedData.length > 0) {
      try {
        setSelectedDateIndex(mergedData.length - 1);
        const weeks = groupByWeek(mergedData.map(d => ({ date: d.date, value: d.total })));
        if (weeks.length > 0) setSelectedWeekIndex(weeks.length - 1);
        const months = groupByMonth(mergedData.map(d => ({ date: d.date, value: d.total })));
        if (months.length > 0) setSelectedMonthIndex(months.length - 1);
        const years = groupByYear(mergedData.map(d => ({ date: d.date, value: d.total })));
        if (years.length > 0) setSelectedYearIndex(years.length - 1);
      } catch (error) {
        console.error('Error initializing date indices:', error);
      }
    }
  }, [mergedData.length]);

  const processedData = useMemo(() => {
    try {
      if (!mergedData || mergedData.length === 0) return null;

      switch (timeRange) {
        case 'daily': {
          const totalDays = mergedData.length;
          const currentIndex = Math.max(0, Math.min(selectedDateIndex, totalDays - 1));
          const selectedDay = mergedData[currentIndex];
          
          const startIndex = Math.max(0, currentIndex - 3);
          const endIndex = Math.min(totalDays, currentIndex + 4);
          const visibleDays = mergedData.slice(startIndex, endIndex);
          
          return {
            chartData: visibleDays.map((item, idx) => ({
              date: formatDate(item.date, 'short'),
              active: Math.round(item.active),
              resting: Math.round(item.resting),
              total: Math.round(item.total),
              isSelected: startIndex + idx === currentIndex,
            })),
            selectedDay,
            currentIndex,
            totalDays,
            canGoPrev: currentIndex > 0,
            canGoNext: currentIndex < totalDays - 1,
            stats: {
              total: selectedDay?.total || 0,
              active: selectedDay?.active || 0,
              resting: selectedDay?.resting || 0,
              average: visibleDays.length > 0 
                ? visibleDays.reduce((sum, item) => sum + item.total, 0) / visibleDays.length 
                : 0,
            },
          };
        }
        case 'weekly': {
          const weeks = groupByWeek(mergedData.map(d => ({ date: d.date, value: d.total })));
          const totalWeeks = weeks.length;
          const currentWeekIndex = Math.max(0, Math.min(selectedWeekIndex, totalWeeks - 1));
          const selectedWeek = weeks[currentWeekIndex];
          
          const startIndex = Math.max(0, currentWeekIndex - 1);
          const endIndex = Math.min(totalWeeks, currentWeekIndex + 3);
          const visibleWeeks = weeks.slice(startIndex, endIndex);
          
          const chartData = visibleWeeks.map((week, idx) => ({
            week: `Week ${week.weekNumber}`,
            weekLabel: formatWeekLabel(week.weekStartDate),
            total: week.total,
            average: week.average,
            isSelected: startIndex + idx === currentWeekIndex,
          }));

          return {
            chartData,
            selectedWeek,
            currentWeekIndex,
            totalWeeks,
            canGoPrev: currentWeekIndex > 0,
            canGoNext: currentWeekIndex < totalWeeks - 1,
            stats: {
              total: selectedWeek?.total || 0,
              average: selectedWeek?.average || 0,
            },
          };
        }
        case 'monthly': {
          const months = groupByMonth(mergedData.map(d => ({ date: d.date, value: d.total })));
          const totalMonths = months.length;
          const currentMonthIndex = Math.max(0, Math.min(selectedMonthIndex, totalMonths - 1));
          const selectedMonth = months[currentMonthIndex];
          
          const startIndex = Math.max(0, currentMonthIndex - 2);
          const endIndex = Math.min(totalMonths, currentMonthIndex + 4);
          const visibleMonths = months.slice(startIndex, endIndex);
          
          const chartData = visibleMonths.map((month, idx) => ({
            month: formatMonth(month.month),
            total: month.total,
            average: month.average,
            isSelected: startIndex + idx === currentMonthIndex,
          }));

          return {
            chartData,
            selectedMonth,
            currentMonthIndex,
            totalMonths,
            canGoPrev: currentMonthIndex > 0,
            canGoNext: currentMonthIndex < totalMonths - 1,
            stats: {
              total: selectedMonth?.total || 0,
              average: selectedMonth?.average || 0,
            },
          };
        }
        case 'yearly': {
          const years = groupByYear(mergedData.map(d => ({ date: d.date, value: d.total })));
          const totalYears = years.length;
          const currentYearIndex = Math.max(0, Math.min(selectedYearIndex, totalYears - 1));
          const selectedYear = years[currentYearIndex];
          
          const chartData = years.map((year, idx) => ({
            year: year.year.toString(),
            total: year.total,
            average: year.average,
            isSelected: idx === currentYearIndex,
          }));

          return {
            chartData,
            selectedYear,
            currentYearIndex,
            totalYears,
            canGoPrev: currentYearIndex > 0,
            canGoNext: currentYearIndex < totalYears - 1,
            stats: {
              total: selectedYear?.total || 0,
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
  }, [mergedData, timeRange, selectedDateIndex, selectedWeekIndex, selectedMonthIndex, selectedYearIndex]);

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

  if (!processedData || mergedData.length === 0) {
    return (
      <div className="min-h-screen pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No calories data available</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background via-orange-500/5 to-background">
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
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 dark:from-orange-700 dark:to-amber-700 flex items-center justify-center">
                    <Flame className="w-6 h-6 text-white" />
                  </div>
                  Calories
                </h1>
                <p className="text-muted-foreground mt-2">Track your energy expenditure</p>
              </div>
            </div>
          </div>

          <div className="mb-6 space-y-4 max-w-5xl mx-auto">
            <Tabs value={timeRange} onValueChange={(v) => {
              const newRange = v as TimeRange;
              setTimeRange(newRange);
              if (newRange === 'daily' && mergedData.length > 0) {
                setSelectedDateIndex(mergedData.length - 1);
              } else if (newRange === 'weekly') {
                const weeks = groupByWeek(mergedData.map(d => ({ date: d.date, value: d.total })));
                setSelectedWeekIndex(weeks.length > 0 ? weeks.length - 1 : 0);
              } else if (newRange === 'monthly') {
                const months = groupByMonth(mergedData.map(d => ({ date: d.date, value: d.total })));
                setSelectedMonthIndex(months.length > 0 ? months.length - 1 : 0);
              } else if (newRange === 'yearly') {
                const years = groupByYear(mergedData.map(d => ({ date: d.date, value: d.total })));
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
                            {processedData.currentIndex + 1} of {processedData.totalDays} days
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
                    {timeRange === 'daily' && mergedData.length > 0 && (
                      <div className="p-2 max-h-[400px] overflow-y-auto">
                        <div className="space-y-1">
                          {mergedData.map((item, index) => {
                            const itemDate = new Date(item.date);
                            const isSelected = item.date === processedData.selectedDay?.date;
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
                                      {Math.round(item.total).toLocaleString()} cal
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
                    {timeRange === 'weekly' && (
                      <Select
                        value={processedData.currentWeekIndex.toString()}
                        onValueChange={(v) => {
                          setSelectedWeekIndex(parseInt(v));
                          setDatePickerOpen(false);
                        }}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: processedData.totalWeeks }, (_, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              {formatWeekLabel(processedData.chartData[i]?.weekLabel || '')}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {timeRange === 'monthly' && (
                      <Select
                        value={processedData.currentMonthIndex.toString()}
                        onValueChange={(v) => {
                          setSelectedMonthIndex(parseInt(v));
                          setDatePickerOpen(false);
                        }}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {processedData.chartData.map((month, idx) => (
                            <SelectItem key={idx} value={idx.toString()}>
                              {month.month}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {timeRange === 'yearly' && (
                      <Select
                        value={processedData.currentYearIndex.toString()}
                        onValueChange={(v) => {
                          setSelectedYearIndex(parseInt(v));
                          setDatePickerOpen(false);
                        }}
                      >
                        <SelectTrigger className="w-[200px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {processedData.chartData.map((year, idx) => (
                            <SelectItem key={idx} value={idx.toString()}>
                              {year.year}
                            </SelectItem>
                          ))}
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
                      setSelectedDateIndex(prev => Math.min(mergedData.length - 1, prev + 1));
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
                  {timeRange === 'daily' ? Math.round(processedData.stats.total).toLocaleString() :
                   timeRange === 'weekly' ? Math.round(processedData.stats.total).toLocaleString() :
                   timeRange === 'monthly' ? Math.round(processedData.stats.total).toLocaleString() :
                   Math.round(processedData.stats.total).toLocaleString()} cal
                </p>
              </CardContent>
            </Card>
            {timeRange === 'daily' && 'active' in processedData.stats && (
              <>
                <Card className="glass-card border-border">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Active</p>
                    <p className="text-2xl font-bold text-foreground">
                      {Math.round(processedData.stats.active).toLocaleString()} cal
                    </p>
                  </CardContent>
                </Card>
                <Card className="glass-card border-border">
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground mb-1">Resting</p>
                    <p className="text-2xl font-bold text-foreground">
                      {Math.round(processedData.stats.resting).toLocaleString()} cal
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
            <Card className="glass-card border-border">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground mb-1">Average</p>
                <p className="text-2xl font-bold text-foreground">
                  {Math.round(processedData.stats.average).toLocaleString()} cal
                </p>
              </CardContent>
            </Card>
          </div>

          <Card className="glass-card border-border mb-6 max-w-5xl mx-auto">
            <CardHeader>
              <CardTitle>Calories Burned</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                {timeRange === 'daily' ? (
                  <AreaChart data={processedData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="active" stackId="1" stroke="#f97316" fill="#f97316" fillOpacity={0.6} name="Active" />
                    <Area type="monotone" dataKey="resting" stackId="1" stroke="#fb923c" fill="#fb923c" fillOpacity={0.6} name="Resting" />
                  </AreaChart>
                ) : (
                  <BarChart data={processedData.chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey={timeRange === 'weekly' ? 'weekLabel' : timeRange === 'monthly' ? 'month' : 'year'} className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="total" fill="#f97316" name="Total Calories" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

