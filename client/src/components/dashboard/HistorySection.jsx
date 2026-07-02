import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, Filter, ClipboardList, ChevronRight, 
  Trash2, AlertCircle, Calendar, Activity,
  Stethoscope, SlidersHorizontal, X
} from 'lucide-react';
import assessmentService from '../../services/assessmentService';
import Loader from '../common/Loader';

const SEVERITY_CONFIG = {
  Mild: { color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', dot: 'bg-green-500' },
  Moderate: { color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', dot: 'bg-yellow-500' },
  Severe: { color: 'text-red-600 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', dot: 'bg-red-500' },
};

const SeverityBadge = ({ level }) => {
  const cfg = SEVERITY_CONFIG[level] || SEVERITY_CONFIG.Mild;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
      {level}
    </span>
  );
};

const HistorySection = () => {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({ search: '', severity: '', dateFilter: '' });
  const [showFilters, setShowFilters] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await assessmentService.getAssessments(filters);
      setAssessments(data);
    } catch (err) {
      setError('Failed to load assessment history');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAssessments();
  }, [fetchAssessments]);

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!window.confirm('Delete this assessment?')) return;
    setDeletingId(id);
    try {
      await assessmentService.deleteAssessment(id);
      setAssessments(prev => prev.filter(a => a._id !== id));
    } catch {
      setError('Failed to delete assessment');
    } finally {
      setDeletingId(null);
    }
  };

  const clearFilters = () => {
    setFilters({ search: '', severity: '', dateFilter: '' });
  };

  const hasFilters = filters.search || filters.severity || filters.dateFilter;

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="card" id="history-section">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
            <ClipboardList className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary dark:text-slate-100">Assessment History</h2>
            <p className="text-xs text-text-muted dark:text-slate-400">{assessments.length} record{assessments.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${showFilters ? 'bg-primary-light text-primary dark:bg-primary/20' : 'text-text-secondary dark:text-slate-300 hover:bg-surface dark:hover:bg-slate-800'}`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {hasFilters && <span className="w-2 h-2 rounded-full bg-primary" />}
        </button>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="mb-5 p-4 bg-surface dark:bg-slate-800/50 rounded-xl border border-border-light dark:border-slate-700 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted dark:text-slate-400" />
            <input
              type="text"
              placeholder="Search by symptoms or condition..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
              className="input-field pl-10 text-sm"
              id="history-search"
            />
          </div>

          <div className="flex gap-3 flex-wrap">
            {/* Severity Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-text-muted dark:text-slate-400 flex-shrink-0" />
              <select
                value={filters.severity}
                onChange={e => setFilters(f => ({ ...f, severity: e.target.value }))}
                className="input-field text-sm py-2 w-auto"
                id="severity-filter"
              >
                <option value="">All Severities</option>
                <option value="Mild">Mild</option>
                <option value="Moderate">Moderate</option>
                <option value="Severe">Severe</option>
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-text-muted dark:text-slate-400 flex-shrink-0" />
              <select
                value={filters.dateFilter}
                onChange={e => setFilters(f => ({ ...f, dateFilter: e.target.value }))}
                className="input-field text-sm py-2 w-auto"
                id="date-filter"
              >
                <option value="">All Time</option>
                <option value="today">Today</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
              </select>
            </div>

            {hasFilters && (
              <button onClick={clearFilters} className="flex items-center gap-1.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                <X className="w-3.5 h-3.5" />
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <Loader text="Loading assessments..." />
      ) : error ? (
        <div className="flex items-center gap-2.5 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      ) : assessments.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-surface-card dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <ClipboardList className="w-8 h-8 text-text-muted dark:text-slate-500" />
          </div>
          <h3 className="text-base font-semibold text-text-primary dark:text-slate-100 mb-1">
            {hasFilters ? 'No matches found' : 'No assessments yet'}
          </h3>
          <p className="text-sm text-text-muted dark:text-slate-400">
            {hasFilters ? 'Try adjusting your filters' : 'Submit your first symptom check above to get started'}
          </p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-3 text-sm text-primary font-medium hover:underline">
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {assessments.map(assessment => (
            <Link
              key={assessment._id}
              to={`/assessment/${assessment._id}`}
              className="group flex items-start gap-4 p-4 bg-surface dark:bg-slate-800/40 hover:bg-primary-light/30 dark:hover:bg-primary/5 rounded-xl border border-border-light dark:border-slate-700 hover:border-primary/30 transition-all duration-200"
            >
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 flex items-center justify-center border border-border-light dark:border-slate-700 flex-shrink-0 group-hover:border-primary/30 transition-colors">
                <Stethoscope className="w-5 h-5 text-primary" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="text-sm font-semibold text-text-primary dark:text-slate-100 truncate group-hover:text-primary transition-colors">
                    {assessment.aiAnalysis?.possibleCondition || 'Assessment'}
                  </h3>
                  <SeverityBadge level={assessment.aiAnalysis?.severityLevel} />
                </div>
                <p className="text-xs text-text-muted dark:text-slate-400 line-clamp-1 mb-2">
                  {assessment.symptoms}
                </p>
                <div className="flex items-center gap-3 text-xs text-text-light dark:text-slate-500">
                  <span className="flex items-center gap-1">
                    <Activity className="w-3 h-3" />
                    {assessment.aiAnalysis?.recommendedSpecialty}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(assessment.createdAt)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-center flex-shrink-0">
                <button
                  onClick={(e) => handleDelete(assessment._id, e)}
                  disabled={deletingId === assessment._id}
                  className="opacity-0 group-hover:opacity-100 p-1.5 text-text-muted dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                  title="Delete assessment"
                >
                  {deletingId === assessment._id
                    ? <span className="w-3.5 h-3.5 border border-current border-t-transparent rounded-full animate-spin block" />
                    : <Trash2 className="w-3.5 h-3.5" />
                  }
                </button>
                <ChevronRight className="w-4 h-4 text-text-muted dark:text-slate-500 group-hover:text-primary transition-colors" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default HistorySection;
