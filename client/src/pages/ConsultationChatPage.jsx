import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Send, Brain, ShieldAlert, ArrowRight, Activity, 
  MessageSquare, User, CheckCircle2, ChevronRight 
} from 'lucide-react';
import assessmentService from '../services/assessmentService';
import Loader from '../components/common/Loader';

const ConsultationChatPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [messageInput, setMessageInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const chatEndRef = useRef(null);

  // Hooks must be declared at the top of the component, before any conditional returns
  const userTurns = assessment?.chatHistory?.filter(h => h.role === 'user').length || 0;
  const progressPercent = Math.min((userTurns / 5) * 100, 100);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const data = await assessmentService.getAssessmentById(id);
        setAssessment(data);
        
        // If already completed, redirect to report details immediately
        if (data.status === 'completed') {
          navigate(`/assessment/${id}`);
        }
      } catch (err) {
        setError('Failed to load consultation session.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAssessment();
  }, [id, navigate]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [assessment?.chatHistory]);

  // Auto compile when maximum questions are answered
  useEffect(() => {
    if (assessment && assessment.status === 'consulting' && userTurns >= 5 && !sending) {
      handleForceComplete();
    }
  }, [assessment, userTurns]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!messageInput.trim() || sending) return;

    const userMsg = messageInput.trim();
    setMessageInput('');
    setSending(true);

    // Optimistically update chat history for smooth user experience
    setAssessment(prev => ({
      ...prev,
      chatHistory: [...prev.chatHistory, { role: 'user', content: userMsg, timestamp: new Date() }]
    }));

    try {
      const updated = await assessmentService.chatFollowUp(id, userMsg);
      setAssessment(updated);

      if (updated.status === 'completed') {
        setTimeout(() => {
          navigate(`/assessment/${id}`);
        }, 2500);
      }
    } catch (err) {
      setError('Failed to send response. Please try again.');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  const handleForceComplete = async () => {
    if (sending) return;
    setSending(true);
    try {
      // Send a command-like message to force assessment compilation
      const updated = await assessmentService.chatFollowUp(id, "Please compile the final diagnostic report now.");
      setAssessment(updated);
      if (updated.status === 'completed') {
        navigate(`/assessment/${id}`);
      }
    } catch (err) {
      setError('Could not complete consultation early.');
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center pt-16">
        <Loader size="lg" text="Starting virtual consultation..." />
      </div>
    );
  }

  if (error && !assessment) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center pt-16 px-4">
        <div className="flex items-center gap-2.5 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl max-w-md w-full mb-4">
          <ShieldAlert className="w-5 h-5 text-red-500" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
        <button onClick={() => navigate('/dashboard')} className="btn-outline text-sm">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pt-24 min-h-[calc(100vh-80px)] flex flex-col">
      {/* Upper header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Brain className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary dark:text-slate-100 flex items-center gap-2">
              dooper <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">Triage Agent</span>
            </h1>
            <p className="text-xs text-text-muted dark:text-slate-400">Interactive Clinical Q&A Consultation</p>
          </div>
        </div>

        {/* Dynamic progress bar */}
        <div className="flex flex-col items-end w-full md:w-64">
          <div className="flex justify-between w-full text-xs font-medium text-text-secondary dark:text-slate-300 mb-1.5">
            <span>Consultation Progress</span>
            <span>{Math.min(userTurns + 1, 5)} of 5 Steps</span>
          </div>
          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-border-light dark:border-slate-800">
            <div 
              className="h-full bg-primary transition-all duration-500 rounded-full" 
              style={{ width: `${Math.max(10, progressPercent)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-grow items-stretch">
        {/* Left Side: Patient Data Panel */}
        <div className="lg:col-span-1 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md rounded-2xl border border-border-light dark:border-slate-800 p-5 flex flex-col justify-between min-h-[500px] lg:h-auto">
          <div className="space-y-5">
            <div>
              <h3 className="text-sm font-bold text-primary flex items-center gap-2 mb-4 uppercase tracking-wider pb-2 border-b border-border-light dark:border-slate-800">
                <Activity className="w-4 h-4" /> Consultation Context
              </h3>
              
              <div className="space-y-3 text-sm">
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl space-y-2 border border-border-light/50 dark:border-slate-800">
                  <p className="text-text-secondary dark:text-slate-300">
                    <strong>Patient Profile:</strong> {assessment.age} yr old {assessment.gender}
                  </p>
                  <p className="text-text-secondary dark:text-slate-300">
                    <strong>Initial Symptoms:</strong> {assessment.primarySymptoms?.join(', ')}
                  </p>
                  {assessment.uploadedReportName && (
                    <p className="text-text-secondary dark:text-slate-300 flex items-center gap-1.5 text-xs text-primary font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary" /> Parsed: {assessment.uploadedReportName}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* HIGHLY VISIBLE MEDICAL DISCLAIMER IN SIDEBAR */}
            <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl space-y-2.5">
              <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                <ShieldAlert className="w-4 h-4" />
                <h4 className="text-xs font-bold uppercase tracking-wider">Clinical Disclaimer</h4>
              </div>
              <p className="text-[11px] text-amber-700/90 dark:text-amber-500 leading-relaxed font-medium">
                dooper Triage is an AI decision-support assistant designed to collect clinical symptoms and run informational context analysis. It is **NOT** a substitute for professional medical diagnosis. 
              </p>
              <p className="text-[11px] text-amber-700/90 dark:text-amber-500 leading-relaxed font-bold">
                🚨 If you are experiencing a life-threatening medical emergency (like severe chest pain or extreme breathing difficulty), immediately visit the nearest emergency room.
              </p>
            </div>
          </div>

          <button 
            onClick={handleForceComplete}
            disabled={sending || assessment.status === 'completed'}
            className="w-full text-xs font-bold py-3 bg-primary/5 hover:bg-primary hover:text-white border border-primary/20 text-primary rounded-xl transition-all mt-6 shadow-sm"
          >
            Skip Q&A and Compile Report
          </button>
        </div>

        {/* Right Side: Interactive Chat Box */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-border-light dark:border-slate-800 flex flex-col justify-between overflow-hidden shadow-card min-h-[500px]">
          
          {/* Chat Messages */}
          <div className="flex-grow p-5 space-y-4 overflow-y-auto max-h-[420px] scrollbar-thin">
            {assessment.chatHistory.map((chat, idx) => (
              <div 
                key={idx} 
                className={`flex gap-3 max-w-[85%] ${chat.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                  chat.role === 'user' 
                    ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' 
                    : 'bg-primary text-white'
                }`}>
                  {chat.role === 'user' ? <User className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                </div>

                {/* Bubble */}
                <div>
                  <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    chat.role === 'user'
                      ? 'bg-primary text-white rounded-tr-none'
                      : 'bg-slate-50 dark:bg-slate-800/80 text-text-primary dark:text-slate-100 border border-border-light dark:border-slate-800 rounded-tl-none'
                  }`}>
                    {chat.content}
                  </div>
                  <span className="text-[9px] text-text-muted mt-1 block px-1">
                    {new Date(chat.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {/* Redirection Alert Banner */}
            {assessment.status === 'completed' && (
              <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl text-center flex flex-col items-center gap-2 animate-pulse mt-4">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Consultation Finished!</h4>
                <p className="text-xs text-emerald-600 dark:text-emerald-500">Compiling differential diagnosis & redirecting you to your report page...</p>
              </div>
            )}

            {/* Auto Compilation Notice at step limit */}
            {assessment.status === 'consulting' && userTurns >= 5 && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-xl text-center flex flex-col items-center gap-2 animate-pulse mt-4">
                <Brain className="w-6 h-6 text-primary" />
                <h4 className="text-sm font-bold text-primary">Triage Limit Reached</h4>
                <p className="text-xs text-text-secondary dark:text-slate-400">Compiling your comprehensive diagnostic clinical report automatically...</p>
              </div>
            )}

            {/* Loader / Typing Indicator */}
            {sending && (
              <div className="flex gap-3 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                  <Brain className="w-4 h-4" />
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl rounded-tl-none border border-border-light dark:border-slate-800 flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            
            <div ref={chatEndRef} />
          </div>

          {/* Quick compilation prompt box when >= 3 answers provided */}
          {assessment.status === 'consulting' && userTurns >= 3 && userTurns < 5 && (
            <div className="mx-4 my-2 p-3 bg-primary-light/50 dark:bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between gap-3 animate-fade-in shadow-sm">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary shrink-0" />
                <span className="text-[11px] font-semibold text-text-secondary dark:text-slate-300 leading-tight">
                  We have gathered enough data to generate the report. You can keep answering or compile now.
                </span>
              </div>
              <button 
                onClick={handleForceComplete}
                className="btn-primary py-1.5 px-3 text-xs font-bold shrink-0 shadow-sm"
              >
                Compile Report
              </button>
            </div>
          )}

          {/* Sticky medical disclaimer directly above chat inputs */}
          <div className="px-4 py-2 border-t border-border-light dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/40 text-[10px] text-center text-text-muted dark:text-slate-400">
            ⚕️ dooper Triage is an AI support assistant, not a doctor. Seek emergency care immediately if you have life-threatening symptoms.
          </div>

          {/* Form Input Footer */}
          <form onSubmit={handleSend} className="p-4 border-t border-border-light dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex gap-2.5 items-center">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder={assessment.status === 'completed' || userTurns >= 5 ? 'Triage completed' : 'Type your clinical response...'}
              disabled={sending || assessment.status === 'completed' || userTurns >= 5}
              className="flex-grow input-field py-3.5 bg-white dark:bg-slate-800"
            />
            <button
              type="submit"
              disabled={!messageInput.trim() || sending || assessment.status === 'completed' || userTurns >= 5}
              className="btn-primary p-3.5 flex items-center justify-center shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ConsultationChatPage;
