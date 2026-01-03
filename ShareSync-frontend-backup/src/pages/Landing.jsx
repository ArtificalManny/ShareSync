// src/pages/Landing.jsx - MOBILE OPTIMIZED
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, CheckCircle2, ArrowRight, Zap, Brain, Shield, Users,
  TrendingUp, Heart, Target, BarChart3, Gamepad2, Lock, Sparkles,
  ChevronLeft, ChevronRight, Check, X, Mail, Github, Twitter,
  Linkedin, Menu, XIcon
} from 'lucide-react';
import { useIsMobile } from '../hooks/useMobile';

export default function Landing() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [email, setEmail] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const testimonials = [
    {
      quote: "Finally, a tool that cares about my wellbeing",
      author: "Sarah Chen",
      role: "Product Manager",
      avatar: "👩‍💼"
    },
    {
      quote: "I haven't burned out in 3 months. That's a record.",
      author: "Alex Martinez",
      role: "Founder",
      avatar: "👨‍💻"
    },
    {
      quote: "The streak system actually works for ADHD brains",
      author: "Jordan Lee",
      role: "Student",
      avatar: "🎓"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const handleEmailSignup = (e) => {
    e.preventDefault();
    console.log('Email signup:', email);
    alert(`Thanks! We'll email you at ${email}`);
    setEmail('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      
      {/* Mobile Navigation */}
      {isMobile && (
        <>
          <div className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-lg border-b border-slate-800">
            <div className="flex items-center justify-between px-4 py-4">
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                ShareSync
              </h1>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors tap-target"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          {mobileMenuOpen && (
            <div className="fixed inset-0 z-40 bg-slate-950/98 backdrop-blur-lg pt-20">
              <div className="px-6 py-8 space-y-6">
                <button
                  onClick={() => {
                    navigate('/login');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-4 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold text-lg transition-all tap-target"
                >
                  Log In
                </button>
                <button
                  onClick={() => {
                    navigate('/create-account');
                    setMobileMenuOpen(false);
                  }}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-fuchsia-600 rounded-xl font-bold text-lg transition-all tap-target"
                >
                  Start Free
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-fuchsia-500/5 to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl" />

        <div className={`relative max-w-7xl mx-auto px-4 sm:px-6 ${isMobile ? 'pt-24 pb-12' : 'py-20 sm:py-32'}`}>
          <div className="text-center space-y-8">
            
            <h1 className={`${isMobile ? 'text-4xl' : 'text-5xl sm:text-6xl lg:text-7xl'} font-bold tracking-tight`}>
              <span className="block text-white mb-2">
                Stop Burning Out.
              </span>
              <span className="block bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                Start Shipping.
              </span>
            </h1>

            <p className={`max-w-3xl mx-auto ${isMobile ? 'text-lg' : 'text-xl sm:text-2xl'} text-slate-300 leading-relaxed px-4`}>
              The only project tracker that <span className="text-white font-semibold">prevents burnout</span> before it happens
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 px-4">
              <button
                onClick={() => navigate('/create-account')}
                className={`group bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 
                         text-white ${isMobile ? 'w-full' : ''} px-8 py-4 rounded-xl font-bold ${isMobile ? 'text-base' : 'text-lg'} transition-all shadow-lg shadow-purple-500/30 
                         hover:shadow-purple-500/50 active:scale-95 flex items-center justify-center gap-2 tap-target`}
              >
                Start Free Forever
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
              {!isMobile && (
                <button
                  onClick={() => {
                    document.getElementById('demo-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="group bg-slate-800 hover:bg-slate-700 text-white px-8 py-4 rounded-xl 
                           font-semibold text-lg transition-all border border-slate-700 hover:border-purple-500/50 
                           flex items-center gap-2"
                >
                  <Play className="w-5 h-5" />
                  Watch Demo
                </button>
              )}
            </div>

            <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-center gap-6'} pt-8 text-slate-400 px-4`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-sm">100% Free. Forever.</span>
              </div>
              {!isMobile && <div className="w-px h-4 bg-slate-700" />}
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-semibold text-white">Built for students, not stockholders</span>
              </div>
            </div>

            {!isMobile && (
              <div id="demo-section" className="pt-12">
                <div className="max-w-5xl mx-auto">
                  <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 bg-slate-800/50 backdrop-blur">
                    <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
                      <div className="text-center space-y-4">
                        <div className="w-20 h-20 mx-auto rounded-full bg-purple-500/20 flex items-center justify-center">
                          <Play className="w-10 h-10 text-purple-400" />
                        </div>
                        <p className="text-slate-400 text-lg">Demo video coming soon</p>
                        <p className="text-slate-500 text-sm max-w-md mx-auto">
                          See how ShareSync prevents burnout with AI-powered momentum tracking
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Feature Highlights - Mobile optimized grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className={`${isMobile ? 'text-3xl' : 'text-4xl sm:text-5xl'} font-bold text-white mb-4`}>
            Built Different
          </h2>
          <p className={`${isMobile ? 'text-lg' : 'text-xl'} text-slate-400 max-w-2xl mx-auto px-4`}>
            The first project tracker designed to protect your mental health, not just your productivity
          </p>
        </div>

        <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'} gap-6 sm:gap-8`}>
          
          {[
            {
              icon: Sparkles,
              gradient: 'from-purple-500 to-fuchsia-500',
              title: 'AI Burnout Prevention',
              description: 'Detect overwork patterns before you crash. Our AI learns your work habits and intervenes when you\'re pushing too hard.'
            },
            {
              icon: Target,
              gradient: 'from-blue-500 to-cyan-500',
              title: 'Momentum-Based Workflow',
              description: 'Transform how you work. Streaks that motivate without guilt-tripping, building sustainable habits through positive reinforcement.'
            },
            {
              icon: Brain,
              gradient: 'from-emerald-500 to-teal-500',
              title: 'Personal AI Coach',
              description: 'Get real-time coaching based on your unique work patterns. Personalized breakthroughs when you need them most.'
            },
            {
              icon: BarChart3,
              gradient: 'from-amber-500 to-orange-500',
              title: 'Behavioral Analytics',
              description: 'Discover what actually makes you productive. Data-driven insights reveal your peak performance times and patterns.'
            },
            {
              icon: Gamepad2,
              gradient: 'from-pink-500 to-rose-500',
              title: 'Identity-Forming System',
              description: 'Transform who you are, not just what you do. Gamification that builds lasting habits and levels up your identity.'
            },
            {
              icon: Lock,
              gradient: 'from-indigo-500 to-purple-500',
              title: 'Privacy-First',
              description: 'Protect your data. Always. We don\'t sell, share, or train AI models on your personal information. Ever.'
            }
          ].map((feature, idx) => (
            <div key={idx} className="group modern-card p-6 sm:p-8 space-y-4 hover:scale-105 transition-all">
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center`}>
                <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
              </div>
              <h3 className={`${isMobile ? 'text-lg' : 'text-xl'} font-bold text-white`}>{feature.title}</h3>
              <p className={`${isMobile ? 'text-sm' : 'text-base'} text-slate-400 leading-relaxed`}>
                {feature.description}
              </p>
            </div>
          ))}

        </div>
      </div>

      {/* Comparison Table - Scroll on mobile */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className={`${isMobile ? 'text-3xl' : 'text-4xl sm:text-5xl'} font-bold text-white mb-4`}>
            Why ShareSync?
          </h2>
          <p className={`${isMobile ? 'text-lg' : 'text-xl'} text-slate-400 max-w-2xl mx-auto px-4`}>
            The only tool designed to prevent burnout, not just track tasks
          </p>
        </div>

        <div className="modern-card-elevated overflow-x-auto hide-scrollbar">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-4 px-4 sm:px-6 text-slate-400 font-semibold text-sm">Feature</th>
                <th className="py-4 px-3 sm:px-6 text-purple-400 font-bold text-sm">ShareSync</th>
                <th className="py-4 px-3 sm:px-6 text-slate-400 font-semibold text-sm">Asana</th>
                <th className="py-4 px-3 sm:px-6 text-slate-400 font-semibold text-sm">Notion</th>
                <th className="py-4 px-3 sm:px-6 text-slate-400 font-semibold text-sm">Monday</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-slate-800">
                <td className="py-4 px-4 sm:px-6 text-white font-medium">Burnout Detection</td>
                <td className="py-4 px-3 sm:px-6 text-center"><Check className="w-5 h-5 text-emerald-400 mx-auto" /></td>
                <td className="py-4 px-3 sm:px-6 text-center"><X className="w-5 h-5 text-slate-600 mx-auto" /></td>
                <td className="py-4 px-3 sm:px-6 text-center"><X className="w-5 h-5 text-slate-600 mx-auto" /></td>
                <td className="py-4 px-3 sm:px-6 text-center"><X className="w-5 h-5 text-slate-600 mx-auto" /></td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-4 px-4 sm:px-6 text-white font-medium">AI Coach</td>
                <td className="py-4 px-3 sm:px-6 text-center"><Check className="w-5 h-5 text-emerald-400 mx-auto" /></td>
                <td className="py-4 px-3 sm:px-6 text-center"><X className="w-5 h-5 text-slate-600 mx-auto" /></td>
                <td className="py-4 px-3 sm:px-6 text-center"><X className="w-5 h-5 text-slate-600 mx-auto" /></td>
                <td className="py-4 px-3 sm:px-6 text-center"><X className="w-5 h-5 text-slate-600 mx-auto" /></td>
              </tr>
              <tr className="border-b border-slate-800">
                <td className="py-4 px-4 sm:px-6 text-white font-medium">Momentum System</td>
                <td className="py-4 px-3 sm:px-6 text-center"><Check className="w-5 h-5 text-emerald-400 mx-auto" /></td>
                <td className="py-4 px-3 sm:px-6 text-center"><X className="w-5 h-5 text-slate-600 mx-auto" /></td>
                <td className="py-4 px-3 sm:px-6 text-center"><X className="w-5 h-5 text-slate-600 mx-auto" /></td>
                <td className="py-4 px-3 sm:px-6 text-center"><X className="w-5 h-5 text-slate-600 mx-auto" /></td>
              </tr>
              <tr className="bg-purple-500/5">
                <td className="py-4 px-4 sm:px-6 text-white font-bold">Price</td>
                <td className="py-4 px-3 sm:px-6 text-center">
                  <div className="text-emerald-400 font-bold text-lg">FREE</div>
                  <div className="text-xs text-slate-400">Forever</div>
                </td>
                <td className="py-4 px-3 sm:px-6 text-center text-slate-400">$10.99/mo</td>
                <td className="py-4 px-3 sm:px-6 text-center text-slate-400">$10/mo</td>
                <td className="py-4 px-3 sm:px-6 text-center text-slate-400">$9/mo</td>
              </tr>
            </tbody>
          </table>
        </div>

        {isMobile && (
          <div className="text-center mt-4">
            <p className="text-xs text-slate-500">← Scroll to see more →</p>
          </div>
        )}
      </div>

      {/* Testimonials - Mobile optimized */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className={`${isMobile ? 'text-3xl' : 'text-4xl sm:text-5xl'} font-bold text-white mb-4`}>
            Loved by Makers
          </h2>
          <p className={`${isMobile ? 'text-lg' : 'text-xl'} text-slate-400`}>
            Join hundreds who've stopped burning out
          </p>
        </div>

        <div className="relative modern-card-elevated p-8 sm:p-12">
          <div className="text-center space-y-4 sm:space-y-6 min-h-[200px] flex flex-col items-center justify-center">
            <div className={`${isMobile ? 'text-5xl' : 'text-6xl'}`}>{testimonials[currentTestimonial].avatar}</div>
            <blockquote className={`${isMobile ? 'text-xl' : 'text-2xl'} font-medium text-white leading-relaxed max-w-2xl px-4`}>
              "{testimonials[currentTestimonial].quote}"
            </blockquote>
            <div>
              <div className={`${isMobile ? 'text-base' : 'text-lg'} font-semibold text-white`}>
                {testimonials[currentTestimonial].author}
              </div>
              <div className="text-slate-400 text-sm">
                {testimonials[currentTestimonial].role}
              </div>
            </div>
          </div>

          {!isMobile && (
            <>
              <button
                onClick={prevTestimonial}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 
                         flex items-center justify-center transition-all border border-slate-700 hover:border-purple-500/50"
              >
                <ChevronLeft className="w-5 h-5 text-white" />
              </button>
              
              <button
                onClick={nextTestimonial}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-800 hover:bg-slate-700 
                         flex items-center justify-center transition-all border border-slate-700 hover:border-purple-500/50"
              >
                <ChevronRight className="w-5 h-5 text-white" />
              </button>
            </>
          )}

          <div className="flex items-center justify-center gap-2 mt-6 sm:mt-8">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentTestimonial(idx)}
                className={`w-2 h-2 rounded-full transition-all tap-target ${
                  idx === currentTestimonial 
                    ? 'w-8 bg-purple-500' 
                    : 'bg-slate-600 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA - Mobile optimized */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <h2 className={`${isMobile ? 'text-3xl' : 'text-4xl sm:text-5xl'} font-bold text-white mb-4`}>
          Ready to Transform How You Work?
        </h2>
        <p className={`${isMobile ? 'text-lg' : 'text-xl'} text-slate-400 mb-8 sm:mb-12 px-4`}>
          Join 500+ students and makers who've stopped the burnout cycle
        </p>

        <form onSubmit={handleEmailSignup} className="max-w-md mx-auto mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-12 pr-4 py-4 
                         text-white placeholder-slate-400 focus:outline-none focus:border-purple-500 transition-all text-base"
              />
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 
                       text-white px-8 py-4 rounded-lg font-bold transition-all shadow-lg shadow-purple-500/30 
                       hover:shadow-purple-500/50 whitespace-nowrap active:scale-95 tap-target"
            >
              Get Early Access
            </button>
          </div>
        </form>

        <p className="text-sm text-slate-500">
          100% free. No credit card. Unsubscribe anytime.
        </p>
      </div>

      {/* Footer - Mobile optimized */}
      <footer className="border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className={`grid ${isMobile ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-6 sm:gap-8 mb-8 sm:mb-12`}>
            
            <div>
              <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Product</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-xs sm:text-sm">Features</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-xs sm:text-sm">Roadmap</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-xs sm:text-sm">Changelog</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Company</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-xs sm:text-sm">About</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-xs sm:text-sm">Blog</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-xs sm:text-sm">Mission</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Resources</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-xs sm:text-sm">Docs</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-xs sm:text-sm">Help Center</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-xs sm:text-sm">Community</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Legal</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-xs sm:text-sm">Privacy</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-xs sm:text-sm">Terms</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors text-xs sm:text-sm">Security</a></li>
              </ul>
            </div>

          </div>

          <div className="flex flex-col md:flex-row items-center justify-between pt-6 sm:pt-8 border-t border-slate-800 gap-4">
            <div className="text-slate-400 text-xs sm:text-sm text-center md:text-left">
              © 2026 ShareSync. Built for students, not stockholders.
            </div>

            <div className="flex items-center gap-6">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" 
                 className="text-slate-400 hover:text-white transition-colors tap-target">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" 
                 className="text-slate-400 hover:text-white transition-colors tap-target">
                <Github className="w-5 h-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" 
                 className="text-slate-400 hover:text-white transition-colors tap-target">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
