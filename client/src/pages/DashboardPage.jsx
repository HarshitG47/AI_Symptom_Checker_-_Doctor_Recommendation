import React from 'react';
import WelcomeCard from '../components/dashboard/WelcomeCard';
import SymptomForm from '../components/dashboard/SymptomForm';
import HistorySection from '../components/dashboard/HistorySection';

const DashboardPage = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
      {/* Welcome */}
      <div className="mb-8">
        <WelcomeCard />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Symptom Checker - wider left column */}
        <div className="lg:col-span-3" id="symptom-form">
          <SymptomForm />
        </div>

        {/* Stats card sidebar */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card">
            <h3 className="text-sm font-bold text-text-secondary dark:text-slate-300 uppercase tracking-wider mb-4">How it works</h3>
            <div className="space-y-4">
              {[
                { step: '1', title: 'Describe Symptoms', desc: 'Enter your symptoms, age, gender, and duration for accurate results.' },
                { step: '2', title: 'AI Analysis', desc: 'Our AI analyzes your input against medical databases to identify possible conditions.' },
                { step: '3', title: 'Get Recommendations', desc: 'Receive severity level, medical specialty, and self-care advice instantly.' },
              ].map(item => (
                <div key={item.step} className="flex gap-3">
                  <div className="w-7 h-7 rounded-full bg-primary text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {item.step}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-text-primary dark:text-slate-100">{item.title}</p>
                    <p className="text-xs text-text-muted dark:text-slate-400 mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 border-primary/20">
            <div className="flex items-start gap-3">
              <div className="text-2xl">⚕️</div>
              <div>
                <h3 className="text-sm font-bold text-text-primary dark:text-slate-100 mb-1">Medical Disclaimer</h3>
                <p className="text-xs text-text-secondary dark:text-slate-300 leading-relaxed">
                  This tool provides AI-generated health insights only. Results are NOT a medical diagnosis. Always consult a qualified healthcare professional for proper diagnosis and treatment.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History - full width below */}
      <div className="mt-8">
        <HistorySection />
      </div>
    </div>
  );
};

export default DashboardPage;
