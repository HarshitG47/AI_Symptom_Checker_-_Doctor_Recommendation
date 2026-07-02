import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, Send, AlertCircle, ChevronDown,
  User, Clock, Activity, Pill
} from 'lucide-react';
import assessmentService from '../../services/assessmentService';

const DURATION_OPTIONS = [
  'Less than 1 day',
  '1-3 days',
  '4-7 days',
  '1-2 weeks',
  '2-4 weeks',
  'More than 1 month',
];

const SymptomForm = ({ onAssessmentCreated }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    symptoms: '',
    age: '',
    gender: '',
    duration: '',
    existingConditions: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.symptoms.trim()) return setError('Please describe your symptoms');
    if (!form.age || isNaN(form.age) || form.age < 1 || form.age > 120) return setError('Please enter a valid age (1–120)');
    if (!form.gender) return setError('Please select your gender');
    if (!form.duration) return setError('Please select symptom duration');

    setLoading(true);
    try {
      const assessment = await assessmentService.createAssessment({
        ...form,
        age: parseInt(form.age, 10),
      });
      if (onAssessmentCreated) onAssessmentCreated(assessment);
      navigate(`/assessment/${assessment._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze symptoms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputIcon = (Icon) => (
    <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted dark:text-slate-400 pointer-events-none" />
  );

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary-light dark:bg-primary/20 flex items-center justify-center">
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-text-primary dark:text-slate-100">AI Symptom Checker</h2>
          <p className="text-xs text-text-muted dark:text-slate-400">Describe your symptoms and get an instant AI-powered health assessment</p>
        </div>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Symptoms */}
        <div>
          <label className="label-text flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-primary" />
            Symptoms <span className="text-red-500">*</span>
          </label>
          <textarea
            id="symptoms"
            name="symptoms"
            value={form.symptoms}
            onChange={handleChange}
            placeholder="Describe your symptoms in detail... (e.g., severe headache on the right side, nausea, sensitivity to light for the past 2 days)"
            rows={4}
            className="input-field resize-none leading-relaxed"
          />
          <p className="text-xs text-text-muted dark:text-slate-500 mt-1">Be as specific as possible for more accurate results</p>
        </div>

        {/* Age + Gender Row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label-text flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" />
              Age <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              {inputIcon(User)}
              <input
                id="age"
                type="number"
                name="age"
                value={form.age}
                onChange={handleChange}
                placeholder="e.g. 32"
                min="1"
                max="120"
                className="input-field pl-10"
              />
            </div>
          </div>
          <div>
            <label className="label-text">
              Gender <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <select
                id="gender"
                name="gender"
                value={form.gender}
                onChange={handleChange}
                className="input-field appearance-none pr-8 cursor-pointer"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted dark:text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="label-text flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" />
            Duration of Symptoms <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <select
              id="duration"
              name="duration"
              value={form.duration}
              onChange={handleChange}
              className="input-field appearance-none pr-8 cursor-pointer"
            >
              <option value="">How long have you had these symptoms?</option>
              {DURATION_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted dark:text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* Existing Conditions */}
        <div>
          <label className="label-text flex items-center gap-1.5">
            <Pill className="w-3.5 h-3.5 text-primary" />
            Existing Medical Conditions
            <span className="ml-1 text-xs font-normal text-text-muted dark:text-slate-500">(optional)</span>
          </label>
          <input
            id="existingConditions"
            type="text"
            name="existingConditions"
            value={form.existingConditions}
            onChange={handleChange}
            placeholder="e.g. Diabetes, Hypertension, Asthma..."
            className="input-field"
          />
        </div>

        {/* Disclaimer */}
        <div className="p-3.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            ⚕️ <strong>Medical Disclaimer:</strong> This AI assessment is for informational purposes only and does not constitute medical advice or diagnosis. Please consult a qualified healthcare professional.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          id="symptom-check-submit"
          className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:scale-100"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing symptoms...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Get AI Assessment</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default SymptomForm;
