import { Shield, Github, Menu, Sun, Moon } from 'lucide-react';
import { Button } from './ui/button';
import { useTheme } from './ThemeProvider';

interface HeaderProps {
  onTryDemo: () => void;
  onLogoClick: () => void;
  hideNavigation?: boolean;
}

export default function Header({ onTryDemo, onLogoClick, hideNavigation = false }: HeaderProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToPrivacy = () => {
    document.getElementById('privacy')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 navbar-glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <button 
            onClick={onLogoClick}
            className="flex items-center gap-3 group cursor-pointer"
          >
            <div className="relative">
              <div className="absolute inset-0 gradient-primary rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity" />
              <div className="relative w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="text-xl text-foreground tracking-tight">VaultFit</span>
          </button>

          {/* Navigation */}
          {!hideNavigation && (
            <nav className="hidden md:flex items-center gap-8">
              <button 
                onClick={scrollToFeatures}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Features
              </button>
              <button 
                onClick={scrollToPrivacy}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                Privacy
              </button>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors flex items-center gap-2"
              >
                <Github className="w-4 h-4" />
                <span>GitHub</span>
              </a>
            </nav>
          )}

          {/* CTA & Theme Toggle */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="glass-card border-border hover:border-primary/50 w-10 h-10"
            >
              {theme === 'dark' ? (
                <Sun className="w-5 h-5 text-amber-400" />
              ) : (
                <Moon className="w-5 h-5 text-cyan-600" />
              )}
            </Button>

            <Button
              onClick={onTryDemo}
              className="gradient-primary hover:opacity-90 transition-all hover:shadow-lg hover:shadow-cyan-500/50"
            >
              Log in
            </Button>
            <button className="md:hidden cursor-pointer">
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
