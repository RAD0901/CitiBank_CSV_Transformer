import { useState, useCallback } from 'react';
import type { FileUploadHook, ValidationResult } from '../types';
import { validateFile as validateCSVFile } from '../utils/fileValidator';

export const useFileUpload = (): FileUploadHook => {
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'validating' | 'ready' | 'error'>('idle');
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const validateFile = useCallback(async (file: File) => {
    setUploadStatus('validating');
    
    try {
      const result = await validateCSVFile(file);
      setValidationResult(result);
      
      if (result.isValid) {
        setUploadStatus('ready');
      } else {
        setUploadStatus('error');
      }
    } catch (error) {
      const errorResult: ValidationResult = {
        isValid: false,
        errors: [error instanceof Error ? error.message : 'Validation failed'],
        warnings: []
      };
      setValidationResult(errorResult);
      setUploadStatus('error');
    }
  }, []);

  const handleFileSelect = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) {
      clearFile();
      return;
    }

    const selectedFile = files[0];
    setFile(selectedFile);
    await validateFile(selectedFile);
  }, [validateFile]);

  const handleDragDrop = useCallback(async (files: FileList | null) => {
    await handleFileSelect(files);
  }, [handleFileSelect]);

  const clearFile = useCallback(() => {
    setFile(null);
    setUploadStatus('idle');
    setValidationResult(null);
  }, []);

  const isValid = uploadStatus === 'ready' && validationResult?.isValid === true;

  return {
    file,
    uploadStatus,
    validationResult,
    handleFileSelect,
    handleDragDrop,
    validateFile,
    clearFile,
    isValid
  };
};
