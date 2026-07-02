import React from 'react';
import { ClipboardList, Activity, Shield, ArrowRight, Sparkles } from 'lucide-react';
import dooperLogo from '/dooperlogo.png';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const features = [
  { icon: Activity,      text: 'AI-powered symptom analysis',       color: 'text-blue-500' },
  { icon: Shield,        text: 'Medical specialty recommendations',  color: 'text-primary' },
  { icon: ClipboardList, text: 'Full assessment history',            color: 'text-purple-500' },
  { icon: Shield,        text: 'Safe & private health insights',     color: 'text-green-500' },
];

const WelcomeCard = () => {
  const { user } = useAuth();
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.fullName?.split(' ')[0] || 'there';

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-rose-700 dark:from-slate-800 dark:to-slate-900 p-6 md:p-8 shadow-lg shadow-primary/20 dark:shadow-none border border-transparent dark:border-slate-700 text-white dark:text-slate-100">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-white/5 -translate-y-1/2 translate-x-1/4 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 rounded-full bg-white/5 translate-y-1/2 -translate-x-1/4 pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-white/70 dark:text-primary" />
              <span className="text-sm font-medium text-white/80 dark:text-slate-300">{greeting}</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-white dark:text-slate-100">Hello, {firstName}! 👋</h2>
            <p className="text-white/70 dark:text-slate-400 text-sm mt-1.5 max-w-sm">
              Your AI health assistant is ready. Describe your symptoms and get an instant assessment.
            </p>
          </div>
          <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-white/15 dark:bg-slate-700 backdrop-blur-sm items-center justify-center flex-shrink-0 p-2">
            <img src={dooperLogo} alt="Dooper" className="w-full h-full object-contain" />
          </div>
        </div>

        {/* Feature pills */}
        <div className="grid grid-cols-2 gap-2.5 mb-6">
          {features.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-2 bg-white/10 dark:bg-slate-700/50 backdrop-blur-sm rounded-lg px-3 py-2">
              <div className="w-6 h-6 rounded-md bg-white/20 dark:bg-slate-600 flex items-center justify-center flex-shrink-0">
                <Icon className="w-3.5 h-3.5 text-white dark:text-slate-200" />
              </div>
              <span className="text-xs font-medium text-white/90 dark:text-slate-300 leading-tight">{text}</span>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <a
            href="#symptom-form"
            className="inline-flex items-center gap-2 bg-white dark:bg-primary text-primary dark:text-white font-semibold text-sm px-5 py-2.5 rounded-lg hover:bg-white/90 dark:hover:bg-primary-hover transition-all duration-200 hover:shadow-md"
          >
            Start Assessment
            <ArrowRight className="w-4 h-4" />
          </a>
          <Link
            to="/history"
            className="inline-flex items-center gap-2 bg-white/15 dark:bg-slate-700 hover:bg-white/25 dark:hover:bg-slate-600 text-white dark:text-slate-200 font-semibold text-sm px-5 py-2.5 rounded-lg transition-all duration-200"
          >
            <ClipboardList className="w-4 h-4" />
            View History
          </Link>
        </div>
      </div>
    </div>
  );
};

export default WelcomeCard;
