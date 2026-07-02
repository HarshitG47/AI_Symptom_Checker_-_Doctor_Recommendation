import React from 'react';
import HistorySection from '../components/dashboard/HistorySection';
import { ClipboardList } from 'lucide-react';

const HistoryPage = () => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 pt-24">
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-primary dark:text-slate-100">Assessment History</h1>
            <p className="text-sm text-text-muted dark:text-slate-400">Review your previous symptom assessments</p>
          </div>
        </div>
      </div>
      <HistorySection />
    </div>
  );
};

export default HistoryPage;
