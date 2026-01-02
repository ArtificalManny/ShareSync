// src/pages/Landing.jsx - Professional Landing Page
import React from 'react';
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
  Heart
} from 'lucide-react';

export default function Landing() {
  const navigate = useNavigate();

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
                  // Scroll to demo section or play video
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
                  {/* Placeholder for demo video/screenshot */}
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
                  
                  {/* Screenshot overlay (you can add actual screenshot here) */}
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

      {/* Quick Value Props */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
              <Brain className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">AI Burnout Detection</h3>
            <p className="text-slate-400 text-sm">
              Catches overwork patterns before you crash
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/20 flex items-center justify-center">
              <Zap className="w-6 h-6 text-fuchsia-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Momentum-Based System</h3>
            <p className="text-slate-400 text-sm">
              Streaks that motivate, not guilt-trip
            </p>
          </div>

          <div className="text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <Heart className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-white">Built for Wellbeing</h3>
            <p className="text-slate-400 text-sm">
              The only tool that cares about your mental health
            </p>
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
