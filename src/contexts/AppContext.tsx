import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { AppContextState, AppFlowState, ProcessingResult } from '../types';

interface AppContextProps {
  state: AppContextState;
  setState: React.Dispatch<React.SetStateAction<AppContextState>>;
  updateCurrentStep: (step: AppFlowState) => void;
  updateProcessingResult: (result: ProcessingResult | null) => void;
  setError: (error: string | null) => void;
  resetState: () => void;
}

const AppContext = createContext<AppContextProps | undefined>(undefined);

const initialState: AppContextState = {
  currentStep: 'upload',
  file: null,
  processedData: null,
  processingResult: null,
  error: null,
  uploadStatus: 'idle',
  validationResult: null
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [state, setState] = useState<AppContextState>(initialState);

  const updateCurrentStep = useCallback((step: AppFlowState) => {
    setState(prev => ({
      ...prev,
      currentStep: step
    }));
  }, []);

  const updateProcessingResult = useCallback((result: ProcessingResult | null) => {
    setState(prev => ({
      ...prev,
      processingResult: result
    }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      error: error
    }));
  }, []);

  const resetState = useCallback(() => {
    setState(initialState);
  }, []);

  return (
    <AppContext.Provider 
      value={{
        state,
        setState,
        updateCurrentStep,
        updateProcessingResult,
        setError,
        resetState
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextProps => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export { AppContext };
