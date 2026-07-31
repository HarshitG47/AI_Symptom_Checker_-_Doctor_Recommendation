import React, { useState, useEffect } from 'react';
import { 
  Activity, Calendar, Heart, ClipboardCheck, LayoutDashboard, 
  Brain, FileText, CheckCircle, Bell, ChevronRight, AlertCircle, Plus, Trash2, ArrowUpRight
} from 'lucide-react';
import WelcomeCard from '../components/dashboard/WelcomeCard';
import SymptomForm from '../components/dashboard/SymptomForm';
import assessmentService from '../services/assessmentService';

const DashboardPage = () => {
  const [activeTab, setActiveTab] = useState('checker'); // 'checker' | 'timeline' | 'analytics' | 'reminders'
  const [timeline, setTimeline] = useState([]);
  const [trends, setTrends] = useState({ blood_sugar: [], hemoglobin: [], vitamin_d: [], cholesterol: [] });
  const [summary, setSummary] = useState(null);
  const [reminders, setReminders] = useState([]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Custom reminder form state
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [reminderForm, setReminderForm] = useState({ title: '', type: 'checkup', dueDate: '' });
  const [reminderSubmitting, setReminderSubmitting] = useState(false);

  // Fetch active tab data
  useEffect(() => {
    fetchTabData();
  }, [activeTab]);

  const fetchTabData = async () => {
    setLoading(true);
    setError('');
    try {
      if (activeTab === 'timeline') {
        const data = await assessmentService.getTimeline();
        setTimeline(data);
      } else if (activeTab === 'analytics') {
        const tr = await assessmentService.getTrends();
        const sm = await assessmentService.getSummary();
        setTrends(tr);
        setSummary(sm);
      } else if (activeTab === 'reminders') {
        const data = await assessmentService.getReminders();
        setReminders(data);
      }
    } catch (err) {
      console.error('[Dashboard] Error fetching tab data:', err);
      setError('Failed to load records. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReminder = async (id) => {
    try {
      await assessmentService.toggleReminder(id);
      // Refresh list
      const data = await assessmentService.getReminders();
      setReminders(data);
    } catch (err) {
      console.error('[Reminders] Failed to toggle status:', err);
    }
  };

  const handleDeleteReminder = async (id) => {
    try {
      await assessmentService.deleteReminder(id);
      // Refresh list
      const data = await assessmentService.getReminders();
      setReminders(data);
    } catch (err) {
      console.error('[Reminders] Failed to delete reminder:', err);
    }
  };

  const handleCreateReminder = async (e) => {
    e.preventDefault();
    if (!reminderForm.title || !reminderForm.dueDate) return;
    setReminderSubmitting(true);
    try {
      await assessmentService.createReminder(reminderForm);
      setReminderForm({ title: '', type: 'checkup', dueDate: '' });
      setShowAddReminder(false);
      // Refresh list
      const data = await assessmentService.getReminders();
      setReminders(data);
    } catch (err) {
      console.error('[Reminders] Failed to create reminder:', err);
    } finally {
      setReminderSubmitting(false);
    }
  };

  // Helper to render premium custom SVG line charts for vitals tracking
  const renderSVGChart = (dataPoints, label, color) => {
    if (!dataPoints || dataPoints.length === 0) {
      return (
        <div className="h-44 flex items-center justify-center border border-dashed border-border-light dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/40">
          <p className="text-xs text-text-muted dark:text-slate-500">No report metrics parsed for {label} yet. Upload lab files in consultation to track.</p>
        </div>
      );
    }

    const padding = 20;
    const width = 450;
    const height = 180;
    
    // Sort chronologically
    const sorted = [...dataPoints].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    const xRange = width - padding * 2;
    const yRange = height - padding * 2;
    
    const values = sorted.map(d => d.value);
    const minVal = Math.min(...values) * 0.9;
    const maxVal = Math.max(...values) * 1.1;
    const valRange = maxVal - minVal || 1;

    // Map points to SVG coordinates
    const points = sorted.map((d, index) => {
      const x = padding + (index / (sorted.length - 1 || 1)) * xRange;
      const y = height - padding - ((d.value - minVal) / valRange) * yRange;
      return { x, y, val: d.value, date: new Date(d.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) };
    });

    let pathD = '';
    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(' ');
    }

    return (
      <div className="p-4 bg-white/70 dark:bg-slate-900/50 rounded-2xl border border-border-light dark:border-slate-800/80 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold text-text-secondary dark:text-slate-300 uppercase tracking-wide">{label}</span>
          <span className="text-xs font-bold text-primary">{sorted[sorted.length - 1].value} {sorted[sorted.length - 1].unit}</span>
        </div>
        <div className="relative">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
            {/* Grid Lines */}
            <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(148, 163, 184, 0.1)" strokeDasharray="3" />
            <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(148, 163, 184, 0.1)" strokeDasharray="3" />
            <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(148, 163, 184, 0.15)" />

            {/* Connecting Path */}
            {points.length > 1 && (
              <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Nodes */}
            {points.map((p, idx) => (
              <g key={idx} className="group cursor-pointer">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="4"
                  fill={color}
                  className="transition-all duration-200 hover:r-6"
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="8"
                  fill="none"
                  stroke={color}
                  strokeWidth="1.5"
                  className="opacity-0 group-hover:opacity-30 transition-all duration-200"
                />
                {/* Tooltip text */}
                <text
                  x={p.x}
                  y={p.y - 10}
                  textAnchor="middle"
                  className="text-[9px] font-bold fill-text-primary dark:fill-slate-100 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 duration-200"
                >
                  {p.val}
                </text>
                <text
                  x={p.x}
                  y={height - 5}
                  textAnchor="middle"
                  className="text-[8px] fill-text-muted dark:fill-slate-500"
                >
                  {p.date}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
      {/* Header welcome card */}
      <div className="mb-8">
        <WelcomeCard />
      </div>

      {/* Tabs Row matching dooper crimson aesthetics */}
      <div className="flex flex-wrap gap-2.5 mb-8 border-b border-border-light dark:border-slate-800 pb-4">
        {[
          { id: 'checker', label: 'Triage Checker', icon: Brain },
          { id: 'timeline', label: 'Health Timeline', icon: Calendar },
          { id: 'analytics', label: 'Analytics & Vitals', icon: Activity },
          { id: 'reminders', label: 'Care Reminders', icon: Bell },
        ].map(tab => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isSelected
                  ? 'bg-primary text-white shadow-lg shadow-primary/20 scale-105'
                  : 'bg-white dark:bg-slate-900 border border-border-light dark:border-slate-800 hover:border-primary/20 text-text-secondary dark:text-slate-350 hover:bg-surface dark:hover:bg-slate-800/40'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Error Callout */}
      {error && (
        <div className="mb-6 flex items-center gap-2.5 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Tab Contents */}
      <div>
        {activeTab === 'checker' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3" id="symptom-form">
              <SymptomForm />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <div className="card">
                <h3 className="text-sm font-bold text-text-secondary dark:text-slate-300 uppercase tracking-wider mb-4">Board Guidance</h3>
                <div className="space-y-4">
                  {[
                    { step: '1', title: 'Fill Symptom Context', desc: 'Detail primary indicators, secondary details, and configure height/weight vitals.' },
                    { step: '2', title: 'Consult Triage agents', desc: 'Interact for up to 5 turns. The coordinator routes findings to differential boards.' },
                    { step: '3', title: 'Evidence-Based Report', desc: 'Get differential scores, personalized Care Plans, and safety interacts instantly.' },
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
                    <h3 className="text-sm font-bold text-text-primary dark:text-slate-100 mb-1">Clinical Safety Warning</h3>
                    <p className="text-xs text-text-secondary dark:text-slate-300 leading-relaxed">
                      All assessment recommendations are AI-generated and backed by clinical RAG literature. They do NOT constitute formal diagnostic evaluations. Check with a physician.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'timeline' && (
          <div className="card max-w-4xl mx-auto">
            <h3 className="text-base font-bold text-text-primary dark:text-slate-100 mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary"/> Persistent Digital Health Timeline
            </h3>
            {loading ? (
              <div className="py-20 flex justify-center"><span className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
            ) : timeline.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-10">No consultations, report uploads, or vitals recorded. Submit the Triage checker to build your health log.</p>
            ) : (
              <div className="relative border-l border-border-light dark:border-slate-800 ml-4 space-y-8 py-2">
                {timeline.map((item, idx) => (
                  <div key={item.id} className="relative pl-7 group">
                    {/* Ring indicator */}
                    <div className="absolute -left-2.5 top-1 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900 bg-primary flex items-center justify-center shadow-sm">
                      <div className="w-1.5 h-1.5 rounded-full bg-white" />
                    </div>
                    <div>
                      <span className="text-[10px] text-text-muted dark:text-slate-400 font-semibold uppercase tracking-wide">
                        {new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                      <h4 className="text-sm font-bold text-text-primary dark:text-slate-100 mt-0.5">{item.title}</h4>
                      <p className="text-xs text-text-secondary dark:text-slate-300 mt-1 leading-relaxed">{item.details}</p>
                      {item.secondaryDetails && (
                        <p className="text-[11px] text-text-muted mt-0.5 italic">{item.secondaryDetails}</p>
                      )}
                      {item.severity && (
                        <span className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full border mt-2 ${
                          item.severity === 'Severe' 
                            ? 'bg-red-50 dark:bg-red-950/20 text-red-500 border-red-100' 
                            : item.severity === 'Moderate'
                            ? 'bg-yellow-50 dark:bg-yellow-950/20 text-yellow-500 border-yellow-100'
                            : 'bg-green-50 dark:bg-green-950/20 text-green-500 border-green-100'
                        }`}>
                          Severity: {item.severity}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-8">
            {loading ? (
              <div className="card py-20 flex justify-center"><span className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
            ) : (
              <>
                {/* High-level stats panel */}
                {summary && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="card flex items-center gap-4 bg-gradient-to-br from-primary/5 to-transparent border-primary/10">
                      <div className="w-12 h-12 rounded-2xl bg-primary-light dark:bg-primary/20 flex items-center justify-center shrink-0">
                        <Heart className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-text-muted dark:text-slate-400 font-semibold uppercase tracking-wider">Health Score</p>
                        <p className="text-2xl font-bold text-text-primary dark:text-slate-100 mt-0.5">{summary.healthImprovementScore}/100</p>
                      </div>
                    </div>

                    <div className="card flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
                        <ClipboardCheck className="w-6 h-6 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs text-text-muted dark:text-slate-400 font-semibold uppercase tracking-wider">Triage Consults</p>
                        <p className="text-2xl font-bold text-text-primary dark:text-slate-100 mt-0.5">{summary.consultationsCount} done</p>
                      </div>
                    </div>

                    <div className="card flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center shrink-0">
                        <Bell className="w-6 h-6 text-green-500" />
                      </div>
                      <div>
                        <p className="text-xs text-text-muted dark:text-slate-400 font-semibold uppercase tracking-wider">Tasks Ratio</p>
                        <p className="text-2xl font-bold text-text-primary dark:text-slate-100 mt-0.5">
                          {summary.remindersRatio?.completed} / {summary.remindersRatio?.completed + summary.remindersRatio?.pending}
                        </p>
                      </div>
                    </div>

                    <div className="card">
                      <p className="text-xs text-text-muted dark:text-slate-400 font-semibold uppercase tracking-wider mb-2">Chronic disease flags</p>
                      <div className="flex flex-wrap gap-1.5">
                        {Object.entries(summary.riskIndicators || {}).map(([risk, flagged]) => (
                          <span 
                            key={risk} 
                            className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                              flagged 
                                ? 'bg-red-50 dark:bg-red-950/20 text-red-500 border-red-100' 
                                : 'bg-slate-50 dark:bg-slate-800 text-text-muted border-border'
                            }`}
                          >
                            {risk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Longitudinal Biomarker Trend Charts */}
                <div className="card">
                  <h3 className="text-base font-bold text-text-primary dark:text-slate-100 mb-6 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary"/> Longitudinal Biomarker Trend Analysis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderSVGChart(trends.blood_sugar, 'Blood Glucose Vitals (mg/dL)', '#E40443')}
                    {renderSVGChart(trends.hemoglobin, 'Hemoglobin Levels (g/dL)', '#0ea5e9')}
                    {renderSVGChart(trends.vitamin_d, 'Vitamin D Status (ng/mL)', '#eab308')}
                    {renderSVGChart(trends.cholesterol, 'Total Cholesterol (mg/dL)', '#22c55e')}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {activeTab === 'reminders' && (
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Header + Add Button */}
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-base font-bold text-text-primary dark:text-slate-100 flex items-center gap-2">
                <Bell className="w-5 h-5 text-primary"/> Smart Care & Medication Reminders
              </h3>
              <button 
                onClick={() => setShowAddReminder(!showAddReminder)}
                className="btn-primary py-2 px-4 text-xs font-bold flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add Care Reminder
              </button>
            </div>

            {/* Custom Reminder Form */}
            {showAddReminder && (
              <form onSubmit={handleCreateReminder} className="card p-5 border-primary/20 bg-slate-50/50 dark:bg-slate-900/40 animate-fade-in space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-primary">New Action Schedule</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="label-text">Task / Action Title</label>
                    <input 
                      type="text" 
                      value={reminderForm.title}
                      onChange={e => setReminderForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Take Metformin, Check-up"
                      className="input-field py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="label-text">Reminder Type</label>
                    <select
                      value={reminderForm.type}
                      onChange={e => setReminderForm(f => ({ ...f, type: e.target.value }))}
                      className="input-field py-2"
                    >
                      <option value="medication">Medication Schedule</option>
                      <option value="consultation">Doctor Appointment</option>
                      <option value="lab">Lab Test Check</option>
                      <option value="checkup">General Checkup</option>
                    </select>
                  </div>
                  <div>
                    <label className="label-text">Due Date & Time</label>
                    <input 
                      type="datetime-local" 
                      value={reminderForm.dueDate}
                      onChange={e => setReminderForm(f => ({ ...f, dueDate: e.target.value }))}
                      className="input-field py-2"
                      required
                    />
                  </div>
                </div>
                <div className="flex gap-2.5 justify-end">
                  <button 
                    type="button" 
                    onClick={() => setShowAddReminder(false)}
                    className="btn-outline py-2 px-4 text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={reminderSubmitting}
                    className="btn-primary py-2 px-4 text-xs font-bold"
                  >
                    {reminderSubmitting ? 'Scheduling...' : 'Schedule Reminder'}
                  </button>
                </div>
              </form>
            )}

            {/* List */}
            {loading ? (
              <div className="card py-20 flex justify-center"><span className="w-8 h-8 border-3 border-primary/30 border-t-primary rounded-full animate-spin" /></div>
            ) : reminders.length === 0 ? (
              <p className="text-sm text-text-muted text-center py-10 card">No upcoming reminders or medication plans scheduled yet. Complete an assessment or add manual schedules above.</p>
            ) : (
              <div className="space-y-3">
                {reminders.map(item => {
                  const isCompleted = item.status === 'completed';
                  return (
                    <div 
                      key={item._id} 
                      className={`card p-4 flex items-center justify-between gap-4 border transition-all ${
                        isCompleted 
                          ? 'opacity-60 bg-slate-50/50 dark:bg-slate-900/10 border-border-light/50 dark:border-slate-800' 
                          : 'border-border hover:border-primary/20'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <button 
                          onClick={() => handleToggleReminder(item._id)}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                            isCompleted 
                              ? 'bg-primary border-primary text-white' 
                              : 'bg-white dark:bg-slate-800 border-border hover:border-primary'
                          }`}
                        >
                          {isCompleted && <CheckCircle className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                        <div>
                          <p className={`text-sm font-semibold text-text-primary dark:text-slate-100 ${isCompleted ? 'line-through text-text-muted' : ''}`}>{item.title}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded bg-primary/10 text-primary">
                              {item.type}
                            </span>
                            <span className="text-[10px] text-text-muted dark:text-slate-400">
                              Due: {new Date(item.dueDate).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDeleteReminder(item._id)}
                        className="p-2 text-text-muted hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-colors"
                        title="Delete Schedule"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
