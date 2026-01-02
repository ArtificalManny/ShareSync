// src/pages/Landing.jsx - Professional Landing Page with Features + Social Proof
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  CheckCircle2, 
  ArrowRight, 
  Zap, 
  Brain, 
  Shield, 
  Users,
  TrendingUp,
  Heart,
  Target,
  BarChart3,
  Gamepad2,
  Lock,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

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

  // Auto-rotate testimonials every 5 seconds
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient effects */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-fuchsia-500/5 to-transparent" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl" />

        {/* Content */}
        <div className="relative max-w-7xl mx-auto px-6 py-20 sm:py-32">
          <div className="text-center space-y-8">
            
            {/* Main Headline */}
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
              <span className="block text-white mb-2">
                Stop Burning Out.
              </span>
              <span className="block bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
                Start Shipping.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="max-w-3xl mx-auto text-xl sm:text-2xl text-slate-300 leading-relaxed">
              The only project tracker that <span className="text-white font-semibold">prevents burnout</span> before it happens
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <button
                onClick={() => navigate('/create-account')}
                className="group bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 
                         text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-purple-500/30 
                         hover:shadow-purple-500/50 hover:scale-105 flex items-center gap-2"
              >
                Start Free Trial
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              
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
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center gap-6 pt-8 text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span className="text-sm">No credit card required</span>
              </div>
              <div className="w-px h-4 bg-slate-700" />
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                <span className="text-sm font-semibold text-white">500+ students & professionals</span>
              </div>
            </div>

            {/* Demo Video Placeholder */}
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
                  
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute top-4 left-4 right-4 h-12 bg-slate-900/80 backdrop-blur rounded-lg border border-slate-700/50" />
                    <div className="absolute bottom-4 left-4 right-4 h-16 bg-slate-900/80 backdrop-blur rounded-lg border border-slate-700/50" />
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ⭐ NEW: Feature Highlights Section */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Built Different
          </h2>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto">
            The first project tracker designed around behavioral science, not just task lists
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          {/* Feature 1 */}
          <div className="group modern-card p-8 space-y-4 hover:scale-105 transition-all">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-fuchsia-500 flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">AI Burnout Prevention</h3>
            <p className="text-slate-400 leading-relaxed">
              Detects overwork patterns before you crash. Our AI learns your work habits and warns you when you're pushing too hard.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="group modern-card p-8 space-y-4 hover:scale-105 transition-all">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Target className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Momentum-Based Workflow</h3>
            <p className="text-slate-400 leading-relaxed">
              Streaks that actually motivate (not guilt-trip). Build sustainable habits through positive reinforcement.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="group modern-card p-8 space-y-4 hover:scale-105 transition-all">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Personal AI Coach</h3>
            <p className="text-slate-400 leading-relaxed">
              Real-time coaching based on your work patterns. Get personalized advice when you need it most.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="group modern-card p-8 space-y-4 hover:scale-105 transition-all">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <BarChart3 className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Behavioral Analytics</h3>
            <p className="text-slate-400 leading-relaxed">
              See what actually makes you productive. Data-driven insights into your peak performance times and patterns.
            </p>
          </div>

          {/* Feature 5 */}
          <div className="group modern-card p-8 space-y-4 hover:scale-105 transition-all">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <Gamepad2 className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Identity-Forming System</h3>
            <p className="text-slate-400 leading-relaxed">
              Gamification that builds lasting habits. Level up your identity, not just your task count.
            </p>
          </div>

          {/* Feature 6 */}
          <div className="group modern-card p-8 space-y-4 hover:scale-105 transition-all">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white">Privacy-First</h3>
            <p className="text-slate-400 leading-relaxed">
              Your data stays yours. Always. We don't sell, share, or train AI models on your personal information.
            </p>
          </div>

        </div>
      </div>

      {/* ⭐ NEW: Social Proof / Testimonials Section */}
      <div className="max-w-5xl mx-auto px-6 py-24">
        <div className="text-center mb-12">
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Loved by Makers
          </h2>
          <p className="text-xl text-slate-400">
            Join hundreds who've stopped burning out
          </p>
        </div>

        <div className="relative modern-card-elevated p-12">
          {/* Testimonial Content */}
          <div className="text-center space-y-6 min-h-[200px] flex flex-col items-center justify-center">
            <div className="text-6xl">{testimonials[currentTestimonial].avatar}</div>
            <blockquote className="text-2xl font-medium text-white leading-relaxed max-w-2xl">
              "{testimonials[currentTestimonial].quote}"
            </blockquote>
            <div>
              <div className="text-lg font-semibold text-white">
                {testimonials[currentTestimonial].author}
              </div>
              <div className="text-slate-400">
                {testimonials[currentTestimonial].role}
              </div>
            </div>
          </div>

          {/* Navigation Arrows */}
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

          {/* Dots Indicator */}
          <div className="flex items-center justify-center gap-2 mt-8">
            {testimonials.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentTestimonial(idx)}
                className={`w-2 h-2 rounded-full transition-all ${
                  idx === currentTestimonial 
                    ? 'w-8 bg-purple-500' 
                    : 'bg-slate-600 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Final CTA */}
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
          Ready to ship without burning out?
        </h2>
        <p className="text-xl text-slate-400 mb-8">
          Join 500+ makers who've stopped the burnout cycle
        </p>
        <button
          onClick={() => navigate('/create-account')}
          className="bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 
                   text-white px-10 py-5 rounded-xl font-bold text-xl transition-all shadow-lg shadow-purple-500/30 
                   hover:shadow-purple-500/50 hover:scale-105"
        >
          Get Started Free
        </button>
      </div>

    </div>
  );
}
