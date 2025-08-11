import { useState, useCallback } from 'react';
import type { ProgressTrackingHook, ProcessingProgress, ProcessingStageType } from '../types';
import { ProcessingStage } from '../types';

const PROCESSING_STEPS: ProcessingStageType[] = [
  ProcessingStage.PARSING,
  ProcessingStage.FINDING,
  ProcessingStage.TRANSFORMING,
  ProcessingStage.GENERATING
];

export const useProgressTracking = (): ProgressTrackingHook => {
  const [progress, setProgress] = useState<ProcessingProgress>({
    step: 'Initializing',
    percentage: 0,
    message: 'Ready to process'
  });
  
  const [currentStep, setCurrentStep] = useState<ProcessingStageType | null>(null);
  const [stepIndex, setStepIndex] = useState<number>(-1);

  const updateProgress = useCallback((
    stage: ProcessingStageType, 
    percentage: number, 
    message: string,
    currentRow?: number,
    totalRows?: number
  ) => {
    setCurrentStep(stage);
    setProgress({
      step: stage,
      percentage: Math.min(100, Math.max(0, percentage)),
      message,
      currentRow,
      totalRows
    });
    
    // Update step index
    const newIndex = PROCESSING_STEPS.indexOf(stage);
    if (newIndex !== -1) {
      setStepIndex(newIndex);
    }
  }, []);

  const nextStep = useCallback(() => {
    const nextIndex = stepIndex + 1;
    if (nextIndex < PROCESSING_STEPS.length) {
      const nextStage = PROCESSING_STEPS[nextIndex];
      updateProgress(nextStage, 0, `Starting ${nextStage.toLowerCase()}...`);
    }
  }, [stepIndex, updateProgress]);

  const reset = useCallback(() => {
    setProgress({
      step: 'Initializing',
      percentage: 0,
      message: 'Ready to process'
    });
    setCurrentStep(null);
    setStepIndex(-1);
  }, []);

  const isComplete = progress.percentage === 100 && currentStep === ProcessingStage.GENERATING;
  
  const stepMessage = currentStep 
    ? `${currentStep}: ${progress.message}` 
    : progress.message;

  return {
    progress,
    currentStep,
    stepMessage,
    updateProgress,
    nextStep,
    reset,
    isComplete
  };
};
