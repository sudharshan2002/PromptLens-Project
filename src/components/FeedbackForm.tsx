/**
 * FeedbackForm Component
 * Built-in feedback form with survey questions, consent handling, and metric collection
 */

import { useState, useCallback } from 'react';
import { 
  MessageSquare, Star, CheckCircle, AlertCircle, 
  Send, ChevronRight, Shield, Eye, Sparkles, Clock,
  ThumbsUp, ThumbsDown
} from 'lucide-react';
import { TrustMetrics, FeedbackSubmission } from '../types/api.types';

interface FeedbackFormProps {
  sessionId: string;
  onSubmit: (feedback: FeedbackSubmission) => Promise<void>;
  onClose?: () => void;
  startTime?: number; // Session start time for calculating time to satisfactory
}

interface SurveyQuestion {
  id: string;
  question: string;
  type: 'likert' | 'binary' | 'text';
  category: 'trust' | 'transparency' | 'quality' | 'usability';
  required: boolean;
}

const surveyQuestions: SurveyQuestion[] = [
  {
    id: 'trust_ai_output',
    question: 'I trust the AI-generated output based on the explanations provided.',
    type: 'likert',
    category: 'trust',
    required: true,
  },
  {
    id: 'understand_mapping',
    question: 'I understand how my prompt segments influenced the generated output.',
    type: 'likert',
    category: 'transparency',
    required: true,
  },
  {
    id: 'explanation_helpful',
    question: 'The visual explanations (highlights, mappings) were helpful.',
    type: 'likert',
    category: 'transparency',
    required: true,
  },
  {
    id: 'output_quality',
    question: 'The quality of the generated output met my expectations.',
    type: 'likert',
    category: 'quality',
    required: true,
  },
  {
    id: 'confusion_reduced',
    question: 'The explanations reduced my confusion about how the AI works.',
    type: 'likert',
    category: 'transparency',
    required: true,
  },
  {
    id: 'would_use_again',
    question: 'I would use this explainable AI interface again.',
    type: 'binary',
    category: 'usability',
    required: false,
  },
];

const likertLabels = [
  { value: 1, label: 'Strongly Disagree' },
  { value: 2, label: 'Disagree' },
  { value: 3, label: 'Neutral' },
  { value: 4, label: 'Agree' },
  { value: 5, label: 'Strongly Agree' },
];

