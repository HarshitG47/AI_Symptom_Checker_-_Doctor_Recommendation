import React from 'react';
import { Link } from 'react-router-dom';
import {
  Brain, ClipboardList, Shield, ArrowRight,
  Activity, Zap, CheckCircle2
} from 'lucide-react';
import dooperLogo from '/dooperlogo.png';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Analysis',
    desc: 'Advanced language models analyze your symptoms against comprehensive medical knowledge bases.',
    color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
  },
  {
    icon: Shield,
    title: 'Specialty Finder',
    desc: 'Get directed to the right medical specialist based on your symptoms — no guesswork required.',
    color: 'text-primary bg-primary-light dark:bg-primary/10',
  },
  {
    icon: ClipboardList,
    title: 'Assessment History',
    desc: 'Every check is saved so you can track your health over time and share with your doctor.',
    color: 'text-purple-500 bg-purple-50 dark:bg-purple-900/20',
  },
  {
    icon: Shield,
    title: 'Private & Secure',
    desc: 'Your health data is protected with industry-standard authentication and encryption.',
    color: 'text-orange-500 bg-orange-50 dark:bg-orange-900/20',
  },
  {
    icon: Zap,
    title: 'Instant Results',
    desc: 'Receive your AI health assessment in seconds, anytime and anywhere.',
    color: 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20',
  },
];

const steps = [
  { step: '01', title: 'Create Account', desc: 'Quick and secure registration to access all features.' },
  { step: '02', title: 'Enter Symptoms', desc: 'Describe your symptoms, age, gender, and medical history.' },
  { step: '03', title: 'AI Assessment', desc: 'Our AI analyzes your input and generates a detailed report.' },
  { step: '04', title: 'Get Recommendations', desc: 'Receive specialist suggestions and tailored self-care advice.' },
];

const HomePage = () => {
  return (
    <div className="pt-16">
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-primary-light dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-20 md:py-32">
        {/* Decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-primary/5 dark:bg-primary/10" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-primary/5 dark:bg-primary/10" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Logo Hero */}
          <div className="flex justify-center mb-8">
            <img src={dooperLogo} alt="Dooper" className="h-16 md:h-20 w-auto object-contain" />
          </div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary-light dark:bg-primary/15 text-primary rounded-full text-sm font-semibold mb-8 border border-primary/20">
            <Activity className="w-4 h-4" />
            AI-Powered Healthcare
          </div>

          <h1 className="text-4xl md:text-6xl font-bold text-text-primary dark:text-slate-100 mb-6 leading-tight">
            Check Your Symptoms<br />
            <span className="text-primary">Intelligently</span>
          </h1>

          <p className="text-lg md:text-xl text-text-secondary dark:text-slate-300 max-w-2xl mx-auto mb-10 leading-relaxed">
            Get an instant AI-powered health assessment, understand your symptoms, and be directed to the right medical specialist — all from the comfort of home.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register" id="hero-cta" className="btn-primary text-base px-8 py-3.5 flex items-center gap-2 shadow-lg shadow-primary/25">
              Start Free Assessment
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="btn-outline text-base px-8 py-3.5">
              Sign In
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-text-muted dark:text-slate-400">
            {['Secure & Private', 'Data Encrypted & Secured', 'AI-Powered Insights'].map(t => (
              <span key={t} className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-white dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary dark:text-slate-100 mb-4">
              Everything You Need for Smarter Health Decisions
            </h2>
            <p className="text-text-secondary dark:text-slate-300 text-lg max-w-xl mx-auto">
              Powered by advanced AI to help you understand your health better.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="card group cursor-default">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color} transition-transform duration-300 group-hover:scale-110`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-text-primary dark:text-slate-100 mb-2">{title}</h3>
                <p className="text-sm text-text-secondary dark:text-slate-300 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-surface dark:bg-slate-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary dark:text-slate-100 mb-4">
              How It Works
            </h2>
            <p className="text-text-secondary dark:text-slate-300 text-lg">Get your assessment in four simple steps</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map(({ step, title, desc }, i) => (
              <div key={step} className="relative text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary text-white font-bold text-xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/25">
                  {step}
                </div>
                <h3 className="text-base font-bold text-text-primary dark:text-slate-100 mb-2">{title}</h3>
                <p className="text-sm text-text-secondary dark:text-slate-300 leading-relaxed">{desc}</p>
                {i < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-7 left-[calc(50%+28px)] w-[calc(100%-56px)] border-t-2 border-dashed border-border dark:border-slate-700" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary-dark">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Take Control of Your Health?
          </h2>
          <p className="text-white/80 text-lg mb-8 max-w-xl mx-auto">
            Join thousands of users who trust Dooper AI for instant health assessments.
          </p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-primary font-bold text-base px-8 py-3.5 rounded-xl hover:bg-white/90 transition-all duration-200 hover:shadow-xl shadow-md">
            Get Started — It's Free
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="text-white/60 text-sm mt-4">
            No credit card required. AI-powered health insights in seconds.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-border-light dark:border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <img src={dooperLogo} alt="Dooper" className="h-8 w-auto object-contain" />
              <span className="text-sm text-text-muted dark:text-slate-400">AI Health Assistant</span>
            </div>
            <p className="text-xs text-text-light dark:text-slate-500 text-center">
              AI-generated assessments are for informational purposes only and do not constitute medical advice.{' '}
              <span className="text-text-muted dark:text-slate-400">Always consult a qualified healthcare professional.</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
