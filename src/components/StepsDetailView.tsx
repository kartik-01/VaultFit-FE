import { useState, useMemo, useEffect } from 'react';
import { ArrowLeft, Footprints, TrendingUp, Target, Award, Lightbulb, Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { formatDate, formatWeekLabel, formatMonth, groupByWeek, groupByMonth, groupByYear } from '../utils/healthMetricsHelpers';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsList, TabsTrigger } from './ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface StepsDetailViewProps {
  stepsData: Array<{ date: string; value: number }>;
  onBack: () => void;
}

type TimeRange = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function StepsDetailView({ stepsData, onBack }: StepsDetailViewProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');
  const [error, setError] = useState<string | null>(null);
  
  // Initialize indices to show most recent data
  const sortedData = useMemo(() => {
    try {
      if (!stepsData || stepsData.length === 0) return [];
      return [...stepsData].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
    } catch (err) {
      console.error('Error sorting steps data:', err);
      setError('Error processing steps data');
      return [];
    }
  }, [stepsData]);
  
  const [selectedDateIndex, setSelectedDateIndex] = useState(0);
  const [selectedWeekIndex, setSelectedWeekIndex] = useState(0);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(0);
  const [selectedYearIndex, setSelectedYearIndex] = useState(0);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  
  // Initialize to most recent when data loads
  useEffect(() => {
    if (sortedData.length > 0) {
      try {
        setSelectedDateIndex(sortedData.length - 1);
        const weeks = groupByWeek(sortedData);
        if (weeks.length > 0) setSelectedWeekIndex(weeks.length - 1);
        const months = groupByMonth(sortedData);
        if (months.length > 0) setSelectedMonthIndex(months.length - 1);
        const years = groupByYear(sortedData);
        if (years.length > 0) setSelectedYearIndex(years.length - 1);
      } catch (error) {
        console.error('Error initializing date indices:', error);
      }
    }
  }, [sortedData.length]);

  // Process data based on time range
  const processedData = useMemo(() => {
    try {
      if (!stepsData || stepsData.length === 0) return null;

      const sortedData = [...stepsData].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      switch (timeRange) {
        case 'daily': {
        // All available days, allow navigation
        const totalDays = sortedData.length;
        const currentIndex = Math.max(0, Math.min(selectedDateIndex, totalDays - 1));
        const selectedDay = sortedData[currentIndex];
        
        // Show 7 days around selected day (3 before, selected, 3 after)
        const startIndex = Math.max(0, currentIndex - 3);
        const endIndex = Math.min(totalDays, currentIndex + 4);
        const visibleDays = sortedData.slice(startIndex, endIndex);
        
        // Create hourly distribution (estimate based on typical activity patterns)
        const hourlyData = generateHourlyDistribution(selectedDay?.value || 0);
        
        return {
          chartData: visibleDays.map((item, idx) => ({
            date: formatDate(item.date, 'short'),
            fullDate: item.date,
            steps: Math.round(item.value),
            isSelected: startIndex + idx === currentIndex,
          })),
          hourlyData,
          selectedDay,
          currentIndex,
          totalDays,
          canGoPrev: currentIndex > 0,
          canGoNext: currentIndex < totalDays - 1,
          stats: {
            total: selectedDay?.value || 0,
            average: visibleDays.length > 0 
              ? visibleDays.reduce((sum, item) => sum + item.value, 0) / visibleDays.length 
              : 0,
            max: visibleDays.length > 0 ? Math.max(...visibleDays.map(item => item.value)) : 0,
            min: visibleDays.length > 0 ? Math.min(...visibleDays.map(item => item.value)) : 0,
          },
        };
        }
        case 'weekly': {
        // Group by week (all weeks)
        const weeks = groupByWeek(sortedData);
        const totalWeeks = weeks.length;
        const currentWeekIndex = Math.max(0, Math.min(selectedWeekIndex, totalWeeks - 1));
        const selectedWeek = weeks[currentWeekIndex];
        
        // Show 4 weeks around selected week
        const startIndex = Math.max(0, currentWeekIndex - 1);
        const endIndex = Math.min(totalWeeks, currentWeekIndex + 3);
        const visibleWeeks = weeks.slice(startIndex, endIndex);
        
        const chartData = visibleWeeks.map((week, idx) => ({
          week: `Week ${week.weekNumber}`,
          weekLabel: formatWeekLabel(week.weekStartDate),
          steps: week.total,
          days: week.days,
          average: week.average,
          isSelected: startIndex + idx === currentWeekIndex,
        }));

        const prevWeek = weeks[currentWeekIndex - 1] || { total: 0, average: 0 };

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
            change: prevWeek.total > 0 
              ? ((selectedWeek.total - prevWeek.total) / prevWeek.total * 100).toFixed(1)
              : '0',
            bestWeek: weeks.length > 0 ? Math.max(...weeks.map(w => w.total)) : 0,
          },
          weekData: selectedWeek,
        };
        }
        case 'monthly': {
        // Group by month (all months)
        const months = groupByMonth(sortedData);
        const totalMonths = months.length;
        const currentMonthIndex = Math.max(0, Math.min(selectedMonthIndex, totalMonths - 1));
        const selectedMonth = months[currentMonthIndex];
        
        // Show 6 months around selected month
        const startIndex = Math.max(0, currentMonthIndex - 2);
        const endIndex = Math.min(totalMonths, currentMonthIndex + 4);
        const visibleMonths = months.slice(startIndex, endIndex);
        
        const chartData = visibleMonths.map((month, idx) => ({
          month: formatMonth(month.month),
          monthKey: month.month,
          steps: month.total,
          days: month.days,
          average: month.average,
          isSelected: startIndex + idx === currentMonthIndex,
        }));

        // Find best day in selected month
        const selectedMonthStart = new Date(selectedMonth.month + '-01');
        const selectedMonthEnd = new Date(selectedMonthStart.getFullYear(), selectedMonthStart.getMonth() + 1, 0);
        const monthData = sortedData.filter(item => {
          const itemDate = new Date(item.date);
          return itemDate >= selectedMonthStart && itemDate <= selectedMonthEnd;
        });
        const bestDay = monthData.length > 0 
          ? monthData.reduce((best, current) => 
              current.value > best.value ? current : best, 
              monthData[0]
            )
          : { value: 0, date: '' };

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
            bestDay: bestDay.value || 0,
            bestDayDate: bestDay.date ? formatDate(bestDay.date, 'long') : 'N/A',
          },
          monthData: selectedMonth,
        };
        }
        case 'yearly': {
        // Group by year (all years)
        const years = groupByYear(sortedData);
        const totalYears = years.length;
        const currentYearIndex = Math.max(0, Math.min(selectedYearIndex, totalYears - 1));
        const selectedYear = years[currentYearIndex];
        
        const chartData = years.map((year, idx) => ({
          year: year.year.toString(),
          steps: year.total,
          days: year.days,
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
            bestYear: years.length > 0 ? Math.max(...years.map(y => y.total)) : 0,
            bestDay: selectedYear?.bestDay || 0,
            bestDayDate: selectedYear?.bestDayDate || 'N/A',
          },
          yearData: selectedYear,
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
  }, [stepsData, timeRange, selectedDateIndex, selectedWeekIndex, selectedMonthIndex, selectedYearIndex]);

  // Analytics calculations
  const analytics = useMemo(() => {
    if (!stepsData || stepsData.length === 0) return null;

    const sortedData = [...stepsData].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const goal = 10000;

    // Trends & Predictions
    const today = sortedData[sortedData.length - 1];
    const last7DaysSlice = sortedData.slice(-7);
    const avgLast7Days = last7DaysSlice.length > 0
      ? last7DaysSlice.reduce((sum, item) => sum + item.value, 0) / last7DaysSlice.length
      : 0;
    const currentProgress = today?.value || 0;
    const onTrack = currentProgress >= (avgLast7Days * 0.7); // 70% of average by current time estimate
    const currentHour = new Date().getHours();
    const projection = currentProgress > 0 && currentHour > 0
      ? Math.round((currentProgress / (currentHour / 24)) * 0.9) // Conservative estimate
      : currentProgress;

    // Streak calculation
    const streak = calculateStreak(sortedData, goal);

    // Comparisons
    const last7Days = sortedData.slice(-7);
    const prev7Days = sortedData.slice(-14, -7);
    const last7Total = last7Days.reduce((sum, item) => sum + item.value, 0);
    const prev7Total = prev7Days.reduce((sum, item) => sum + item.value, 0);
    const weekChange = prev7Days.length > 0 && prev7Total > 0
      ? ((last7Total - prev7Total) / prev7Total * 100)
      : 0;

    const bestDay = sortedData.length > 0
      ? sortedData.reduce((best, current) => 
          current.value > best.value ? current : best, 
          sortedData[0]
        )
      : { value: 0, date: '' };

    // Insights
    const dayOfWeekActivity = getDayOfWeekActivity(sortedData);
    const mostActiveDay = Object.entries(dayOfWeekActivity).length > 0
      ? Object.entries(dayOfWeekActivity).reduce((a, b) => 
          a[1] > b[1] ? a : b, ['Monday', 0]
        )
      : ['Monday', 0];

    const goalAchievementRate = sortedData.length > 0
      ? (sortedData.filter(item => item.value >= goal).length / sortedData.length * 100).toFixed(0)
      : '0';

    return {
      trends: {
        onTrack,
        projection,
        streak,
        goal,
      },
      comparisons: {
        weekChange: weekChange.toFixed(1),
        bestDay: bestDay.value || 0,
        bestDayDate: bestDay.date ? formatDate(bestDay.date, 'long') : 'N/A',
        average: Math.round(avgLast7Days),
        personalBest: sortedData.length > 0 ? Math.max(...sortedData.map(item => item.value)) : 0,
      },
      insights: {
        mostActiveDay: mostActiveDay[0],
        goalAchievementRate,
        recommendation: generateRecommendation(sortedData, goal, mostActiveDay[0]),
      },
    };
  }, [stepsData]);

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
              <p className="text-muted-foreground text-sm">Please check the browser console for details.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!processedData || !analytics) {
    return (
      <div className="min-h-screen pt-20 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Card className="glass-card">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No steps data available</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background via-cyan-500/5 to-background">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={onBack} 
            className="mb-4 hover:bg-muted/50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-foreground flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 dark:from-cyan-700 dark:to-blue-700 flex items-center justify-center">
                  <Footprints className="w-6 h-6 text-white" />
                </div>
                Steps
              </h1>
              <p className="text-muted-foreground mt-2">Track your daily activity and progress</p>
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="mb-6 space-y-4">
          <Tabs value={timeRange} onValueChange={(v) => {
            const newRange = v as TimeRange;
            setTimeRange(newRange);
            // Reset to most recent when switching
            if (newRange === 'daily' && sortedData.length > 0) {
              setSelectedDateIndex(sortedData.length - 1);
            } else if (newRange === 'weekly') {
              const weeks = groupByWeek(sortedData);
              setSelectedWeekIndex(weeks.length > 0 ? weeks.length - 1 : 0);
            } else if (newRange === 'monthly') {
              const months = groupByMonth(sortedData);
              setSelectedMonthIndex(months.length > 0 ? months.length - 1 : 0);
            } else if (newRange === 'yearly') {
              const years = groupByYear(sortedData);
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
          
          {/* Date Navigation */}
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
                          {processedData.currentMonthIndex + 1} of {processedData.totalMonths} months
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
                          {processedData.currentYearIndex + 1} of {processedData.totalYears} years
                        </p>
                      </div>
                    )}
                  </div>
                </PopoverTrigger>
                <PopoverContent 
                  className="w-fit p-0 shadow-lg" 
                  align="center"
                  side="bottom"
                  sideOffset={8}
                  alignOffset={0}
                  onOpenAutoFocus={(e) => e.preventDefault()}
                  collisionPadding={16}
                >
                  {timeRange === 'daily' && processedData.selectedDay && sortedData.length > 0 && (
                    <div className="p-2 max-h-[400px] overflow-y-auto">
                      <div className="space-y-1">
                        {sortedData.map((item, index) => {
                          const itemDate = new Date(item.date);
                          const isSelected = item.date === processedData.selectedDay.date;
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
                                    {Math.round(item.value).toLocaleString()} steps
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
                  {timeRange === 'weekly' && processedData && (
                    <div className="p-4">
                      <Select
                        value={processedData.currentWeekIndex?.toString() || '0'}
                        onValueChange={(value) => {
                          setSelectedWeekIndex(parseInt(value));
                          setDatePickerOpen(false);
                        }}
                      >
                        <SelectTrigger className="w-[280px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            try {
                              const weeks = groupByWeek(sortedData);
                              return Array.from({ length: processedData.totalWeeks || 0 }, (_, i) => {
                                const week = weeks[i];
                                if (!week) return null;
                                return (
                                  <SelectItem key={i} value={i.toString()}>
                                    {formatWeekLabel(week.weekStartDate)}
                                  </SelectItem>
                                );
                              }).filter(Boolean);
                            } catch (error) {
                              console.error('Error rendering weeks:', error);
                              return [];
                            }
                          })()}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {timeRange === 'monthly' && processedData && (
                    <div className="p-4">
                      <Select
                        value={processedData.currentMonthIndex?.toString() || '0'}
                        onValueChange={(value) => {
                          setSelectedMonthIndex(parseInt(value));
                          setDatePickerOpen(false);
                        }}
                      >
                        <SelectTrigger className="w-[280px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            try {
                              const months = groupByMonth(sortedData);
                              return Array.from({ length: processedData.totalMonths || 0 }, (_, i) => {
                                const month = months[i];
                                if (!month) return null;
                                return (
                                  <SelectItem key={i} value={i.toString()}>
                                    {formatMonth(month.month)}
                                  </SelectItem>
                                );
                              }).filter(Boolean);
                            } catch (error) {
                              console.error('Error rendering months:', error);
                              return [];
                            }
                          })()}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  {timeRange === 'yearly' && processedData && (
                    <div className="p-4">
                      <Select
                        value={processedData.currentYearIndex?.toString() || '0'}
                        onValueChange={(value) => {
                          setSelectedYearIndex(parseInt(value));
                          setDatePickerOpen(false);
                        }}
                      >
                        <SelectTrigger className="w-[280px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            try {
                              const years = groupByYear(sortedData);
                              return Array.from({ length: processedData.totalYears || 0 }, (_, i) => {
                                const year = years[i];
                                if (!year) return null;
                                return (
                                  <SelectItem key={i} value={i.toString()}>
                                    {year.year}
                                  </SelectItem>
                                );
                              }).filter(Boolean);
                            } catch (error) {
                              console.error('Error rendering years:', error);
                              return [];
                            }
                          })()}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </PopoverContent>
              </Popover>
              
              <Button
                variant="outline"
                size="icon"
                onClick={() => {
                  if (timeRange === 'daily' && processedData.canGoNext) {
                    setSelectedDateIndex(prev => {
                      const maxIndex = processedData.totalDays - 1;
                      return Math.min(maxIndex, prev + 1);
                    });
                  } else if (timeRange === 'weekly' && processedData.canGoNext) {
                    setSelectedWeekIndex(prev => {
                      const maxIndex = processedData.totalWeeks - 1;
                      return Math.min(maxIndex, prev + 1);
                    });
                  } else if (timeRange === 'monthly' && processedData.canGoNext) {
                    setSelectedMonthIndex(prev => {
                      const maxIndex = processedData.totalMonths - 1;
                      return Math.min(maxIndex, prev + 1);
                    });
                  } else if (timeRange === 'yearly' && processedData.canGoNext) {
                    setSelectedYearIndex(prev => {
                      const maxIndex = processedData.totalYears - 1;
                      return Math.min(maxIndex, prev + 1);
                    });
                  }
                }}
                disabled={!processedData.canGoNext}
                className="h-10 w-10 sm:h-9 sm:w-9"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <Card className="glass-card border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total</p>
              <p className="text-2xl font-bold text-foreground">
                {timeRange === 'daily' 
                  ? processedData.stats.total.toLocaleString()
                  : timeRange === 'weekly'
                  ? processedData.stats.total.toLocaleString()
                  : processedData.stats.total.toLocaleString()}
              </p>
            </CardContent>
          </Card>
          <Card className="glass-card border-border">
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Average</p>
              <p className="text-2xl font-bold text-foreground">
                {Math.round(processedData.stats.average).toLocaleString()}
              </p>
            </CardContent>
          </Card>
          {timeRange === 'daily' && (
            <>
              <Card className="glass-card border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Max</p>
                  <p className="text-2xl font-bold text-foreground">
                    {processedData.stats.max.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card className="glass-card border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Min</p>
                  <p className="text-2xl font-bold text-foreground">
                    {processedData.stats.min.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
          {timeRange === 'weekly' && (
            <>
              <Card className="glass-card border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Change</p>
                  <p className={`text-2xl font-bold ${parseFloat(String(processedData.stats.change)) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {parseFloat(String(processedData.stats.change)) >= 0 ? '+' : ''}{processedData.stats.change}%
                  </p>
                </CardContent>
              </Card>
              <Card className="glass-card border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Best Week</p>
                  <p className="text-2xl font-bold text-foreground">
                    {processedData.stats.bestWeek.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
          {timeRange === 'monthly' && (
            <>
              <Card className="glass-card border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Best Day</p>
                  <p className="text-2xl font-bold text-foreground">
                    {processedData.stats.bestDay.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card className="glass-card border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Date</p>
                  <p className="text-sm font-semibold text-foreground truncate">
                    {processedData.stats.bestDayDate}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
          {timeRange === 'yearly' && (
            <>
              <Card className="glass-card border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Best Day</p>
                  <p className="text-2xl font-bold text-foreground">
                    {processedData.stats.bestDay.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card className="glass-card border-border">
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground mb-1">Best Year</p>
                  <p className="text-2xl font-bold text-foreground">
                    {processedData.stats.bestYear.toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Chart */}
        <Card className="glass-card border-border mb-6">
          <CardHeader>
            <CardTitle>
              {timeRange === 'daily' ? 'Daily Steps' : 
               timeRange === 'weekly' ? 'Weekly Overview' : 
               timeRange === 'monthly' ? 'Monthly Overview' :
               'Yearly Overview'}
            </CardTitle>
            <CardDescription>
              {timeRange === 'daily' ? 'Last 7 days with hourly breakdown' :
               timeRange === 'weekly' ? 'Steps per week' :
               timeRange === 'monthly' ? 'Steps per month' :
               'Steps per year'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {timeRange === 'daily' ? (
              <div className="space-y-6">
                {/* 7-day chart */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-4">Last 7 Days</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={processedData.chartData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="date" stroke="var(--muted-foreground)" />
                      <YAxis stroke="var(--muted-foreground)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                        }}
                      />
                      <Bar 
                        dataKey="steps" 
                        fill="#06b6d4" 
                        radius={[8, 8, 0, 0]}
                        className={processedData.chartData.find(d => d.isSelected) ? 'opacity-100' : ''}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {/* Hourly breakdown */}
                {processedData.hourlyData && (
                  <div>
                    <h3 className="text-sm font-semibold text-foreground mb-4">
                      Hourly Breakdown - {formatDate(processedData.selectedDay?.date || '', 'long')}
                    </h3>
                    <ResponsiveContainer width="100%" height={200}>
                      <AreaChart data={processedData.hourlyData}>
                        <defs>
                          <linearGradient id="stepsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="hour" stroke="var(--muted-foreground)" />
                        <YAxis stroke="var(--muted-foreground)" />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: 'var(--card)',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="steps"
                          stroke="#06b6d4"
                          fillOpacity={1}
                          fill="url(#stepsGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            ) : timeRange === 'weekly' ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={processedData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="week" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="steps" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : timeRange === 'yearly' ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={processedData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="year" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="steps" fill="#06b6d4" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={processedData.chartData}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                  <YAxis stroke="var(--muted-foreground)" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="steps"
                    stroke="#06b6d4"
                    strokeWidth={3}
                    dot={{ fill: '#06b6d4', r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Analytics Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {/* Trends & Predictions */}
          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-cyan-600 dark:text-cyan-500/70" />
                Trends & Predictions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">On Track</span>
                <Badge className={analytics.trends.onTrack ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'}>
                  {analytics.trends.onTrack ? 'Yes' : 'Needs Work'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Today's Projection</span>
                <span className="text-sm font-semibold text-foreground">
                  {analytics.trends.projection.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Current Streak</span>
                <span className="text-sm font-semibold text-foreground flex items-center gap-1">
                  <Award className="w-4 h-4 text-amber-600" />
                  {analytics.trends.streak} days
                </span>
              </div>
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Daily Goal</span>
                  <span className="text-xs font-semibold text-foreground">
                    {analytics.trends.goal.toLocaleString()} steps
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparisons */}
          <Card className="glass-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="w-5 h-5 text-orange-600 dark:text-orange-500/70" />
                Comparisons
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Week Change</span>
                <span className={`text-sm font-semibold ${parseFloat(analytics.comparisons.weekChange) >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {parseFloat(analytics.comparisons.weekChange) >= 0 ? '+' : ''}{analytics.comparisons.weekChange}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Best Day</span>
                <span className="text-sm font-semibold text-foreground">
                  {analytics.comparisons.bestDay.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">7-Day Average</span>
                <span className="text-sm font-semibold text-foreground">
                  {analytics.comparisons.average.toLocaleString()}
                </span>
              </div>
              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Personal Best</span>
                  <span className="text-xs font-semibold text-foreground">
                    {analytics.comparisons.personalBest.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Insights */}
          <Card className="glass-card border-border sm:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Lightbulb className="w-5 h-5 text-purple-600 dark:text-purple-500/70" />
                Insights
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Most Active Day</span>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {analytics.insights.mostActiveDay}
                </p>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Goal Achievement</span>
                <p className="text-sm font-semibold text-foreground mt-1">
                  {analytics.insights.goalAchievementRate}% of days
                </p>
              </div>
              <div className="pt-2 border-t border-border">
                <span className="text-xs text-muted-foreground">Recommendation</span>
                <p className="text-xs text-foreground mt-1">
                  {analytics.insights.recommendation}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Helper functions
function generateHourlyDistribution(dailyTotal: number): Array<{ hour: string; steps: number }> {
  // Estimate hourly distribution based on typical activity patterns
  // More active during morning (7-9am), lunch (12-1pm), evening (5-7pm)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const weights = hours.map(hour => {
    if (hour >= 7 && hour <= 9) return 0.12; // Morning rush
    if (hour >= 12 && hour <= 13) return 0.10; // Lunch
    if (hour >= 17 && hour <= 19) return 0.15; // Evening
    if (hour >= 20 && hour <= 23) return 0.05; // Night
    if (hour >= 0 && hour <= 6) return 0.02; // Sleep
    return 0.08; // Other hours
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  const normalizedWeights = weights.map(w => w / totalWeight);

  return hours.map((hour, idx) => ({
    hour: hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`,
    steps: Math.round(dailyTotal * normalizedWeights[idx]),
  }));
}

function calculateStreak(data: Array<{ date: string; value: number }>, goal: number): number {
  let streak = 0;
  for (let i = data.length - 1; i >= 0; i--) {
    if (data[i].value >= goal) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function getDayOfWeekActivity(data: Array<{ date: string; value: number }>): Record<string, number> {
  const dayActivity: Record<string, number> = {
    'Sunday': 0,
    'Monday': 0,
    'Tuesday': 0,
    'Wednesday': 0,
    'Thursday': 0,
    'Friday': 0,
    'Saturday': 0,
  };
  const dayCount: Record<string, number> = { ...dayActivity };

  data.forEach(item => {
    const date = new Date(item.date);
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
    dayActivity[dayName] += item.value;
    dayCount[dayName]++;
  });

  // Calculate averages
  Object.keys(dayActivity).forEach(day => {
    if (dayCount[day] > 0) {
      dayActivity[day] = dayActivity[day] / dayCount[day];
    }
  });

  return dayActivity;
}

function generateRecommendation(
  data: Array<{ date: string; value: number }>,
  goal: number,
  mostActiveDay: string
): string {
  const avg = data.reduce((sum, item) => sum + item.value, 0) / data.length;
  const achievementRate = data.filter(item => item.value >= goal).length / data.length;

  if (achievementRate >= 0.8) {
    return `Great job! You're consistently meeting your goals. Keep it up!`;
  } else if (achievementRate >= 0.5) {
    return `You're doing well! Try to match your ${mostActiveDay} activity on other days.`;
  } else {
    return `Focus on increasing daily activity. Your average is ${Math.round(avg).toLocaleString()} steps - aim for ${goal.toLocaleString()} daily.`;
  }
}

