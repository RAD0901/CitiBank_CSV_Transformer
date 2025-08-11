import { useState, useCallback } from 'react';
import type { 
  ProcessingResult, 
  ProcessingProgress, 
  ValidationError,
  ProcessingStageType,
  CSVProcessorHook 
} from '../types';
import { processCSVData } from '../utils/csvTransformer';
import { validateFile, validateCSVStructure } from '../utils/fileValidator';
import { PROCESSING_STEPS, PROGRESS_THRESHOLDS } from '../utils/constants';
import { ProcessingStage } from '../types';

/**
 * Custom hook for processing CSV files with progress tracking
 */
export function useCSVProcessor(): CSVProcessorHook {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [currentStep, setCurrentStep] = useState<ProcessingStageType | null>(null);
  const [progress, setProgress] = useState<ProcessingProgress>({
    step: '',
    percentage: 0,
    message: '',
    currentRow: 0,
    totalRows: 0
  });
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);

  /**
   * Updates processing progress
   */
  const updateProgress = useCallback((
    step: ProcessingStageType,
    percentage: number,
    message: string,
    currentRow?: number,
    totalRows?: number
  ) => {
    setCurrentStep(step);
    setProgress({
      step,
      percentage,
      message,
      currentRow,
      totalRows
    });
  }, []);

  /**
   * Resets all processing state
   */
  const reset = useCallback(() => {
    setIsProcessing(false);
    setIsComplete(false);
    setCurrentStep(null);
    setProgress({
      step: '',
      percentage: 0,
      message: '',
      currentRow: 0,
      totalRows: 0
    });
    setResult(null);
    setErrors([]);
  }, []);

  /**
   * Processes a CSV file through all stages
   */
  const processFile = useCallback(async (file: File): Promise<void> => {
    try {
      // Reset state
      reset();
      setIsProcessing(true);

      // Stage 1: File Validation
      updateProgress(
        ProcessingStage.PARSING,
        PROGRESS_THRESHOLDS.PARSING,
        PROCESSING_STEPS.PARSING
      );

      // Validate file basic properties
      const fileValidation = validateFile(file);
      if (!fileValidation.isValid) {
        const validationErrors: ValidationError[] = fileValidation.errors.map((error) => ({
          row: 0,
          field: 'file',
          value: file.name,
          message: error
        }));
        setErrors(validationErrors);
        setIsProcessing(false);
        return;
      }

      // Read file content
      const csvContent = await readFileContent(file);

      // Validate CSV structure
      const structureValidation = validateCSVStructure(csvContent);
      if (!structureValidation.isValid) {
        const structureErrors: ValidationError[] = structureValidation.errors.map((error) => ({
          row: 0,
          field: 'structure',
          value: '',
          message: error
        }));
        setErrors(structureErrors);
        setIsProcessing(false);
        return;
      }

      // Stage 2: Finding Transaction Data
      updateProgress(
        ProcessingStage.FINDING,
        PROGRESS_THRESHOLDS.FINDING,
        PROCESSING_STEPS.FINDING
      );

      // Small delay to show progress
      await new Promise(resolve => setTimeout(resolve, 200));

      // Stage 3: Transforming Data
      updateProgress(
        ProcessingStage.TRANSFORMING,
        PROGRESS_THRESHOLDS.TRANSFORMING,
        PROCESSING_STEPS.TRANSFORMING
      );

      // Process the CSV data
      const processingResult = processCSVData(csvContent);

      // Stage 4: Generating Output
      updateProgress(
        ProcessingStage.GENERATING,
        PROGRESS_THRESHOLDS.GENERATING,
        PROCESSING_STEPS.GENERATING
      );

      // Small delay to show final stage
      await new Promise(resolve => setTimeout(resolve, 200));

      // Set final results
      setResult(processingResult);
      setErrors(processingResult.errors);
      setIsProcessing(false);
      setIsComplete(true);

      // Final progress update
      if (processingResult.success) {
        updateProgress(
          ProcessingStage.GENERATING,
          100,
          `Successfully processed ${processingResult.data.length} transactions`,
          processingResult.data.length,
          processingResult.statistics.totalRows
        );
      } else {
        updateProgress(
          ProcessingStage.GENERATING,
          100,
          `Processing failed with ${processingResult.errors.length} errors`,
          0,
          processingResult.statistics.totalRows
        );
      }

    } catch (error) {
      const processingError: ValidationError = {
        row: 0,
        field: 'processing',
        value: '',
        message: `Unexpected error: ${error}`
      };
      
      setErrors([processingError]);
      setIsProcessing(false);
      setIsComplete(false);
      
      updateProgress(
        ProcessingStage.PARSING,
        0,
        'Processing failed'
      );
    }
  }, [updateProgress, reset]);

  return {
    processFile,
    progress,
    currentStep,
    result,
    errors,
    isProcessing,
    isComplete,
    reset
  };
}

/**
 * Reads file content as text
 */
function readFileContent(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target?.result as string;
      resolve(content);
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}