export function FeedbackForm({
  sessionId,
  onSubmit,
  onClose,
  startTime,
}: FeedbackFormProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, number | string>>({});
  const [comments, setComments] = useState('');
  const [consentGiven, setConsentGiven] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate progress
  const totalSteps = surveyQuestions.length + 2; // Questions + consent + comments
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Get current question
  const currentQuestion = surveyQuestions[currentStep];

  // Handle likert response
  const handleLikertResponse = useCallback((questionId: string, value: number) => {
    setResponses(prev => ({ ...prev, [questionId]: value }));
  }, []);

  // Handle binary response
  const handleBinaryResponse = useCallback((questionId: string, value: boolean) => {
    setResponses(prev => ({ ...prev, [questionId]: value ? 1 : 0 }));
  }, []);

  // Check if current step is complete
  const isCurrentStepComplete = useCallback(() => {
    if (currentStep < surveyQuestions.length) {
      const question = surveyQuestions[currentStep];
      return !question.required || responses[question.id] !== undefined;
    }
    if (currentStep === surveyQuestions.length) {
      return true; // Comments step is always complete
    }
    return consentGiven; // Consent step
  }, [currentStep, responses, consentGiven]);

  // Navigate steps
  const goNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep, totalSteps]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  // Calculate aggregate metrics
  const calculateMetrics = useCallback((): TrustMetrics => {
    const trustQuestions = surveyQuestions.filter(q => q.category === 'trust');
    const transparencyQuestions = surveyQuestions.filter(q => q.category === 'transparency');
    const qualityQuestions = surveyQuestions.filter(q => q.category === 'quality');

    const avg = (ids: string[]) => {
      const values = ids.map(id => responses[id]).filter(v => typeof v === 'number') as number[];
      return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 3;
    };

    const timeToSatisfactory = startTime 
      ? Math.round((Date.now() - startTime) / 1000)
      : 60;

    return {
      sessionId,
      trustScore: avg(trustQuestions.map(q => q.id)),
      transparencyScore: avg(transparencyQuestions.map(q => q.id)),
      understandingScore: avg(qualityQuestions.map(q => q.id)),
      usefulnessScore: Number(responses['confusion_reduced']) || 3,
      timeSpentSeconds: timeToSatisfactory,
    };
  }, [responses, sessionId, startTime]);

  // Submit feedback
  const handleSubmit = useCallback(async () => {
    if (!consentGiven) {
      setError('Please provide consent to submit your feedback.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const metrics = calculateMetrics();
      const feedback: FeedbackSubmission = {
        sessionId,
        ratings: {
          transparency: metrics.transparencyScore,
          understanding: metrics.understandingScore,
          trust: metrics.trustScore,
          usefulness: metrics.usefulnessScore,
        },
        comments: comments.trim() || undefined,
        consent: consentGiven,
      };

      await onSubmit(feedback);
      setIsSubmitted(true);
    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [consentGiven, calculateMetrics, sessionId, comments, responses, onSubmit]);

  // Render success state
  if (isSubmitted) {
    return (
      <div 
        className="rounded-3xl p-8 liquid-glass border text-center"
        style={{ borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-md)' }}
      >
        <div 
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: '#00823b20' }}
        >
          <CheckCircle size={32} style={{ color: '#00823b' }} />
        </div>
        <h3 style={{ fontWeight: 600, fontSize: '1.5rem', marginBottom: '12px' }}>
          Thank You!
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem', marginBottom: '24px' }}>
          Your feedback has been recorded and will help improve the explainability of AI systems.
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="px-6 py-3 rounded-xl liquid-transition hover:scale-105"
            style={{
              background: 'var(--accent-primary)',
              color: '#fff',
              fontWeight: 500,
            }}
          >
            Continue
          </button>
        )}
      </div>
    );
  }

  return (
    <div 
      className="rounded-3xl p-6 liquid-glass border"
      style={{ borderColor: 'var(--border-color)', boxShadow: 'var(--shadow-md)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div 
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ 
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.2)'
          }}
        >
          <MessageSquare size={18} style={{ color: '#ffffff' }} />
        </div>
        <div>
          <h3 style={{ fontWeight: 600, fontSize: '1.125rem', letterSpacing: '-0.02em' }}>
            Feedback Survey
          </h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Help us improve AI explainability
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            Step {currentStep + 1} of {totalSteps}
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            {Math.round(progress)}%
          </span>
        </div>
        <div 
          className="h-2 rounded-full overflow-hidden"
          style={{ background: 'var(--bg-tertiary)' }}
        >
          <div 
            className="h-full rounded-full liquid-transition"
            style={{ 
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--accent-primary), #8b5cf6)',
            }}
          />
        </div>
      </div>

      {/* Question content */}
      <div className="min-h-[200px] mb-6">
        {currentStep < surveyQuestions.length ? (
          // Survey question
          <div className="fade-in">
            <div className="flex items-center gap-2 mb-4">
              {currentQuestion.category === 'trust' && <Shield size={16} style={{ color: '#0071e3' }} />}
              {currentQuestion.category === 'transparency' && <Eye size={16} style={{ color: '#00823b' }} />}
              {currentQuestion.category === 'quality' && <Sparkles size={16} style={{ color: '#8b5cf6' }} />}
              {currentQuestion.category === 'usability' && <Clock size={16} style={{ color: '#f59e0b' }} />}
              <span 
                className="px-2 py-0.5 rounded-md text-xs font-medium uppercase"
                style={{ 
                  background: currentQuestion.category === 'trust' ? '#0071e320' :
                             currentQuestion.category === 'transparency' ? '#00823b20' :
                             currentQuestion.category === 'quality' ? '#8b5cf620' : '#f59e0b20',
                  color: currentQuestion.category === 'trust' ? '#0071e3' :
                         currentQuestion.category === 'transparency' ? '#00823b' :
                         currentQuestion.category === 'quality' ? '#8b5cf6' : '#f59e0b',
                }}
              >
                {currentQuestion.category}
              </span>
              {currentQuestion.required && (
                <span style={{ color: '#d70015', fontSize: '0.75rem' }}>*Required</span>
              )}
            </div>

            <p style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '24px', lineHeight: 1.5 }}>
              {currentQuestion.question}
            </p>

            {currentQuestion.type === 'likert' && (
              <div className="space-y-3">
                {likertLabels.map((option) => {
                  const isSelected = responses[currentQuestion.id] === option.value;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleLikertResponse(currentQuestion.id, option.value)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl liquid-transition hover:scale-[1.01]"
                      style={{
                        background: isSelected ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                        border: `1.5px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                        color: isSelected ? '#fff' : 'var(--text-primary)',
                      }}
                    >
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                        style={{
                          background: isSelected ? 'rgba(255,255,255,0.2)' : 'var(--bg-tertiary)',
                          fontWeight: 600,
                          fontSize: '0.875rem',
                        }}
                      >
                        {option.value}
                      </div>
                      <span style={{ fontSize: '0.875rem', fontWeight: isSelected ? 500 : 400 }}>
                        {option.label}
                      </span>
                      {isSelected && (
                        <CheckCircle size={18} className="ml-auto" style={{ color: '#fff' }} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === 'binary' && (
              <div className="flex gap-4">
                <button
                  onClick={() => handleBinaryResponse(currentQuestion.id, true)}
                  className="flex-1 flex items-center justify-center gap-3 p-6 rounded-xl liquid-transition hover:scale-[1.02]"
                  style={{
                    background: responses[currentQuestion.id] === 1 ? '#00823b' : 'var(--bg-secondary)',
                    border: `1.5px solid ${responses[currentQuestion.id] === 1 ? '#00823b' : 'var(--border-color)'}`,
                    color: responses[currentQuestion.id] === 1 ? '#fff' : 'var(--text-primary)',
                  }}
                >
                  <ThumbsUp size={24} />
                  <span style={{ fontWeight: 500 }}>Yes</span>
                </button>
                <button
                  onClick={() => handleBinaryResponse(currentQuestion.id, false)}
                  className="flex-1 flex items-center justify-center gap-3 p-6 rounded-xl liquid-transition hover:scale-[1.02]"
                  style={{
                    background: responses[currentQuestion.id] === 0 ? '#d70015' : 'var(--bg-secondary)',
                    border: `1.5px solid ${responses[currentQuestion.id] === 0 ? '#d70015' : 'var(--border-color)'}`,
                    color: responses[currentQuestion.id] === 0 ? '#fff' : 'var(--text-primary)',
                  }}
                >
                  <ThumbsDown size={24} />
                  <span style={{ fontWeight: 500 }}>No</span>
                </button>
              </div>
            )}
          </div>
        ) : currentStep === surveyQuestions.length ? (
          // Comments step
          <div className="fade-in">
            <p style={{ fontSize: '1rem', fontWeight: 500, marginBottom: '16px' }}>
              Any additional comments or suggestions? (Optional)
            </p>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Share your thoughts on the AI explainability features..."
              className="w-full rounded-xl p-4 resize-none focus:outline-none liquid-transition"
              style={{
                background: 'var(--bg-secondary)',
                border: '1.5px solid var(--border-color)',
                minHeight: '150px',
                fontSize: '0.9375rem',
              }}
            />
          </div>
        ) : (
          // Consent step
          <div className="fade-in">
            <div 
              className="p-5 rounded-xl mb-6"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}
            >
              <h4 style={{ fontWeight: 600, marginBottom: '12px' }}>Data Usage Consent</h4>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                By submitting this feedback, you consent to having your responses anonymously 
                recorded for research purposes. This data will be used to improve AI 
                explainability systems and may be included in academic publications. 
                No personally identifiable information will be collected.
              </p>
            </div>

            <label className="flex items-start gap-4 cursor-pointer">
              <div 
                className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 liquid-transition"
                style={{
                  background: consentGiven ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                  border: `2px solid ${consentGiven ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                }}
                onClick={() => setConsentGiven(!consentGiven)}
              >
                {consentGiven && <CheckCircle size={14} style={{ color: '#fff' }} />}
              </div>
              <span style={{ fontSize: '0.9375rem', lineHeight: 1.5 }}>
                I understand and consent to the anonymous collection of my feedback for 
                research purposes.
              </span>
            </label>

            {error && (
              <div 
                className="mt-4 p-3 rounded-lg flex items-center gap-2"
                style={{ background: '#d7001515', border: '1px solid #d7001530' }}
              >
                <AlertCircle size={16} style={{ color: '#d70015' }} />
                <span style={{ color: '#d70015', fontSize: '0.875rem' }}>{error}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: 'var(--border-color)' }}>
        <button
          onClick={goBack}
          disabled={currentStep === 0}
          className="px-4 py-2 rounded-lg liquid-transition disabled:opacity-30"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            fontSize: '0.875rem',
            color: 'var(--text-secondary)',
          }}
        >
          Back
        </button>

        {currentStep < totalSteps - 1 ? (
          <button
            onClick={goNext}
            disabled={!isCurrentStepComplete()}
            className="flex items-center gap-2 px-5 py-2 rounded-lg liquid-transition hover:scale-105 disabled:opacity-50"
            style={{
              background: 'var(--accent-primary)',
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            Next
            <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!consentGiven || isSubmitting}
            className="flex items-center gap-2 px-5 py-2 rounded-lg liquid-transition hover:scale-105 disabled:opacity-50"
            style={{
              background: '#00823b',
              color: '#fff',
              fontSize: '0.875rem',
              fontWeight: 500,
            }}
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send size={16} />
                Submit Feedback
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
