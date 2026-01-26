/**
 * useSession Hook
 * Manages session state, prompt history, and state persistence for PromptLens
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  Session, 
  PromptSegment, 
  TextExplanation, 
  ImageExplanation,
  TrustMetrics,
  FeedbackSubmission
} from '../types/api.types';
import { generateSessionId } from '../services/api.service';

interface PromptEntry {
  id: string;
  prompt: string;
  segments: PromptSegment[];
  textOutput?: string;
  imageOutput?: string;
  textExplanation?: TextExplanation;
  imageExplanation?: ImageExplanation;
  timestamp: string;
}

interface SessionState {
  sessionId: string;
  startTime: number;
  prompts: PromptEntry[];
  currentPromptIndex: number;
  metrics?: TrustMetrics;
  feedbackSubmitted: boolean;
}

interface UseSessionReturn {
  // Session info
  sessionId: string;
  startTime: number;
  sessionDuration: number;
  
  // Prompt management
  prompts: PromptEntry[];
  currentPrompt: PromptEntry | null;
  
  // Actions
  addPrompt: (entry: Omit<PromptEntry, 'id' | 'timestamp'>) => void;
  updateCurrentPrompt: (updates: Partial<PromptEntry>) => void;
  selectPrompt: (index: number) => void;
  clearHistory: () => void;
  
  // Feedback
  feedbackSubmitted: boolean;
  setFeedbackSubmitted: (submitted: boolean) => void;
  
  // Persistence
  exportSession: () => Session;
  resetSession: () => void;
}

const SESSION_STORAGE_KEY = 'promptlens_session';

export function useSession(): UseSessionReturn {
  // Initialize session state
  const [state, setState] = useState<SessionState>(() => {
    // Try to restore from localStorage
    try {
      const saved = localStorage.getItem(SESSION_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Check if session is still valid (within 24 hours)
        if (Date.now() - parsed.startTime < 24 * 60 * 60 * 1000) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to restore session:', e);
    }
    
    // Create new session
    return {
      sessionId: generateSessionId(),
      startTime: Date.now(),
      prompts: [],
      currentPromptIndex: -1,
      feedbackSubmitted: false,
    };
  });

  // Session duration in seconds
  const sessionDuration = useMemo(() => {
    return Math.floor((Date.now() - state.startTime) / 1000);
  }, [state.startTime]);

  // Current prompt
  const currentPrompt = useMemo(() => {
    if (state.currentPromptIndex >= 0 && state.currentPromptIndex < state.prompts.length) {
      return state.prompts[state.currentPromptIndex];
    }
    return null;
  }, [state.prompts, state.currentPromptIndex]);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Failed to save session:', e);
    }
  }, [state]);

  // Add a new prompt entry
  const addPrompt = useCallback((entry: Omit<PromptEntry, 'id' | 'timestamp'>) => {
    setState(prev => {
      const newEntry: PromptEntry = {
        ...entry,
        id: `prompt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        timestamp: new Date().toISOString(),
      };
      
      const newPrompts = [...prev.prompts, newEntry];
      
      return {
        ...prev,
        prompts: newPrompts,
        currentPromptIndex: newPrompts.length - 1,
      };
    });
  }, []);

  // Update current prompt
  const updateCurrentPrompt = useCallback((updates: Partial<PromptEntry>) => {
    setState(prev => {
      if (prev.currentPromptIndex < 0) return prev;
      
      const newPrompts = [...prev.prompts];
      newPrompts[prev.currentPromptIndex] = {
        ...newPrompts[prev.currentPromptIndex],
        ...updates,
      };
      
      return {
        ...prev,
        prompts: newPrompts,
      };
    });
  }, []);

  // Select a prompt from history
  const selectPrompt = useCallback((index: number) => {
    setState(prev => ({
      ...prev,
      currentPromptIndex: Math.max(-1, Math.min(index, prev.prompts.length - 1)),
    }));
  }, []);

  // Clear prompt history
  const clearHistory = useCallback(() => {
    setState(prev => ({
      ...prev,
      prompts: [],
      currentPromptIndex: -1,
    }));
  }, []);

  // Set feedback submitted
  const setFeedbackSubmitted = useCallback((submitted: boolean) => {
    setState(prev => ({
      ...prev,
      feedbackSubmitted: submitted,
    }));
  }, []);

  // Export session data
  const exportSession = useCallback((): Session => {
    return {
      id: state.sessionId,
      startTime: new Date(state.startTime).toISOString(),
      prompts: state.prompts.map(p => ({
        prompt: p.prompt,
        segments: p.segments,
        textOutput: p.textOutput,
        imageOutput: p.imageOutput,
        explanations: {
          text: p.textExplanation,
          image: p.imageExplanation,
        },
        timestamp: p.timestamp,
      })),
      metrics: state.metrics,
    };
  }, [state]);

  // Reset session
  const resetSession = useCallback(() => {
    const newState: SessionState = {
      sessionId: generateSessionId(),
      startTime: Date.now(),
      prompts: [],
      currentPromptIndex: -1,
      feedbackSubmitted: false,
    };
    
    setState(newState);
    
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear session storage:', e);
    }
  }, []);

  return {
    sessionId: state.sessionId,
    startTime: state.startTime,
    sessionDuration,
    prompts: state.prompts,
    currentPrompt,
    addPrompt,
    updateCurrentPrompt,
    selectPrompt,
    clearHistory,
    feedbackSubmitted: state.feedbackSubmitted,
    setFeedbackSubmitted,
    exportSession,
    resetSession,
  };
}
