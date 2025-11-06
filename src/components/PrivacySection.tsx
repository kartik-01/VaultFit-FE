import { Shield, Eye, Server, Lock, Code, Database } from 'lucide-react';
import { useScrollAnimation } from './useScrollAnimation';
import { useCardScrollAnimation } from './useCardScrollAnimation';
import { useState, useEffect } from 'react';

function PrivacyCard({ feature, index }: { feature: any; index: number }) {
  const { ref, isVisible } = useCardScrollAnimation(index, 3);

  return (
    <div
      ref={ref}
      className={`glass-card rounded-3xl p-8 hover:scale-105 cursor-pointer transition-all duration-700 ease-out ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'
      }`}
      style={{ 
        willChange: isVisible ? 'auto' : 'transform, opacity'
      }}
    >
      {/* Icon & Stat */}
      <div className="relative mb-6 flex justify-center">
        <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} dark:${feature.darkGradient} rounded-2xl blur-2xl opacity-50`} />
        <div className={`relative w-20 h-20 bg-gradient-to-br ${feature.gradient} dark:${feature.darkGradient} rounded-2xl flex items-center justify-center`}>
          <feature.icon className="w-10 h-10 text-white dark:text-white/90" />
        </div>
      </div>

      {/* Stat Number */}
      <div 
        className={`text-center mb-4 transition-all duration-700 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`} 
        style={{ transitionDelay: isVisible ? '0.3s' : '0s' }}
      >
        <div className="text-6xl sm:text-7xl text-gradient mb-2">{feature.stat}</div>
        <h3 className="text-2xl text-foreground">{feature.title}</h3>
      </div>

      {/* Description */}
      <p className="text-muted-foreground mb-6 text-center">
        {feature.description}
      </p>

      {/* Details List */}
      <div className="space-y-3">
        {feature.details.map((detail: string, idx: number) => (
          <div key={idx} className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${feature.gradient} dark:${feature.darkGradient}`} />
            <span>{detail}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdditionalPrivacyInfo() {
  const { ref, isVisible } = useCardScrollAnimation(3, 4);

  return (
    <div 
      ref={ref}
      className={`glass-card rounded-3xl p-8 sm:p-12 hover:scale-[1.02] cursor-pointer transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-12 scale-95'}`} 
      style={{ 
        willChange: isVisible ? 'auto' : 'transform, opacity'
      }}
    >
      <div className="flex flex-col sm:flex-row items-start gap-6">
        <div className="relative flex-shrink-0">
          <div className="absolute inset-0 gradient-primary rounded-2xl blur-xl opacity-50" />
          <div className="relative w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center">
            <Shield className="w-8 h-8 text-white" />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-2xl text-foreground mb-3">
            Open Source & Transparent
          </h3>
          <p className="text-muted-foreground mb-4">
            Don't take our word for it. VaultFit's source code is completely open and auditable. 
            Security researchers, developers, and privacy advocates can verify every line of code 
            to ensure we're doing exactly what we say—nothing more, nothing less.
          </p>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
              <Code className="w-4 h-4 text-cyan-400 dark:text-cyan-500/70" />
              <span className="text-cyan-400 dark:text-cyan-500/70">Open Source</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <Eye className="w-4 h-4 text-emerald-400 dark:text-emerald-500/70" />
              <span className="text-emerald-400 dark:text-emerald-500/70">Fully Auditable</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
              <Lock className="w-4 h-4 text-purple-400 dark:text-purple-500/70" />
              <span className="text-purple-400 dark:text-purple-500/70">Zero Trust Architecture</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PrivacySection() {
  const { ref, isVisible } = useScrollAnimation(0.1);

  const privacyFeatures = [
    {
      icon: Server,
      stat: '100%',
      title: 'Client-Side Processing',
      description: 'Every single operation happens locally in your browser. Your health data never touches our servers or leaves your device. All data parsing, encryption, and analysis occurs on your machine, ensuring complete data sovereignty.',
      details: [
        'Zero server uploads',
        'Local-only data processing',
        'Complete data sovereignty',
        'No cloud dependencies'
      ],
      gradient: 'from-cyan-500 to-blue-500',
      darkGradient: 'from-cyan-700 to-blue-700',
    },
    {
      icon: Database,
      stat: '0',
      title: 'Data Collection',
      description: 'We collect absolutely nothing. No analytics, no tracking pixels, no cookies, no telemetry. We don\'t even know you visited this page. Your privacy is not just protected—it\'s guaranteed by design.',
      details: [
        'No analytics or tracking',
        'No cookies or identifiers',
        'No usage telemetry',
        'No IP logging'
      ],
      gradient: 'from-emerald-500 to-teal-500',
      darkGradient: 'from-emerald-700 to-teal-700',
    },
    {
      icon: Lock,
      stat: '∞',
      title: 'Your Privacy Protected',
      description: 'Unlimited, perpetual protection with military-grade end-to-end encryption. Your data is encrypted before it ever leaves your memory, and only you hold the keys. Not even we can access your health information.',
      details: [
        'AES-256 encryption standard',
        'End-to-end encrypted sharing',
        'Zero-knowledge architecture',
        'You control all access'
      ],
      gradient: 'from-purple-500 to-pink-500',
      darkGradient: 'from-purple-700 to-pink-700',
    },
  ];

  return (
    <section id="privacy" ref={ref} className="relative pt-24 pb-8 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background via-cyan-500/5 to-background">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl mb-4">
            <span className={`inline-block ${isVisible ? 'animate-word-reveal' : 'opacity-0'}`} style={{ animationDelay: '0s' }}>
              Privacy
            </span>
            {' '}
            <span className={`inline-block text-gradient ${isVisible ? 'animate-word-reveal' : 'opacity-0'}`} style={{ animationDelay: '0.4s' }}>
              by Design
            </span>
          </h2>
          <p className={`text-xl text-muted-foreground max-w-2xl mx-auto transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`} style={{ transitionDelay: '0.8s' }}>
            Your health data deserves the highest level of protection. Here's our unwavering commitment to your privacy.
          </p>
        </div>

        {/* Privacy Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {privacyFeatures.map((feature, index) => (
            <PrivacyCard key={index} feature={feature} index={index} />
          ))}
        </div>

        {/* Additional Privacy Info */}
        <AdditionalPrivacyInfo />
      </div>
    </section>
  );
}
