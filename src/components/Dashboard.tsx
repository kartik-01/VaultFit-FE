import { useState } from 'react';
import {
  Activity,
  Heart,
  Footprints,
  Moon,
  Flame,
  TrendingUp,
  Share2,
  Download,
  Calendar,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

// Mock data
const stepsData = [
  { date: 'Mon', steps: 8234 },
  { date: 'Tue', steps: 12456 },
  { date: 'Wed', steps: 10234 },
  { date: 'Thu', steps: 15678 },
  { date: 'Fri', steps: 9876 },
  { date: 'Sat', steps: 14532 },
  { date: 'Sun', steps: 11234 },
];

const heartRateData = [
  { time: '00:00', bpm: 62 },
  { time: '04:00', bpm: 58 },
  { time: '08:00', bpm: 72 },
  { time: '12:00', bpm: 85 },
  { time: '16:00', bpm: 78 },
  { time: '20:00', bpm: 68 },
];

const caloriesData = [
  { date: 'Mon', active: 456, resting: 1540 },
  { date: 'Tue', active: 678, resting: 1580 },
  { date: 'Wed', active: 534, resting: 1520 },
  { date: 'Thu', active: 789, resting: 1600 },
  { date: 'Fri', active: 512, resting: 1510 },
  { date: 'Sat', active: 823, resting: 1620 },
  { date: 'Sun', active: 645, resting: 1550 },
];

const sleepData = [
  { date: 'Mon', hours: 7.5 },
  { date: 'Tue', hours: 6.8 },
  { date: 'Wed', hours: 8.2 },
  { date: 'Thu', hours: 7.1 },
  { date: 'Fri', hours: 6.5 },
  { date: 'Sat', hours: 9.0 },
  { date: 'Sun', hours: 8.5 },
];

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<'daily' | 'weekly' | 'monthly'>('weekly');

  const metrics = [
    {
      title: 'Steps',
      value: '11,463',
      change: '+12%',
      icon: Footprints,
      gradient: 'from-blue-500 to-cyan-500',
      chartColor: '#06b6d4',
    },
    {
      title: 'Heart Rate',
      value: '72 bpm',
      change: 'Normal',
      icon: Heart,
      gradient: 'from-red-500 to-pink-500',
      chartColor: '#ef4444',
    },
    {
      title: 'Active Calories',
      value: '634 kcal',
      change: '+8%',
      icon: Flame,
      gradient: 'from-orange-500 to-amber-500',
      chartColor: '#f59e0b',
    },
    {
      title: 'Sleep',
      value: '7.6 hrs',
      change: '+5%',
      icon: Moon,
      gradient: 'from-purple-500 to-indigo-500',
      chartColor: '#8b5cf6',
    },
  ];

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Effect */}
      <div className="absolute inset-0 gradient-mesh opacity-20" />

      <div className="relative max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-12 animate-slide-in-up">
          <div>
            <h2 className="text-4xl sm:text-5xl mb-3">
              Your <span className="text-gradient">Health Dashboard</span>
            </h2>
            <p className="text-muted-foreground flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Last 7 days • Updated just now
            </p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="glass-card border-border hover:border-primary/50 gap-2">
              <Download className="w-4 h-4" />
              Export
            </Button>
            <Button className="gradient-primary hover:opacity-90 transition-all hover:shadow-lg hover:shadow-cyan-500/50 gap-2">
              <Share2 className="w-4 h-4" />
              Share Link
            </Button>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="flex gap-2 mb-8 animate-slide-in-up" style={{ animationDelay: '0.1s' }}>
          <Button
            variant={timeRange === 'daily' ? 'default' : 'outline'}
            onClick={() => setTimeRange('daily')}
            className={timeRange === 'daily' ? 'gradient-primary' : 'glass-card border-border hover:border-primary/50'}
          >
            Daily
          </Button>
          <Button
            variant={timeRange === 'weekly' ? 'default' : 'outline'}
            onClick={() => setTimeRange('weekly')}
            className={timeRange === 'weekly' ? 'gradient-primary' : 'glass-card border-border hover:border-primary/50'}
          >
            Weekly
          </Button>
          <Button
            variant={timeRange === 'monthly' ? 'default' : 'outline'}
            onClick={() => setTimeRange('monthly')}
            className={timeRange === 'monthly' ? 'gradient-primary' : 'glass-card border-border hover:border-primary/50'}
          >
            Monthly
          </Button>
        </div>

        {/* Metric Cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {metrics.map((metric, index) => (
            <div
              key={index}
              className="glass-card rounded-2xl p-6 animate-slide-in-up"
              style={{ animationDelay: `${0.2 + index * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="relative">
                  <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} rounded-xl blur-lg opacity-50`} />
                  <div className={`relative w-12 h-12 bg-gradient-to-br ${metric.gradient} rounded-xl flex items-center justify-center`}>
                    <metric.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-400 dark:text-emerald-500/70 border-emerald-500/20">
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {metric.change}
                </Badge>
              </div>
              <p className="text-muted-foreground mb-1">{metric.title}</p>
              <p className="text-3xl text-foreground">{metric.value}</p>
            </div>
          ))}
        </div>

        {/* Charts */}
        <Tabs defaultValue="steps" className="space-y-8 animate-slide-in-up" style={{ animationDelay: '0.5s' }}>
          <TabsList className="glass-card p-1 border-border">
            <TabsTrigger value="steps" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-foreground">
              Steps
            </TabsTrigger>
            <TabsTrigger value="heart" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-foreground">
              Heart Rate
            </TabsTrigger>
            <TabsTrigger value="calories" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-foreground">
              Calories
            </TabsTrigger>
            <TabsTrigger value="sleep" className="data-[state=active]:bg-cyan-500/20 data-[state=active]:text-foreground">
              Sleep
            </TabsTrigger>
          </TabsList>

          <TabsContent value="steps">
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Footprints className="w-5 h-5 text-cyan-400 dark:text-cyan-500/70" />
                  Steps This Week
                </CardTitle>
                <CardDescription>Daily step count over the last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={stepsData}>
                    <defs>
                      <linearGradient id="stepsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.8} />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0.2} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#a1a1aa" />
                    <YAxis stroke="#a1a1aa" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#131318', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff'
                      }} 
                    />
                    <Bar dataKey="steps" fill="url(#stepsGradient)" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="heart">
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-400" />
                  Heart Rate Today
                </CardTitle>
                <CardDescription>Average heart rate throughout the day</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={heartRateData}>
                    <defs>
                      <linearGradient id="heartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#ef4444" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="time" stroke="#a1a1aa" />
                    <YAxis domain={[50, 100]} stroke="#a1a1aa" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#131318', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff'
                      }} 
                    />
                    <Area
                      type="monotone"
                      dataKey="bpm"
                      stroke="#ef4444"
                      strokeWidth={3}
                      fill="url(#heartGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calories">
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flame className="w-5 h-5 text-orange-400" />
                  Calories Burned
                </CardTitle>
                <CardDescription>Active vs resting calories this week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={caloriesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#a1a1aa" />
                    <YAxis stroke="#a1a1aa" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#131318', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff'
                      }} 
                    />
                    <Bar dataKey="active" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                    <Bar dataKey="resting" fill="#fb923c" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sleep">
            <Card className="glass-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Moon className="w-5 h-5 text-purple-400" />
                  Sleep Duration
                </CardTitle>
                <CardDescription>Hours of sleep per night this week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={sleepData}>
                    <defs>
                      <linearGradient id="sleepGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#8b5cf6" />
                        <stop offset="100%" stopColor="#6366f1" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="date" stroke="#a1a1aa" />
                    <YAxis domain={[0, 10]} stroke="#a1a1aa" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#131318', 
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#fff'
                      }} 
                    />
                    <Line
                      type="monotone"
                      dataKey="hours"
                      stroke="url(#sleepGradient)"
                      strokeWidth={3}
                      dot={{ fill: '#8b5cf6', r: 6, strokeWidth: 2, stroke: '#0a0a0f' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Share Info */}
        <div className="mt-12 glass-card rounded-2xl p-8 animate-slide-in-up" style={{ animationDelay: '0.6s' }}>
          <div className="flex flex-col sm:flex-row items-start gap-6">
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 gradient-primary rounded-2xl blur-xl opacity-50" />
              <div className="relative w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center">
                <Activity className="w-8 h-8 text-white" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-2xl text-foreground mb-3">
                Share Your Health Journey
              </h3>
              <p className="text-muted-foreground mb-6">
                Generate a secure, encrypted link to share this dashboard with your
                doctor, trainer, or family members. Only those with the link can view your data.
              </p>
              <Button className="gradient-primary hover:opacity-90 transition-all hover:shadow-lg hover:shadow-cyan-500/50 gap-2">
                <Share2 className="w-4 h-4" />
                Sign In to Generate Link
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
