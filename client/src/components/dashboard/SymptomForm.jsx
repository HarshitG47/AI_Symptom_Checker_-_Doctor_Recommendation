import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, Send, AlertCircle, ChevronDown,
  User, Clock, Activity, Pill, Heart, FileText, AlertTriangle
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

const PRIMARY_SYMPTOMS_LIST = [
  // General & Systemic
  'Fever', 'Headache', 'Fatigue', 'Dizziness', 'Muscle Pain', 'Back Pain', 'Joint Pain',
  // Respiratory & Cardiovascular
  'Cough', 'Shortness of Breath', 'Chest Pain', 'Palpitations',
  // Digestive / Gastrointestinal
  'Abdominal Pain', 'Vomiting', 'Nausea', 'Diarrhea', 'Difficulty Swallowing',
  // Ear, Nose, Throat (ENT)
  'Sore Throat', 'Ear Pain', 'Nasal Congestion',
  // Eye-Related
  'Blurry Vision', 'Eye Redness/Pain', 'Double Vision',
  // Neurological, Skin & Other
  'Numbness/Tingling', 'Confusion', 'Difficulty Speaking', 'Rash', 'Urinary Pain'
];

const SymptomForm = ({ onAssessmentCreated }) => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    age: '',
    gender: '',
    weight: '',
    height: '',
    existingConditions: '',
    currentMedications: '',
    allergies: '',
    pregnancyStatus: '',
    painLevel: 5,
    duration: '',
    primarySymptoms: [],
    secondarySymptoms: '', // Will just be a comma separated string for simplicity in UI, converted to array on submit or just sent as string if we allow it. Wait, the backend expects an array for secondary symptoms, let's keep it as a string input and split it.
    symptoms: '',
  });
  
  const [secondaryText, setSecondaryText] = useState('');

  const [reportFile, setReportFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handlePrimarySymptomToggle = (symptom) => {
    setForm(prev => {
      const isSelected = prev.primarySymptoms.includes(symptom);
      return {
        ...prev,
        primarySymptoms: isSelected 
          ? prev.primarySymptoms.filter(s => s !== symptom)
          : [...prev.primarySymptoms, symptom]
      };
    });
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.age || isNaN(form.age) || form.age < 1 || form.age > 120) return setError('Please enter a valid age (1–120)');
    if (!form.gender) return setError('Please select your gender');
    if (form.primarySymptoms.length === 0) return setError('Please select at least one primary symptom');
    if (!form.duration) return setError('Please select symptom duration');

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('age', parseInt(form.age, 10));
      formData.append('gender', form.gender);
      if (form.weight) formData.append('weight', parseFloat(form.weight));
      if (form.height) formData.append('height', parseFloat(form.height));
      formData.append('existingConditions', form.existingConditions);
      formData.append('currentMedications', form.currentMedications);
      formData.append('allergies', form.allergies);
      formData.append('pregnancyStatus', form.pregnancyStatus);
      formData.append('painLevel', form.painLevel);
      formData.append('duration', form.duration);
      formData.append('primarySymptoms', JSON.stringify(form.primarySymptoms));
      
      const parsedSecondary = secondaryText.split(',').map(s => s.trim()).filter(s => s);
      formData.append('secondarySymptoms', JSON.stringify(parsedSecondary));
      formData.append('symptoms', form.symptoms);

      if (reportFile) {
        formData.append('medicalReport', reportFile);
      }

      const assessment = await assessmentService.createAssessment(formData);
      if (onAssessmentCreated) onAssessmentCreated(assessment);
      
      if (assessment.status === 'completed') {
        navigate(`/assessment/${assessment._id}`);
      } else {
        navigate(`/consultation/${assessment._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to analyze symptoms. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary-light dark:bg-primary/20 flex items-center justify-center">
          <Brain className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-text-primary dark:text-slate-100">Intelligent Clinical Assessment</h2>
          <p className="text-xs text-text-muted dark:text-slate-400">Complete the clinical profile for an evidence-backed AI assessment</p>
        </div>
      </div>

      {error && (
        <div className="mb-5 flex items-start gap-2.5 p-3.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Patient Profile */}
        <div>
          <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2 border-b border-border-light dark:border-slate-700 pb-2">
            <User className="w-4 h-4" /> Patient Profile
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-text">Age <span className="text-red-500">*</span></label>
              <input type="number" name="age" value={form.age} onChange={handleChange} min="1" max="120" className="input-field" placeholder="e.g. 32" />
            </div>
            <div>
              <label className="label-text">Gender <span className="text-red-500">*</span></label>
              <select name="gender" value={form.gender} onChange={handleChange} className="input-field">
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <label className="label-text">Weight (kg)</label>
              <input type="number" name="weight" value={form.weight} onChange={handleChange} step="0.1" className="input-field" placeholder="e.g. 70" />
            </div>
            <div>
              <label className="label-text">Height (cm)</label>
              <input type="number" name="height" value={form.height} onChange={handleChange} className="input-field" placeholder="e.g. 175" />
            </div>
            {(form.gender === 'Female' || form.gender === 'Non-binary' || form.gender === 'Prefer not to say') && (
              <div className="md:col-span-2">
                <label className="label-text">Pregnancy Status</label>
                <select name="pregnancyStatus" value={form.pregnancyStatus} onChange={handleChange} className="input-field">
                  <option value="">Select status...</option>
                  <option value="Not Pregnant">Not Pregnant</option>
                  <option value="Pregnant - 1st Trimester">Pregnant - 1st Trimester</option>
                  <option value="Pregnant - 2nd Trimester">Pregnant - 2nd Trimester</option>
                  <option value="Pregnant - 3rd Trimester">Pregnant - 3rd Trimester</option>
                  <option value="Postpartum">Postpartum</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Medical History */}
        <div>
          <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2 border-b border-border-light dark:border-slate-700 pb-2">
            <Heart className="w-4 h-4" /> Medical History
          </h3>
          <div className="space-y-4">
            <div>
              <label className="label-text flex items-center gap-1.5">Existing Medical Conditions</label>
              <input type="text" name="existingConditions" value={form.existingConditions} onChange={handleChange} placeholder="e.g. Diabetes, Hypertension..." className="input-field" />
            </div>
            <div>
              <label className="label-text flex items-center gap-1.5">Current Medications</label>
              <input type="text" name="currentMedications" value={form.currentMedications} onChange={handleChange} placeholder="e.g. Metformin, Lisinopril..." className="input-field" />
            </div>
            <div>
              <label className="label-text flex items-center gap-1.5">Allergies</label>
              <input type="text" name="allergies" value={form.allergies} onChange={handleChange} placeholder="e.g. Penicillin, Peanuts..." className="input-field" />
            </div>
          </div>
        </div>

        {/* Section 3: Symptoms */}
        <div>
          <h3 className="text-sm font-semibold text-primary mb-4 flex items-center gap-2 border-b border-border-light dark:border-slate-700 pb-2">
            <Activity className="w-4 h-4" /> Clinical Symptoms
          </h3>
          <div className="space-y-5">
            
            <div>
              <label className="label-text mb-2 block">Primary Symptoms <span className="text-red-500">*</span></label>
              <div className="flex flex-wrap gap-2">
                {PRIMARY_SYMPTOMS_LIST.map(sym => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => handlePrimarySymptomToggle(sym)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-all ${
                      form.primarySymptoms.includes(sym)
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white dark:bg-slate-800 text-text-secondary dark:text-slate-300 border-border dark:border-slate-600 hover:border-primary'
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label-text">Secondary Symptoms (Comma separated)</label>
              <input type="text" value={secondaryText} onChange={(e) => setSecondaryText(e.target.value)} placeholder="e.g. Chills, loss of appetite, runny nose" className="input-field" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label-text">Duration <span className="text-red-500">*</span></label>
                <select name="duration" value={form.duration} onChange={handleChange} className="input-field">
                  <option value="">Select duration</option>
                  {DURATION_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="label-text">Pain Level (1-10): {form.painLevel}</label>
                <input 
                  type="range" 
                  name="painLevel" 
                  min="1" 
                  max="10" 
                  value={form.painLevel} 
                  onChange={handleChange} 
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 mt-3"
                />
                <div className="flex justify-between text-[10px] text-text-muted mt-1 px-1">
                  <span>Mild (1)</span>
                  <span>Severe (10)</span>
                </div>
              </div>
            </div>

            <div>
              <label className="label-text flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Additional Details
              </label>
              <textarea
                name="symptoms"
                value={form.symptoms}
                onChange={handleChange}
                placeholder="Describe any other details about how you are feeling..."
                rows={3}
                className="input-field resize-none"
              />
            </div>

            <div>
              <label className="label-text flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" /> Upload Medical Report / Prescription (Optional)
              </label>
              <div className="mt-1.5 flex items-center justify-center px-6 pt-5 pb-6 border-2 border-dashed border-border dark:border-slate-700 rounded-xl hover:border-primary transition-colors cursor-pointer relative bg-white dark:bg-slate-800">
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={(e) => setReportFile(e.target.files[0])}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="space-y-1 text-center pointer-events-none">
                  <FileText className="mx-auto h-8 w-8 text-text-muted" />
                  <div className="flex text-xs text-text-secondary dark:text-slate-300">
                    <span className="font-semibold text-primary">Upload a file</span>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-[10px] text-text-muted">PDF, TXT up to 5MB</p>
                  {reportFile && (
                    <p className="text-xs font-semibold text-emerald-500 mt-2">
                      Selected: {reportFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="p-3.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            ⚕️ <strong>Medical Disclaimer:</strong> This AI assessment uses medical knowledge bases but is for informational purposes only. It does not constitute a medical diagnosis.
          </p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-3.5 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Analyzing Clinical Data...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Generate AI Assessment</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default SymptomForm;
