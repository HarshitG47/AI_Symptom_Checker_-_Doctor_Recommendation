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
        if (data.status === 'consulting') {
          navigate(`/consultation/${id}`);
          return;
        }
        setAssessment(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load assessment');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [id, navigate]);

  const handleDownloadPDF = async () => {
    if (!assessment) return;
    setDownloading(true);

    try {
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const margin = 20;
      const pageWidth = 210;
      const contentWidth = pageWidth - margin * 2;
      let y = 25;

      // Helper for normal text
      const addText = (text, x, yPos, size, style = 'normal', color = [30, 41, 59]) => {
        pdf.setFontSize(size);
        pdf.setFont('helvetica', style);
        pdf.setTextColor(...color);
        pdf.text(text, x, yPos);
      };

      // Helper for wrapped text block with dynamic pagination
      const addWrappedText = (text, x, yPos, maxWidth, size = 9, style = 'normal', color = [71, 85, 105]) => {
        pdf.setFontSize(size);
        pdf.setFont('helvetica', style);
        pdf.setTextColor(...color);
        const lines = pdf.splitTextToSize(text, maxWidth);
        const lineHeight = size * 0.35 + 1.5;
        let currentY = yPos;
        for (let i = 0; i < lines.length; i++) {
          if (currentY > 270) {
            pdf.addPage();
            currentY = 25;
            // Draw continuous header
            addText('dooper', margin, 15, 14, 'bold', [228, 4, 67]);
            addText('AI Clinical Assessment Report (Continued)', margin + 18, 14, 9, 'normal', [148, 163, 184]);
            pdf.setDrawColor(241, 245, 249);
            pdf.line(margin, 17, pageWidth - margin, 17);
            
            pdf.setFontSize(size);
            pdf.setFont('helvetica', style);
            pdf.setTextColor(...color);
          }
          pdf.text(lines[i], x, currentY);
          currentY += lineHeight;
        }
        return currentY - yPos;
      };

      // Check page height and add page if needed
      const checkSpace = (neededHeight) => {
        if (y + neededHeight > 270) {
          pdf.addPage();
          y = 25;
          // Draw standard page header
          addText('dooper', margin, 15, 14, 'bold', [228, 4, 67]);
          addText('AI Clinical Assessment Report', margin + 18, 14, 9, 'normal', [148, 163, 184]);
          pdf.setDrawColor(241, 245, 249);
          pdf.line(margin, 17, pageWidth - margin, 17);
        }
      };

      // --- PAGE 1: Branded Header ---
      addText('dooper', margin, y, 24, 'bold', [228, 4, 67]);
      addText('CLINICAL INTELLIGENCE ENGINE', margin + 2, y + 6, 8, 'bold', [148, 163, 184]);
      
      const dateText = `Report ID: ${assessment._id.toString().slice(-8).toUpperCase()}  |  Date: ${new Date(assessment.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(148, 163, 184);
      pdf.text(dateText, pageWidth - margin, y + 2, { align: 'right' });
      
      y += 12;
      pdf.setDrawColor(226, 232, 240);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;

      // --- Patient Clinical Profile ---
      addText('Patient Clinical Profile', margin, y, 12, 'bold', [30, 41, 59]);
      y += 5;

      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(margin, y, contentWidth, 38, 2, 2, 'F');
      
      const pCol1 = margin + 5;
      const pCol2 = margin + contentWidth / 2 + 5;
      let py = y + 7;

      addText(`Age: ${assessment.age} yrs`, pCol1, py, 9.5, 'normal', [71, 85, 105]);
      addText(`Gender: ${assessment.gender}`, pCol2, py, 9.5, 'normal', [71, 85, 105]);
      py += 7;
      addText(`Weight: ${assessment.weight ? `${assessment.weight} kg` : 'N/A'}`, pCol1, py, 9.5, 'normal', [71, 85, 105]);
      addText(`Height: ${assessment.height ? `${assessment.height} cm` : 'N/A'}`, pCol2, py, 9.5, 'normal', [71, 85, 105]);
      py += 7;
      addText(`Pregnancy Status: ${assessment.pregnancyStatus || 'N/A'}`, pCol1, py, 9.5, 'normal', [71, 85, 105]);
      addText(`Symptom Duration: ${assessment.duration}`, pCol2, py, 9.5, 'normal', [71, 85, 105]);
      py += 7;
      addText(`Pain Scale: ${assessment.painLevel || 'N/A'}/10`, pCol1, py, 9.5, 'normal', [71, 85, 105]);
      addText(`Existing Conditions: ${assessment.existingConditions || 'None'}`, pCol2, py, 9.5, 'normal', [71, 85, 105]);
      
      y += 45;

      // --- Medical History Details ---
      if (assessment.currentMedications || assessment.allergies) {
        addText('Clinical History / Vitals', margin, y, 11, 'bold', [30, 41, 59]);
        y += 5;
        let histText = '';
        if (assessment.currentMedications) histText += `Current Medications: ${assessment.currentMedications}\n`;
        if (assessment.allergies) histText += `Allergies / Drug Reactions: ${assessment.allergies}\n`;
        const histHeight = addWrappedText(histText.trim(), margin, y, contentWidth, 9, 'normal', [71, 85, 105]);
        y += histHeight + 8;
      }

      // --- Reported Symptoms ---
      addText('Reported Symptoms', margin, y, 11, 'bold', [30, 41, 59]);
      y += 5;
      
      let sympText = `Primary Symptoms: ${assessment.primarySymptoms?.join(', ') || 'N/A'}\n`;
      if (assessment.secondarySymptoms?.length) {
        sympText += `Secondary Symptoms: ${assessment.secondarySymptoms.join(', ')}\n`;
      }
      if (assessment.symptoms) {
        sympText += `Clinical Notes: "${assessment.symptoms}"`;
      }

      const symptomsHeight = addWrappedText(sympText.trim(), margin, y, contentWidth, 9, 'normal', [71, 85, 105]);
      y += symptomsHeight + 10;

      // --- Divider ---
      pdf.setDrawColor(241, 245, 249);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 8;

      // --- Red Flag Banner ---
      if (assessment.aiAnalysis?.redFlagDetected) {
        checkSpace(18);
        pdf.setFillColor(254, 226, 226);
        pdf.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'F');
        pdf.setDrawColor(252, 165, 165);
        pdf.roundedRect(margin, y, contentWidth, 14, 1.5, 1.5, 'S');
        addText('🚨 IMMEDIATE MEDICAL ATTENTION RECOMMENDED (RED FLAG)', margin + 5, y + 9, 9, 'bold', [220, 38, 38]);
        y += 20;
      }

      // --- Diagnostic Analysis ---
      addText('Evidence-Based AI Clinical Triage Analysis', margin, y, 12, 'bold', [30, 41, 59]);
      y += 7;

      const conditions = assessment.aiAnalysis?.possibleConditions || [];
      conditions.forEach((c, idx) => {
        let textNeeded = '';
        if (c.matchingSymptoms && c.matchingSymptoms.length > 0) {
          textNeeded += `Matching: ${c.matchingSymptoms.join(', ')}\n`;
        }
        if (c.missingSymptoms && c.missingSymptoms.length > 0) {
          textNeeded += `Absent: ${c.missingSymptoms.join(', ')}\n`;
        }
        textNeeded += `Reasoning: ${c.reasoning}`;

        const lines = pdf.splitTextToSize(textNeeded, contentWidth - 8);
        const textHeight = lines.length * (8.5 * 0.35 + 1.5);
        const cardHeight = 13 + textHeight + 4;

        checkSpace(cardHeight + 4);
        
        // Card Background
        pdf.setFillColor(253, 242, 244); // very light pink/rose
        pdf.roundedRect(margin, y, contentWidth, cardHeight, 1.5, 1.5, 'F');
        
        // Progress Bar for Confidence Score
        const barWidth = 30;
        const fillWidth = (c.confidenceScore / 100) * barWidth;
        
        addText(`${idx + 1}. ${c.condition}`, margin + 4, y + 7, 10.5, 'bold', [228, 4, 67]);
        
        // Draw progress bar outline
        pdf.setFillColor(226, 232, 240);
        pdf.roundedRect(pageWidth - margin - 4 - barWidth, y + 4.5, barWidth, 3.5, 1, 1, 'F');
        // Draw fill
        pdf.setFillColor(228, 4, 67);
        pdf.roundedRect(pageWidth - margin - 4 - barWidth, y + 4.5, fillWidth, 3.5, 1, 1, 'F');
        // Draw text
        addText(`${c.confidenceScore}% Match`, pageWidth - margin - 4.5 - barWidth - 14, y + 7.5, 8.5, 'bold', [228, 4, 67]);
        
        // Supporting details (matching/missing/reasoning)
        let detailsText = '';
        if (c.matchingSymptoms && c.matchingSymptoms.length > 0) {
          detailsText += `Matching: ${c.matchingSymptoms.join(', ')}\n`;
        }
        if (c.missingSymptoms && c.missingSymptoms.length > 0) {
          detailsText += `Absent Symptoms: ${c.missingSymptoms.join(', ')}\n`;
        }
        detailsText += `Clinical Reasoning: ${c.reasoning}`;

        addWrappedText(detailsText, margin + 4, y + 13, contentWidth - 8, 8.5, 'normal', [100, 116, 139]);
        y += cardHeight + 5;
      });

      y += 2;

      // --- Severity & Specialty Summary ---
      const halfW = (contentWidth - 6) / 2;
      let specialtyExplanationHeight = 0;
      if (assessment.aiAnalysis.recommendedSpecialtyExplanation) {
        const specLines = pdf.splitTextToSize(assessment.aiAnalysis.recommendedSpecialtyExplanation, halfW - 10);
        specialtyExplanationHeight = specLines.length * (8.5 * 0.35 + 1.5) + 4;
      }
      const boxHeight = Math.max(18 + specialtyExplanationHeight, 20);

      checkSpace(boxHeight + 5);
      const sevColor = assessment.aiAnalysis.severityLevel === 'Severe' ? [220, 38, 38] : assessment.aiAnalysis.severityLevel === 'Moderate' ? [202, 138, 4] : [22, 163, 74];
      
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(margin, y, halfW, boxHeight, 1.5, 1.5, 'F');
      addText('SEVERITY LEVEL', margin + 5, y + 6, 8, 'bold', [148, 163, 184]);
      addText(assessment.aiAnalysis.severityLevel, margin + 5, y + 14, 11, 'bold', sevColor);

      pdf.roundedRect(margin + halfW + 6, y, halfW, boxHeight, 1.5, 1.5, 'F');
      addText('RECOMMENDED MEDICAL SPECIALTY', margin + halfW + 11, y + 6, 8, 'bold', [148, 163, 184]);
      addText(assessment.aiAnalysis.recommendedSpecialty, margin + halfW + 11, y + 14, 10.5, 'bold', [30, 41, 59]);
      if (assessment.aiAnalysis.recommendedSpecialtyExplanation) {
        addWrappedText(assessment.aiAnalysis.recommendedSpecialtyExplanation, margin + halfW + 11, y + 20, halfW - 15, 8, 'normal', [71, 85, 105]);
      }

      y += boxHeight + 7;

      // --- Home Care Advice ---
      checkSpace(28);
      addText('Clinical Recommendations & Advice', margin, y, 11, 'bold', [30, 41, 59]);
      y += 5;
      const adviceHeight = addWrappedText(assessment.aiAnalysis.healthAdvice, margin, y, contentWidth, 9, 'normal', [71, 85, 105]);
      y += adviceHeight + 8;

      // --- Sources ---
      checkSpace(18);
      addText('References & Sources Consulted', margin, y, 9, 'bold', [148, 163, 184]);
      y += 4.5;
      const srcText = assessment.aiAnalysis?.sources?.join(', ') || 'MedlinePlus Open Medical Database';
      const srcHeight = addWrappedText(srcText, margin, y, contentWidth, 8, 'normal', [148, 163, 184]);
      y += srcHeight + 10;

      // --- Disclaimer Box ---
      checkSpace(24);
      pdf.setFillColor(254, 252, 232); // light warning yellow
      pdf.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, 'F');
      pdf.setDrawColor(254, 240, 138);
      pdf.roundedRect(margin, y, contentWidth, 20, 1.5, 1.5, 'S');
      addText('⚕️  Clinical Disclaimer', margin + 4, y + 6, 8.5, 'bold', [133, 77, 14]);
      addWrappedText(
        'This assessment is generated by an Artificial Intelligence engine using MedlinePlus knowledge contexts and is NOT a medical diagnosis. Please consult a licensed doctor or medical provider for clinical evaluation, diagnosis, and treatment.',
        margin + 4, y + 12, contentWidth - 8, 7.5, 'normal', [133, 77, 14]
      );

      pdf.save(`dooper-clinical-report-${new Date().toISOString().slice(0,10)}.pdf`);
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
                   <Activity className="w-4 h-4"/> Top 5 Differential Diagnoses
                 </h2>
                 <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${sevCfg.color} ${sevCfg.bg} ${sevCfg.border}`}>
                    <SevIcon className="w-3.5 h-3.5" />
                    Severity: {sev}
                 </div>
             </div>

             <div className="space-y-4">
               {conditions.map((cond, idx) => (
                 <div key={idx} className="p-5 rounded-2xl border border-border-light dark:border-slate-800 bg-surface-hover dark:bg-slate-900/40">
                    <div className="flex items-center justify-between mb-3">
                       <h3 className="text-base font-bold text-text-primary dark:text-slate-100">{idx + 1}. {cond.condition}</h3>
                       <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                             <div className="h-full bg-primary" style={{width: `${cond.confidenceScore}%`}}></div>
                          </div>
                          <span className="text-xs font-bold text-primary">{cond.confidenceScore}%</span>
                       </div>
                    </div>

                    <div className="space-y-3.5">
                      {cond.matchingSymptoms && cond.matchingSymptoms.length > 0 && (
                        <div>
                          <p className="text-[11px] font-semibold text-text-muted dark:text-slate-400 uppercase tracking-wider mb-1">Matching Symptoms</p>
                          <div className="flex flex-wrap gap-1.5">
                            {cond.matchingSymptoms.map((sym, i) => (
                              <span key={i} className="px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium rounded-md border border-emerald-200 dark:border-emerald-900/50">
                                {sym}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {cond.missingSymptoms && cond.missingSymptoms.length > 0 && (
                        <div>
                          <p className="text-[11px] font-semibold text-text-muted dark:text-slate-400 uppercase tracking-wider mb-1">Absence of Symptoms</p>
                          <div className="flex flex-wrap gap-1.5">
                            {cond.missingSymptoms.map((sym, i) => (
                              <span key={i} className="px-2 py-0.5 bg-slate-50 dark:bg-slate-850 text-text-muted dark:text-slate-400 text-xs font-medium rounded-md border border-border dark:border-slate-700">
                                {sym}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="pt-2 border-t border-border-light/50 dark:border-slate-800">
                        <p className="text-xs font-semibold text-text-secondary dark:text-slate-300 mb-0.5">Clinical Reasoning</p>
                        <p className="text-sm text-text-secondary dark:text-slate-400 leading-relaxed">{cond.reasoning}</p>
                      </div>
                    </div>
                 </div>
               ))}
             </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Recommended Specialty */}
            <div className="card h-full flex flex-col justify-between">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary-light dark:bg-primary/20 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-text-muted dark:text-slate-400 uppercase tracking-wider">Recommended Specialty</p>
                  <p className="text-lg font-bold text-text-primary dark:text-slate-100">{assessment.aiAnalysis?.recommendedSpecialty}</p>
                </div>
              </div>
              {assessment.aiAnalysis?.recommendedSpecialtyExplanation && (
                <p className="text-xs text-text-secondary dark:text-slate-400 leading-relaxed border-t border-border-light dark:border-slate-800 pt-3 mt-2">
                  {assessment.aiAnalysis.recommendedSpecialtyExplanation}
                </p>
              )}
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

          {/* RAG Knowledge Base Queries — Explainability Section */}
          {assessment.ragKeywords && assessment.ragKeywords.length > 0 && (
            <div className="card bg-blue-50/50 dark:bg-blue-950/10 border border-blue-100 dark:border-blue-900/30">
              <div className="flex items-center gap-2 mb-3">
                <FileSearch className="w-4 h-4 text-blue-500" />
                <h3 className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                  AI Knowledge Base Queries (Dynamic RAG)
                </h3>
              </div>
              <p className="text-[11px] text-text-muted dark:text-slate-400 mb-3 leading-relaxed">
                The triage assistant extracted these clinical keywords from your symptoms, Q&A responses, and uploaded reports, then queried MedlinePlus for each to retrieve trusted, evidence-based medical literature used in this assessment.
              </p>
              <div className="flex flex-wrap gap-2">
                {assessment.ragKeywords.map((kw, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-medium rounded-full border border-blue-200 dark:border-blue-800/50">
                    🔍 {kw}
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
