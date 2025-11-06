import { ArrowRight, Sparkles, Lock, Zap, Footprints, Heart, Flame } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';

interface HeroSectionProps {
  onTryNow: () => void;
  onLearnMore: () => void;
}

export default function HeroSection({ onTryNow, onLearnMore }: HeroSectionProps) {
  return (
    <section className="relative pt-32 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 gradient-mesh opacity-40" />
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 dark:bg-cyan-500/15 rounded-full blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/20 dark:bg-emerald-500/15 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative max-w-7xl mx-auto">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex animate-slide-in-up">
            <Badge className="bg-cyan-500/10 text-cyan-700 dark:text-cyan-500/70 border-cyan-500/20 px-4 py-2 gap-2 hover:bg-cyan-500/20 transition-colors">
              <Sparkles className="w-4 h-4" />
              End-to-End Encrypted Health Data
            </Badge>
          </div>

          {/* Main Heading with Typing Animation */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl tracking-tight">
            <span className="inline-block animate-typing" style={{ animationDelay: '0.1s', animationDuration: '1.2s' }}>
              Your Health Data,
            </span>
            <br />
            <span className="inline-block text-gradient animate-word-reveal" style={{ animationDelay: '1.6s' }}>
              Beautifully
            </span>
            {' '}
            <span className="inline-block text-gradient animate-word-reveal" style={{ animationDelay: '2.2s' }}>
              Private
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto animate-slide-in-up" style={{ animationDelay: '2.5s' }}>
            Visualize your Apple Health data with stunning charts and insights. 
            Everything stays encrypted and secure—only you have access.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap gap-4 justify-center animate-slide-in-up" style={{ animationDelay: '2.7s' }}>
            <Button
              onClick={onTryNow}
              size="lg"
              className="gradient-primary hover:opacity-90 transition-all hover:shadow-xl hover:shadow-cyan-500/50 gap-2 group"
            >
              Get Started
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              onClick={onLearnMore}
              size="lg"
              variant="outline"
              className="glass-card border-border hover:border-cyan-500/50 gap-2"
            >
              <Sparkles className="w-4 h-4" />
              See How It Works
            </Button>
          </div>

          {/* Features Grid */}
          <div className="grid sm:grid-cols-3 gap-6 pt-12 animate-slide-in-up" style={{ animationDelay: '2.9s' }}>
            <div className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-500/70" />
              </div>
              <div className="text-left">
                <p className="text-foreground">Zero Knowledge</p>
                <p className="text-muted-foreground">Local processing</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 dark:bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-cyan-600 dark:text-cyan-500/70" />
              </div>
              <div className="text-left">
                <p className="text-foreground">Instant Insights</p>
                <p className="text-muted-foreground">Real-time charts</p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-center">
              <div className="w-10 h-10 rounded-lg bg-teal-500/10 dark:bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-teal-600 dark:text-teal-500/70" />
              </div>
              <div className="text-left">
                <p className="text-foreground">Beautiful UI</p>
                <p className="text-muted-foreground">Modern design</p>
              </div>
            </div>
          </div>
        </div>

        {/* Hero Visual - Dashboard Preview */}
        <div className="mt-20 animate-slide-in-up" style={{ animationDelay: '3.1s' }}>
          <div className="relative">
            {/* Glow effect behind preview */}
            <div className="absolute inset-0 gradient-primary rounded-3xl blur-3xl opacity-20" />
            
            {/* Preview Container */}
            <div className="relative glass-card rounded-2xl p-2 overflow-hidden">
              <div className="bg-gradient-to-br from-cyan-500/10 to-teal-500/10 dark:from-cyan-500/20 dark:to-teal-500/20 rounded-xl p-8 backdrop-blur-xl">
                {/* Metric Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {/* Steps Card */}
                  <div className="glass-card rounded-lg p-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-3">
                      <Footprints className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Steps</p>
                    <p className="text-2xl text-foreground">12,847</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500/70 mt-1">+15% today</p>
                  </div>

                  {/* Heart Rate Card */}
                  <div className="glass-card rounded-lg p-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-pink-500 flex items-center justify-center mb-3">
                      <Heart className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Heart Rate</p>
                    <p className="text-2xl text-foreground">72 bpm</p>
                    <p className="text-xs text-muted-foreground mt-1">Normal</p>
                  </div>

                  {/* Calories Card */}
                  <div className="glass-card rounded-lg p-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center mb-3">
                      <Flame className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">Calories</p>
                    <p className="text-2xl text-foreground">2,184</p>
                    <p className="text-xs text-emerald-600 dark:text-emerald-500/70 mt-1">Goal met</p>
                  </div>
                </div>

                {/* Chart Preview */}
                <div className="glass-card rounded-lg p-6">
                  <div className="flex items-end justify-between gap-2 h-32">
                    <div className="flex-1 bg-gradient-to-t from-cyan-600 to-teal-400 rounded-t" style={{ height: '45%' }} />
                    <div className="flex-1 bg-gradient-to-t from-cyan-600 to-teal-400 rounded-t" style={{ height: '75%' }} />
                    <div className="flex-1 bg-gradient-to-t from-teal-600 to-emerald-400 rounded-t" style={{ height: '60%' }} />
                    <div className="flex-1 bg-gradient-to-t from-teal-600 to-emerald-400 rounded-t" style={{ height: '95%' }} />
                    <div className="flex-1 bg-gradient-to-t from-emerald-600 to-green-400 rounded-t" style={{ height: '55%' }} />
                    <div className="flex-1 bg-gradient-to-t from-emerald-600 to-green-400 rounded-t" style={{ height: '85%' }} />
                    <div className="flex-1 bg-gradient-to-t from-teal-600 to-emerald-400 rounded-t" style={{ height: '70%' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
