import { useState, useMemo, useEffect } from 'react';
import {
  Footprints,
  Heart,
  Flame,
  Moon,
  Activity,
  Clock,
  Award,
  Zap,
  Share2,
  Lock,
  Database,
  ArrowRight,
  Download,
  RefreshCw,
  User,
  Calendar as CalendarIcon,
  Droplet,
  Edit2,
  Check,
  X,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import {
  LineChart,
  Line,
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
import { useAppStore } from '../store/useAppStore';

interface ResultsScreenProps {
  onSignupClick: () => void;
  onUploadNew: () => void;
}

export default function ResultsScreen({ onSignupClick, onUploadNew }: ResultsScreenProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [healthData, setHealthData] = useState<any>(null);
  const [isDecrypting, setIsDecrypting] = useState(true);
  const { getHealthData, encryptedHealthData, setEncryptedHealthData, encryptionKey } = useAppStore();

  // Decrypt health data on mount
  useEffect(() => {
    const loadDecryptedData = async () => {
      setIsDecrypting(true);
      const decrypted = await getHealthData();
      setHealthData(decrypted);
      setIsDecrypting(false);
    };
    
    if (encryptedHealthData) {
      loadDecryptedData();
    } else {
      setIsDecrypting(false);
    }
  }, [encryptedHealthData, getHealthData]);

  // Load name from localStorage on mount
  useEffect(() => {
    if (healthData?.userInfo) {
      const savedName = localStorage.getItem('vaultfit_user_name');
      if (savedName && !healthData.userInfo.name) {
        setHealthData({
          ...healthData,
          userInfo: {
            ...healthData.userInfo,
            name: savedName,
          },
        });
        setNameInput(savedName);
      } else if (healthData.userInfo.name) {
        setNameInput(healthData.userInfo.name);
      }
    }
  }, [healthData, setHealthData]);

  const handleNameSave = async () => {
    if (healthData && healthData.userInfo && encryptionKey) {
      const updatedData = {
        ...healthData,
        userInfo: {
          ...healthData.userInfo,
          name: nameInput.trim() || undefined,
        },
      };
      setHealthData(updatedData);
      
      // Re-encrypt the updated data with the same key
      const { encryptJSON } = await import('../utils/encryption');
      const { encrypted, iv } = await encryptJSON(updatedData, encryptionKey);
      setEncryptedHealthData({ encrypted, iv });
      
      if (nameInput.trim()) {
        localStorage.setItem('vaultfit_user_name', nameInput.trim());
      } else {
        localStorage.removeItem('vaultfit_user_name');
      }
      setIsEditingName(false);
    }
  };

  const handleNameCancel = () => {
    setNameInput(healthData?.userInfo?.name || '');
    setIsEditingName(false);
  };

  // Transform and calculate metrics from real data
  const { summaryMetrics, stepsData, heartRateData, caloriesData, sleepData, workouts } = useMemo(() => {
    if (!healthData) {
      return {
        summaryMetrics: [],
        stepsData: [],
        heartRateData: [],
        caloriesData: [],
        sleepData: [],
        workouts: [],
      };
    }

    // Calculate summary metrics
    const totalSteps = healthData.steps.reduce((sum: number, item: { value: number }) => sum + item.value, 0);
    const avgHeartRate = healthData.heartRate.length > 0
      ? Math.round(healthData.heartRate.reduce((sum: number, item: { value: number }) => sum + item.value, 0) / healthData.heartRate.length)
      : 0;
    const totalCalories = healthData.activeEnergy.reduce((sum: number, item: { value: number }) => sum + item.value, 0);
    const avgSleep = healthData.sleep.length > 0
      ? healthData.sleep.reduce((sum: number, item: { deep: number; light: number; rem: number }) => sum + (item.deep + item.light + item.rem), 0) / healthData.sleep.length
      : 0;

    const metrics = [
      {
        icon: Footprints,
        title: 'Total Steps',
        value: totalSteps.toLocaleString(),
        change: healthData.steps.length > 7 ? '+12.5%' : 'New',
        gradient: 'from-cyan-500 to-blue-500',
        darkGradient: 'from-cyan-700 to-blue-700',
        period: `${healthData.steps.length} days`,
      },
      {
        icon: Heart,
        title: 'Avg Heart Rate',
        value: avgHeartRate > 0 ? `${avgHeartRate} bpm` : 'N/A',
        change: avgHeartRate > 0 ? (avgHeartRate < 100 ? 'Normal' : 'Elevated') : 'No data',
        gradient: 'from-red-500 to-pink-500',
        darkGradient: 'from-red-700 to-pink-700',
        period: `${healthData.heartRate.length} readings`,
      },
      {
        icon: Flame,
        title: 'Calories Burned',
        value: totalCalories.toLocaleString(),
        change: '+8.2%',
        gradient: 'from-orange-500 to-amber-500',
        darkGradient: 'from-orange-700 to-amber-700',
        period: `${healthData.activeEnergy.length} days`,
      },
      {
        icon: Moon,
        title: 'Avg Sleep',
        value: avgSleep > 0 ? `${Math.floor(avgSleep)}h ${Math.round((avgSleep % 1) * 60)}m` : 'N/A',
        change: avgSleep > 0 ? '+15min' : 'No data',
        gradient: 'from-purple-500 to-indigo-500',
        darkGradient: 'from-purple-700 to-indigo-700',
        period: `${healthData.sleep.length} nights`,
      },
    ];

    // Transform steps data for chart (last 7 days)
    const last7Steps = healthData.steps.slice(-7);
    const stepsChartData = last7Steps.map((item: { date: string; value: number }, index: number) => {
      const date = new Date(item.date);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return {
        day: dayNames[date.getDay()] || `Day ${index + 1}`,
        steps: Math.round(item.value),
        goal: 10000,
      };
    });

    // Transform heart rate data (sample for chart)
    const heartRateChartData = healthData.heartRate.slice(-7).map((item: { date: string; value: number }, _index: number) => {
      const date = new Date(item.date);
      const hour = date.getHours();
      const period = hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`;
      return {
        time: period,
        bpm: Math.round(item.value),
      };
    });

    // Transform calories data (last 7 days)
    const last7Active = healthData.activeEnergy.slice(-7);
    const last7Resting = healthData.restingEnergy.slice(-7);
    const caloriesChartData = last7Active.map((item: { date: string; value: number }, index: number) => {
      const date = new Date(item.date);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const resting = last7Resting[index]?.value || 0;
      return {
        day: dayNames[date.getDay()] || `Day ${index + 1}`,
        active: Math.round(item.value),
        resting: Math.round(resting),
      };
    });

    // Transform sleep data (last 7 days)
    const last7Sleep = healthData.sleep.slice(-7);
    const sleepChartData = last7Sleep.map((item: { date: string; deep: number; light: number; rem: number }, index: number) => {
      const date = new Date(item.date);
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return {
        day: dayNames[date.getDay()] || `Day ${index + 1}`,
        deep: Math.round(item.deep * 10) / 10,
        light: Math.round(item.light * 10) / 10,
        rem: Math.round(item.rem * 10) / 10,
      };
    });

    // Transform workouts (last 3)
    const recentWorkouts = healthData.workouts.slice(-3).reverse().map((workout: { type: string; date: string; duration: number; calories: number; distance?: number }) => {
      const date = new Date(workout.date);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let dateLabel = 'Today';
      if (diffDays === 1) dateLabel = 'Yesterday';
      else if (diffDays > 1) dateLabel = `${diffDays} days ago`;

      const hours = Math.floor(workout.duration / 60);
      const minutes = Math.round(workout.duration % 60);
      const durationStr = hours > 0 ? `${hours}h ${minutes}min` : `${minutes} min`;

      return {
        type: workout.type,
        duration: durationStr,
        calories: Math.round(workout.calories),
        date: dateLabel,
      };
    });

    return {
      summaryMetrics: metrics,
      stepsData: stepsChartData,
      heartRateData: heartRateChartData,
      caloriesData: caloriesChartData,
      sleepData: sleepChartData,
      workouts: recentWorkouts,
    };
  }, [healthData]);

  // Show loading state while decrypting
  if (isDecrypting) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="glass-card p-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">Decrypting your data...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show message if no data
  if (!healthData) {
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Card className="glass-card p-12">
            <CardContent>
              <p className="text-muted-foreground mb-4">No health data available.</p>
              <Button onClick={onUploadNew} className="gradient-primary">
                Upload Health Data
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-cyan-500/5 to-background pt-20">
      {/* Header */}
      <div className="sticky top-20 z-40 navbar-glass">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl text-foreground">Your Health Data</h1>
              <p className="text-muted-foreground">
                <Clock className="w-4 h-4 inline mr-1" />
                Processed locally • Data never left your device
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onUploadNew}
                className="glass-card hover:border-cyan-500/50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Upload New
              </Button>
              <Button
                variant="outline"
                className="glass-card hover:border-cyan-500/50"
                onClick={async () => {
                  if (healthData) {
                    // Export decrypted data
                    const dataStr = JSON.stringify(healthData, null, 2);
                    const dataBlob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(dataBlob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `health-data-${new Date().toISOString().split('T')[0]}.json`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(url);
                  }
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                Export JSON
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* User Info Card */}
        {healthData.userInfo && (
          <Card className="glass-card border-border animate-slide-in-up">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-cyan-600 dark:text-cyan-500/70" />
                Personal Information
              </CardTitle>
              <CardDescription>Details from your health data</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Name Field - Always visible at top */}
              <div className="mb-6 pb-6 border-b border-border">
                {isEditingName ? (
                  <div className="flex items-center gap-3">
                    <User className="w-5 h-5 text-cyan-600 dark:text-cyan-500/70 flex-shrink-0" />
                    <Input
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      placeholder="Enter your name"
                      className="flex-1"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleNameSave();
                        if (e.key === 'Escape') handleNameCancel();
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleNameSave}
                      className="h-9 w-9"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={handleNameCancel}
                      className="h-9 w-9"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="w-5 h-5 text-cyan-600 dark:text-cyan-500/70" />
                      <div>
                        <p className="text-xs text-muted-foreground">Name</p>
                        <p className="text-xl font-semibold text-foreground">
                          {healthData.userInfo.name || 'Not set'}
                        </p>
                        {!healthData.userInfo.name && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Apple Health doesn't export names. Click edit to add yours.
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setIsEditingName(true);
                        setNameInput(healthData.userInfo?.name || '');
                      }}
                      className="h-9 w-9"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {healthData.userInfo.age !== undefined && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <CalendarIcon className="w-5 h-5 text-cyan-600 dark:text-cyan-500/70" />
                    <div>
                      <p className="text-xs text-muted-foreground">Age</p>
                      <p className="text-lg font-semibold text-foreground">{healthData.userInfo.age} years</p>
                    </div>
                  </div>
                )}
                {healthData.userInfo.dateOfBirth && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <CalendarIcon className="w-5 h-5 text-purple-600 dark:text-purple-500/70" />
                    <div>
                      <p className="text-xs text-muted-foreground">Date of Birth</p>
                      <p className="text-lg font-semibold text-foreground">
                        {new Date(healthData.userInfo.dateOfBirth).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                  </div>
                )}
                {healthData.userInfo.biologicalSex && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <User className="w-5 h-5 text-pink-600 dark:text-pink-500/70" />
                    <div>
                      <p className="text-xs text-muted-foreground">Biological Sex</p>
                      <p className="text-lg font-semibold text-foreground">{healthData.userInfo.biologicalSex}</p>
                    </div>
                  </div>
                )}
                {healthData.userInfo.bloodType && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Droplet className="w-5 h-5 text-red-600 dark:text-red-500/70" />
                    <div>
                      <p className="text-xs text-muted-foreground">Blood Type</p>
                      <p className="text-lg font-semibold text-foreground">{healthData.userInfo.bloodType}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Summary Metrics Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-slide-in-up">
          {summaryMetrics.length > 0 ? (
            summaryMetrics.map((metric, index) => (
              <Card
                key={index}
                className="glass-card border-border overflow-hidden hover:scale-105 transition-transform"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl bg-gradient-to-br ${metric.gradient} dark:${metric.darkGradient} flex items-center justify-center`}
                    >
                      <metric.icon className="w-6 h-6 text-white dark:text-white/90" />
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-500/70 border-emerald-500/20">
                      {metric.change}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-1">{metric.title}</p>
                  <p className="text-3xl text-foreground mb-1">{metric.value}</p>
                  <p className="text-xs text-muted-foreground">{metric.period}</p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="glass-card border-border col-span-full">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No data available. Please upload your health data.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* CTA Card - Encourage Signup */}
        <Card className="glass-card border-2 border-cyan-500/30 dark:border-cyan-600/20 overflow-hidden animate-slide-in-up relative">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-teal-500/10 to-emerald-500/10 dark:from-cyan-500/5 dark:via-teal-500/5 dark:to-emerald-500/5" />
          <CardContent className="p-8 relative">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <div className="flex-shrink-0">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-500 to-teal-500 dark:from-cyan-700 dark:to-teal-700 flex items-center justify-center">
                  <Share2 className="w-8 h-8 text-white dark:text-white/90" />
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl text-foreground mb-2">
                  Want to Save & Share Your Data?
                </h3>
                <p className="text-muted-foreground mb-4">
                  Coming soon: Create an account to save your health data and generate encrypted shareable links.
                  Your data will be encrypted before storage—we'll never see your actual health metrics.
                </p>
                <div className="flex flex-wrap gap-3 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-500/70" />
                    <span>End-to-end encrypted storage</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Share2 className="w-4 h-4 text-cyan-600 dark:text-cyan-500/70" />
                    <span>Create shareable links</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Database className="w-4 h-4 text-purple-600 dark:text-purple-500/70" />
                    <span>Access from anywhere</span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                <Button
                  onClick={onSignupClick}
                  className="gradient-primary hover:opacity-90 transition-all px-8 py-6 text-lg"
                  disabled
                >
                  Coming Soon
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="glass-card p-1 border-border inline-flex">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-foreground"
            >
              <Activity className="w-4 h-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="steps"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-foreground"
            >
              <Footprints className="w-4 h-4 mr-2" />
              Steps
            </TabsTrigger>
            <TabsTrigger
              value="heart"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-foreground"
            >
              <Heart className="w-4 h-4 mr-2" />
              Heart Rate
            </TabsTrigger>
            <TabsTrigger
              value="calories"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-foreground"
            >
              <Flame className="w-4 h-4 mr-2" />
              Calories
            </TabsTrigger>
            <TabsTrigger
              value="sleep"
              className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-foreground"
            >
              <Moon className="w-4 h-4 mr-2" />
              Sleep
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Steps Chart */}
              <Card className="glass-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Footprints className="w-5 h-5 text-cyan-600 dark:text-cyan-500/70" />
                    Steps This Week
                  </CardTitle>
                  <CardDescription>Daily step count</CardDescription>
                </CardHeader>
                <CardContent>
                  {stepsData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={stepsData}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="day" stroke="var(--muted-foreground)" />
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
                    <div className="h-[250px] flex items-center justify-center">
                      <p className="text-muted-foreground">No step data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Heart Rate Chart */}
              <Card className="glass-card border-border">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-600 dark:text-red-500/70" />
                    Heart Rate Today
                  </CardTitle>
                  <CardDescription>Hourly average BPM</CardDescription>
                </CardHeader>
                <CardContent>
                  {heartRateData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={heartRateData}>
                        <defs>
                          <linearGradient id="heartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="time" stroke="var(--muted-foreground)" />
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
                          dataKey="bpm"
                          stroke="#ef4444"
                          fillOpacity={1}
                          fill="url(#heartGradient)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-[250px] flex items-center justify-center">
                      <p className="text-muted-foreground">No heart rate data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Workouts */}
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-600 dark:text-amber-500/70" />
                  Recent Workouts
                </CardTitle>
                <CardDescription>Your latest activities</CardDescription>
              </CardHeader>
              <CardContent>
                {workouts.length > 0 ? (
                  <div className="space-y-4">
                    {workouts.map((workout: { type: string; duration: string; calories: number; date: string }, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-4 rounded-lg glass-card hover:scale-[1.02] transition-transform"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-500 to-teal-500 dark:from-cyan-700 dark:to-teal-700 flex items-center justify-center">
                            <Activity className="w-6 h-6 text-white dark:text-white/90" />
                          </div>
                          <div>
                            <p className="text-foreground">{workout.type}</p>
                            <p className="text-sm text-muted-foreground">{workout.date}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-foreground">{workout.duration}</p>
                          <p className="text-sm text-muted-foreground">{workout.calories} cal</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No workout data available</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Steps Tab */}
          <TabsContent value="steps">
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Footprints className="w-5 h-5 text-cyan-600 dark:text-cyan-500/70" />
                  Steps Analysis
                </CardTitle>
                <CardDescription>Detailed step count over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                {stepsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={stepsData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="day" stroke="var(--muted-foreground)" />
                      <YAxis stroke="var(--muted-foreground)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="steps" fill="#06b6d4" name="Steps" radius={[8, 8, 0, 0]} />
                      <Bar dataKey="goal" fill="#94a3b8" name="Goal" radius={[8, 8, 0, 0]} opacity={0.3} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[400px] flex items-center justify-center">
                    <p className="text-muted-foreground">No step data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Heart Rate Tab */}
          <TabsContent value="heart">
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-600 dark:text-red-500/70" />
                  Heart Rate Trends
                </CardTitle>
                <CardDescription>Your heart rate throughout the day</CardDescription>
              </CardHeader>
              <CardContent>
                {heartRateData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={heartRateData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="time" stroke="var(--muted-foreground)" />
                      <YAxis stroke="var(--muted-foreground)" domain={[50, 90]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="bpm"
                        stroke="#ef4444"
                        strokeWidth={3}
                        dot={{ fill: '#ef4444', r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[400px] flex items-center justify-center">
                    <p className="text-muted-foreground">No heart rate data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Calories Tab */}
          <TabsContent value="calories">
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-600 dark:text-orange-500/70" />
                  Calories Burned
                </CardTitle>
                <CardDescription>Active vs resting calories</CardDescription>
              </CardHeader>
              <CardContent>
                {caloriesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={caloriesData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="day" stroke="var(--muted-foreground)" />
                      <YAxis stroke="var(--muted-foreground)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="active" stackId="a" fill="#f59e0b" name="Active" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="resting" stackId="a" fill="#94a3b8" name="Resting" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[400px] flex items-center justify-center">
                    <p className="text-muted-foreground">No calorie data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Sleep Tab */}
          <TabsContent value="sleep">
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="w-5 h-5 text-purple-600 dark:text-purple-500/70" />
                  Sleep Analysis
                </CardTitle>
                <CardDescription>Sleep stages breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {sleepData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={sleepData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="day" stroke="var(--muted-foreground)" />
                      <YAxis stroke="var(--muted-foreground)" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'var(--card)',
                          border: '1px solid var(--border)',
                          borderRadius: '8px',
                        }}
                      />
                      <Legend />
                      <Bar dataKey="deep" stackId="a" fill="#8b5cf6" name="Deep Sleep" />
                      <Bar dataKey="light" stackId="a" fill="#a78bfa" name="Light Sleep" />
                      <Bar dataKey="rem" stackId="a" fill="#c4b5fd" name="REM Sleep" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[400px] flex items-center justify-center">
                    <p className="text-muted-foreground">No sleep data available</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Bottom CTA */}
        <Card className="glass-card border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-teal-500/5">
          <CardContent className="p-8 text-center">
            <Zap className="w-12 h-12 text-cyan-600 dark:text-cyan-500/70 mx-auto mb-4" />
            <h3 className="text-2xl text-foreground mb-2">Want to Save & Share Your Data?</h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Coming soon: Create a free account to store your encrypted health data securely and share it with
              healthcare providers, trainers, or family members via encrypted links.
            </p>
            <Button
              onClick={onSignupClick}
              className="gradient-primary hover:opacity-90 transition-all px-8 py-6 text-lg"
              disabled
            >
              Coming Soon
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
