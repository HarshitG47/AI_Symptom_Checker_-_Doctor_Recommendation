import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Download, Stethoscope, Activity, AlertTriangle,
  User, Clock, Calendar, Pill, MessageSquare,
  AlertCircle, CheckCircle, Shield, Heart, FileText, FileSearch
} from 'lucide-react';
import assessmentService from '../services/assessmentService';
import ChatFollowUp from '../components/dashboard/ChatFollowUp';
import Loader from '../components/common/Loader';
import jsPDF from 'jspdf';

const SEVERITY_CONFIG = {
  Mild: {
    color: 'text-green-600 dark:text-green-400',
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    icon: CheckCircle,
    dot: 'bg-green-500',
  },
  Moderate: {
    color: 'text-yellow-600 dark:text-yellow-400',
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    icon: AlertTriangle,
    dot: 'bg-yellow-500',
  },
  Severe: {
    color: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    icon: AlertCircle,
    dot: 'bg-red-500',
  },
};

const AssessmentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const data = await assessmentService.getAssessmentById(id);
        setAssessment(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load assessment');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id]);

  const handleDownloadPDF = async () => {
    if (!assessment) return;
    setDownloading(true);

    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const margin = 20;
      const pageWidth = 210;
      const contentWidth = pageWidth - margin * 2;
      let y = 20;

      const addText = (text, x, yPos, size, style = 'normal', color = [30, 30, 30]) => {
        pdf.setFontSize(size);
        pdf.setFont('helvetica', style);
        pdf.setTextColor(...color);
        pdf.text(text, x, yPos);
      };

      const addWrappedText = (text, x, yPos, maxWidth, size = 10, style = 'normal', color = [80, 80, 80]) => {
        pdf.setFontSize(size);
        pdf.setFont('helvetica', style);
        pdf.setTextColor(...color);
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, yPos);
        return lines.length * (size * 0.4 + 1.5);
      };

      // Header Banner
      pdf.setFillColor(228, 4, 67); // primary red
      pdf.rect(0, 0, 210, 40, 'F');
      addText('dooper', margin, 16, 24, 'bold', [255, 255, 255]);
      addText('AI Clinical Intelligence', margin, 24, 10, 'normal', [255, 200, 200]);
      addText('Symptom Assessment Report', pageWidth - margin, 16, 13, 'bold', [255, 255, 255]);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(255, 200, 200);
      pdf.text(`Generated: ${new Date(assessment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - margin, 24, { align: 'right' });

      y = 55;

      // Patient Info Section
      pdf.setFillColor(245, 246, 247);
      pdf.roundedRect(margin, y - 6, contentWidth, 36, 3, 3, 'F');
      addText('Patient Information', margin + 5, y, 11, 'bold', [30, 30, 30]);
      y += 7;
      const patientDetails = [
        `Age: ${assessment.age} years  |  Gender: ${assessment.gender}  |  Weight: ${assessment.weight || 'N/A'} kg  |  Height: ${assessment.height || 'N/A'} cm`,
        `Duration of Symptoms: ${assessment.duration}  |  Pain Level: ${assessment.painLevel || 'N/A'}/10`,
        assessment.existingConditions ? `Existing Conditions: ${assessment.existingConditions}` : null,
      ].filter(Boolean);
      patientDetails.forEach(detail => {
        addText(detail, margin + 5, y, 9, 'normal', [75, 70, 92]);
        y += 6;
      });
      y += 10;

      // Symptoms
      addText('Reported Symptoms', margin, y, 12, 'bold', [30, 30, 30]);
      y += 6;
      let sympText = `Primary: ${assessment.primarySymptoms?.join(', ') || 'N/A'}\n`;
      if (assessment.secondarySymptoms?.length) sympText += `Secondary: ${assessment.secondarySymptoms.join(', ')}\n`;
      if (assessment.symptoms) sympText += `Notes: ${assessment.symptoms}`;
      const symptomsHeight = addWrappedText(sympText, margin, y, contentWidth, 10, 'normal', [75, 70, 92]);
      y += symptomsHeight + 10;

      // Divider
      pdf.setDrawColor(227, 230, 232);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;

      // Assessment Result
      addText('AI Clinical Analysis', margin, y, 13, 'bold', [30, 30, 30]);
      y += 8;

      if (assessment.aiAnalysis?.redFlagDetected) {
        pdf.setFillColor(254, 226, 226);
        pdf.roundedRect(margin, y, contentWidth, 15, 3, 3, 'F');
        addText('🚨 IMMEDIATE MEDICAL ATTENTION RECOMMENDED', margin + 5, y + 10, 10, 'bold', [220, 38, 38]);
        y += 20;
      }

      // Conditions
      const conditions = assessment.aiAnalysis?.possibleConditions || [];
      conditions.forEach((c, idx) => {
        if (y > 260) { pdf.addPage(); y = 20; }
        pdf.setFillColor(252, 230, 236);
        pdf.roundedRect(margin, y, contentWidth, 22, 3, 3, 'F');
        addText(`Condition ${idx + 1}: ${c.condition}`, margin + 5, y + 8, 11, 'bold', [228, 4, 67]);
        addText(`Confidence: ${c.confidenceScore}%`, pageWidth - margin - 5, y + 8, 10, 'bold', [228, 4, 67], {align: 'right'});
        addText(`Supporting: ${c.supportingSymptoms}`, margin + 5, y + 16, 9, 'normal', [75, 70, 92]);
        y += 26;
      });

      y += 5;
      
      // Severity + Specialty
      const halfW = (contentWidth - 5) / 2;
      const sevColor = assessment.aiAnalysis.severityLevel === 'Severe' ? [220, 38, 38] : assessment.aiAnalysis.severityLevel === 'Moderate' ? [202, 138, 4] : [22, 163, 74];
      pdf.setFillColor(245, 246, 247);
      pdf.roundedRect(margin, y, halfW, 22, 3, 3, 'F');
      addText('Severity Level', margin + 5, y + 8, 9, 'bold', [141, 152, 164]);
      addText(assessment.aiAnalysis.severityLevel, margin + 5, y + 16, 12, 'bold', sevColor);

      pdf.roundedRect(margin + halfW + 5, y, halfW, 22, 3, 3, 'F');
      addText('Recommended Specialty', margin + halfW + 10, y + 8, 9, 'bold', [141, 152, 164]);
      const specLines = pdf.splitTextToSize(assessment.aiAnalysis.recommendedSpecialty, halfW - 10);
      pdf.setFontSize(11); pdf.setFont('helvetica', 'bold'); pdf.setTextColor(30, 30, 30);
      pdf.text(specLines[0], margin + halfW + 10, y + 16);
      y += 30;

      // Health Advice
      addText('Self-Care Advice', margin, y, 11, 'bold', [30, 30, 30]);
      y += 6;
      const adviceHeight = addWrappedText(assessment.aiAnalysis.healthAdvice, margin, y, contentWidth, 10);
      y += adviceHeight + 10;

      // Sources
      addText('Medical Sources Consulted', margin, y, 10, 'bold', [141, 152, 164]);
      y += 6;
      const srcText = assessment.aiAnalysis?.sources?.join(', ') || 'General Knowledge';
      const srcHeight = addWrappedText(srcText, margin, y, contentWidth, 9, 'normal', [141, 152, 164]);
      y += srcHeight + 10;

      // Disclaimer box
      if (y > 250) { pdf.addPage(); y = 20; }
      pdf.setFillColor(255, 251, 235);
      pdf.roundedRect(margin, y, contentWidth, 25, 3, 3, 'F');
      pdf.setDrawColor(252, 211, 77);
      pdf.roundedRect(margin, y, contentWidth, 25, 3, 3, 'S');
      addText('⚕️  Medical Disclaimer', margin + 5, y + 8, 10, 'bold', [120, 90, 0]);
      addWrappedText(
        'This assessment is AI-generated and is NOT a medical diagnosis. Please consult a qualified doctor for professional medical advice.',
        margin + 5, y + 16, contentWidth - 10, 9, 'normal', [120, 90, 0]
      );
      
      pdf.save(`dooper-assessment-${new Date().toISOString().slice(0,10)}.pdf`);
    } catch (err) {
      console.error('PDF generation failed:', err);
    } finally {
      setDownloading(false);
    }
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center pt-16">
      <Loader size="lg" text="Loading assessment..." />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center pt-16 px-4">
      <div className="flex items-center gap-2.5 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl max-w-md w-full mb-4">
        <AlertCircle className="w-5 h-5 text-red-500" />
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
      <button onClick={() => navigate('/dashboard')} className="btn-outline text-sm">
        Back to Dashboard
      </button>
    </div>
  );

  if (!assessment) return null;

  const sev = assessment.aiAnalysis?.severityLevel || 'Mild';
  const sevCfg = SEVERITY_CONFIG[sev] || SEVERITY_CONFIG.Mild;
  const SevIcon = sevCfg.icon;
  const conditions = assessment.aiAnalysis?.possibleConditions || [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pt-24">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-text-muted dark:text-slate-400 hover:text-primary dark:hover:text-primary transition-colors mb-6">
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary dark:text-slate-100 mb-1">Clinical Assessment Report</h1>
          <p className="text-sm text-text-muted dark:text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(assessment.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowChat(!showChat)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all ${showChat ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' : 'btn-outline py-2.5'}`}
          >
            <MessageSquare className="w-4 h-4" />
            {showChat ? 'Hide Chat' : 'AI Chat'}
          </button>
          <button onClick={handleDownloadPDF} disabled={downloading} className="flex items-center gap-2 btn-primary py-2.5 text-sm">
            {downloading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Download className="w-4 h-4" />}
            {downloading ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
      </div>

      <div className={`grid gap-6 ${showChat ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        <div className="space-y-5">
          
          {assessment.aiAnalysis?.redFlagDetected && (
            <div className="card bg-red-600 border-red-700 p-5">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-8 h-8 text-white animate-pulse" />
                <div>
                  <h2 className="text-lg font-bold text-white">🚨 IMMEDIATE MEDICAL ATTENTION RECOMMENDED</h2>
                  <p className="text-red-100 text-sm mt-1">Your symptoms indicate a potentially life-threatening emergency. Please seek immediate emergency medical care.</p>
                </div>
              </div>
            </div>
          )}

          {/* Patient Info */}
          <div className="card">
            <h2 className="text-sm font-bold text-text-secondary dark:text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
               <User className="w-4 h-4"/> Patient Profile
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Age', val: `${assessment.age} yrs` },
                { label: 'Gender', val: assessment.gender },
                { label: 'Weight', val: assessment.weight ? `${assessment.weight} kg` : 'N/A' },
                { label: 'Height', val: assessment.height ? `${assessment.height} cm` : 'N/A' },
              ].map(({ label, val }) => (
                <div key={label}>
                  <p className="text-xs text-text-muted dark:text-slate-400">{label}</p>
                  <p className="text-sm font-semibold text-text-primary dark:text-slate-100">{val}</p>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-border-light dark:border-slate-700 grid grid-cols-1 sm:grid-cols-3 gap-4">
               <div>
                  <p className="text-xs text-text-muted dark:text-slate-400">Duration</p>
                  <p className="text-sm font-semibold text-text-primary dark:text-slate-100">{assessment.duration}</p>
               </div>
               <div>
                  <p className="text-xs text-text-muted dark:text-slate-400">Pain Level</p>
                  <p className="text-sm font-semibold text-text-primary dark:text-slate-100">{assessment.painLevel ? `${assessment.painLevel}/10` : 'N/A'}</p>
               </div>
               {assessment.existingConditions && (
                <div>
                    <p className="text-xs text-text-muted dark:text-slate-400">Conditions</p>
                    <p className="text-sm font-semibold text-text-primary dark:text-slate-100">{assessment.existingConditions}</p>
                </div>
               )}
            </div>

            <div className="mt-4 pt-4 border-t border-border-light dark:border-slate-700">
              <p className="text-xs text-text-muted dark:text-slate-400 mb-1">Reported Symptoms</p>
              <div className="flex flex-wrap gap-2 mb-2">
                {assessment.primarySymptoms?.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 bg-primary/10 text-primary dark:bg-primary/20 text-xs font-medium rounded-md border border-primary/20">
                    {s}
                  </span>
                ))}
                {assessment.secondarySymptoms?.map((s, i) => (
                  <span key={i} className="px-2.5 py-1 bg-surface-hover dark:bg-slate-700 text-text-secondary dark:text-slate-300 text-xs font-medium rounded-md border border-border dark:border-slate-600">
                    {s}
                  </span>
                ))}
              </div>
              {assessment.symptoms && (
                <p className="text-sm text-text-secondary dark:text-slate-300 leading-relaxed italic">{assessment.symptoms}</p>
              )}
            </div>
          </div>

          {/* Possible Conditions */}
          <div className="card">
             <div className="flex items-center justify-between mb-4">
                 <h2 className="text-sm font-bold text-text-secondary dark:text-slate-300 uppercase tracking-wider flex items-center gap-2">
                   <Activity className="w-4 h-4"/> Top 3 Possible Conditions
                 </h2>
                 <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${sevCfg.color} ${sevCfg.bg} ${sevCfg.border}`}>
                    <SevIcon className="w-3.5 h-3.5" />
                    Severity: {sev}
                 </div>
             </div>

             <div className="space-y-3">
               {conditions.map((cond, idx) => (
                 <div key={idx} className="p-4 rounded-xl border border-border-light dark:border-slate-700 bg-surface-hover dark:bg-slate-800/50">
                    <div className="flex items-center justify-between mb-2">
                       <h3 className="text-base font-bold text-text-primary dark:text-slate-100">{cond.condition}</h3>
                       <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                             <div className="h-full bg-primary" style={{width: `${cond.confidenceScore}%`}}></div>
                          </div>
                          <span className="text-xs font-bold text-primary">{cond.confidenceScore}%</span>
                       </div>
                    </div>
                    <p className="text-sm text-text-secondary dark:text-slate-400">
                      <span className="font-semibold mr-1">Supporting Symptoms:</span>
                      {cond.supportingSymptoms}
                    </p>
                 </div>
               ))}
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Recommended Specialty */}
            <div className="card h-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary-light dark:bg-primary/20 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-muted dark:text-slate-400 uppercase tracking-wider">Recommended Specialty</p>
                  <p className="text-lg font-bold text-text-primary dark:text-slate-100">{assessment.aiAnalysis?.recommendedSpecialty}</p>
                </div>
              </div>
            </div>

            {/* Health Advice */}
            <div className="card h-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-muted dark:text-slate-400 uppercase tracking-wider">Self-Care Advice</p>
                  <p className="text-sm font-bold text-text-primary dark:text-slate-100">Recommended Actions</p>
                </div>
              </div>
              <p className="text-sm text-text-secondary dark:text-slate-300 leading-relaxed">
                {assessment.aiAnalysis?.healthAdvice}
              </p>
            </div>
          </div>

          {/* Sources */}
          {assessment.aiAnalysis?.sources && assessment.aiAnalysis.sources.length > 0 && (
            <div className="card bg-surface-hover/50 dark:bg-slate-800/30">
               <div className="flex items-center gap-2 mb-2">
                 <FileSearch className="w-4 h-4 text-text-muted" />
                 <h3 className="text-xs font-semibold text-text-muted dark:text-slate-400 uppercase tracking-wider">Medical Sources Consulted</h3>
               </div>
               <div className="flex flex-wrap gap-2">
                 {assessment.aiAnalysis.sources.map((src, i) => (
                   <span key={i} className="text-xs px-2 py-1 bg-white dark:bg-slate-700 border border-border-light dark:border-slate-600 rounded-md text-text-secondary dark:text-slate-300">
                     {src}
                   </span>
                 ))}
               </div>
            </div>
          )}

          {/* Disclaimer */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-700 dark:text-amber-400 mb-1">Medical Disclaimer</p>
              <p className="text-xs text-amber-600 dark:text-amber-500 leading-relaxed">
                {assessment.aiAnalysis?.disclaimer || "This assessment is AI-generated and is not a medical diagnosis. Please consult a qualified doctor for professional medical advice."}
              </p>
            </div>
          </div>
        </div>

        {/* Chat Column */}
        {showChat && (
          <div className="lg:sticky lg:top-24 lg:self-start">
            <ChatFollowUp
              assessmentId={assessment._id}
              initialHistory={assessment.chatHistory || []}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default AssessmentDetailPage;
