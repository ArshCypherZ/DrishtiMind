'use client';

import { createContext, useContext, useReducer } from 'react';

const initialState = {
  currentView: 'home',
  userInput: '',
  selectedMood: '',
  responses: {},
  isLoading: false,
  perspectiveStage: 'input',
  aiQuestions: [],
  currentQuestionIndex: 0,
  continueSession: null, // { sessionId, userInput, quizQuestions, quizAnswers, sessionData }
};

const AppContext = createContext(undefined);

function appReducer(state, action) {
  switch (action.type) {
    case 'SET_CURRENT_VIEW':
      return { ...state, currentView: action.payload };
    case 'SET_USER_INPUT':
      return { ...state, userInput: action.payload };
    case 'SET_SELECTED_MOOD':
      return { ...state, selectedMood: action.payload };
    case 'ADD_RESPONSE':
      return {
        ...state,
        responses: {
          ...state.responses,
          [action.payload.questionId]: action.payload.answer,
        },
      };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_PERSPECTIVE_STAGE':
      return { ...state, perspectiveStage: action.payload };
    case 'SET_AI_QUESTIONS':
      return { ...state, aiQuestions: action.payload };
    case 'SET_CURRENT_QUESTION_INDEX':
      return { ...state, currentQuestionIndex: action.payload };
    case 'SET_CONTINUE_SESSION':
      return { ...state, continueSession: action.payload };
    case 'CLEAR_CONTINUE_SESSION':
      return { ...state, continueSession: null };
    case 'RESET_STATE':
      return initialState;
    default:
      return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  const setCurrentView = (view) => {
    dispatch({ type: 'SET_CURRENT_VIEW', payload: view });
  };

  const setUserInput = (input) => {
    dispatch({ type: 'SET_USER_INPUT', payload: input });
  };

  const setSelectedMood = (mood) => {
    dispatch({ type: 'SET_SELECTED_MOOD', payload: mood });
  };

  const addResponse = (questionId, answer) => {
    dispatch({ type: 'ADD_RESPONSE', payload: { questionId, answer } });
  };

  const setLoading = (loading) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setPerspectiveStage = (stage) => {
    dispatch({ type: 'SET_PERSPECTIVE_STAGE', payload: stage });
  };

  const setAIQuestions = (questions) => {
    dispatch({ type: 'SET_AI_QUESTIONS', payload: questions });
  };

  const setCurrentQuestionIndex = (index) => {
    dispatch({ type: 'SET_CURRENT_QUESTION_INDEX', payload: index });
  };

  const setContinueSession = (sessionData) => {
    dispatch({ type: 'SET_CONTINUE_SESSION', payload: sessionData });
  };

  const clearContinueSession = () => {
    dispatch({ type: 'CLEAR_CONTINUE_SESSION' });
  };

  const nextQuestion = () => {
    if (state.currentQuestionIndex < state.aiQuestions.length - 1) {
      setCurrentQuestionIndex(state.currentQuestionIndex + 1);
    } else {
      completeUnderstanding();
    }
  };

  const submitInput = async () => {
    if (state.userInput.trim()) {
      setLoading(true);
      setTimeout(() => {
        const mockQuestions = [
          {
            id: 'mood',
            text: "How are you feeling about this right now?",
            type: 'emoji',
            required: true
          },
          {
            id: 'frequency',
            text: "How often does this situation occur?",
            type: 'multiple-choice',
            options: ['First time', 'Sometimes', 'Often', 'Every time'],
            required: true
          },
          {
            id: 'intensity',
            text: "On a scale of 1-5, how intense is this feeling?",
            type: 'scale',
            required: true
          }
        ];
        setAIQuestions(mockQuestions);
        setCurrentQuestionIndex(0);
        setPerspectiveStage('understanding');
        setLoading(false);
      }, 2000);
    }
  };

  const completeUnderstanding = () => {
    setPerspectiveStage('solution');
  };

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        setCurrentView,
        setUserInput,
        setSelectedMood,
        addResponse,
        setLoading,
        setPerspectiveStage,
        setAIQuestions,
        setCurrentQuestionIndex,
        setContinueSession,
        clearContinueSession,
        nextQuestion,
        submitInput,
        completeUnderstanding,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
