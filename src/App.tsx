import { useCallback, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, AlertCircle, Settings, History, Upload } from 'lucide-react';
import ProgressIndicator from "./components/progress-indicator";
import FileUploadZone from "./components/file-upload-zone";
import ValidationMessage from "./components/validation-message";
import ActionButton from "./components/action-button";
import ProcessingStats from "./components/processing-stats";
import DataTable from "./components/data-table";
import DownloadButton from "./components/download-button";
import { SettingsPanel } from "./components/SettingsPanel";
import { HistoryPanel } from "./components/HistoryPanel";
import { useCSVProcessor } from './hooks/useCSVProcessor';
// import { useSettings } from './hooks/useSettings';
// import { useHistory } from './hooks/useHistory';
import { generateOutputCSV, downloadCSV } from './utils/csvTransformer';
import './App.css';

type FileState =
  | { status: "idle" }
  | { status: "valid"; file: File }
  | { status: "error"; message: string; tips?: string[] }

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function App() {
  const [fileState, setFileState] = useState<FileState>({ status: "idle" });
  const [currentStep, setCurrentStep] = useState(1);
  const [activeTab, setActiveTab] = useState("converter");
  const errorRef = useRef<HTMLDivElement | null>(null);
  const proceedButtonRef = useRef<HTMLButtonElement | null>(null);

  // const { generateFilename } = useSettings();
  // const { addSession } = useHistory();

  const {
    processFile,
    progress,
    currentStep: processingStep,
    result,
    errors,
    isProcessing,
    isComplete,
    reset: resetProcessor
  } = useCSVProcessor();

  const validateFile = useCallback((file: File): FileState => {
    const name = file.name.toLowerCase();
    const isCsv = name.endsWith(".csv");
    const sizeOk = file.size <= MAX_SIZE_BYTES;

    if (!isCsv && !sizeOk) {
      return {
        status: "error",
        message: "Invalid file type and size.",
        tips: [
          "Upload a .csv file exported from CitiBank.",
          "Ensure the file is 10MB or smaller.",
          "If you have an Excel file (.xlsx), export it as CSV first.",
        ],
      };
    }
    if (!isCsv) {
      return {
        status: "error",
        message: "Only CSV files are allowed.",
        tips: [
          "Upload a .csv file exported from CitiBank.",
          "If you have an Excel file (.xlsx), export it as CSV first.",
        ],
      };
    }
    if (!sizeOk) {
      return {
        status: "error",
        message: "File too large.",
        tips: ["Ensure the file is 10MB or smaller."],
      };
    }

    return { status: "valid", file };
  }, []);

  const reset = useCallback(() => {
    setFileState({ status: "idle" });
    setCurrentStep(1);
    resetProcessor();
  }, [resetProcessor]);

  const handleFileChange = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) {
        setFileState({ status: "idle" });
        return;
      }
      
      const file = files[0];
      const result = validateFile(file);
      setFileState(result);

      if (result.status === "error") {
        setTimeout(() => {
          errorRef.current?.focus();
        }, 0);
      } else if (result.status === "valid") {
        setTimeout(() => {
          proceedButtonRef.current?.focus();
        }, 0);
      }
    },
    [validateFile]
  );

  const successText = useMemo(() => {
    if (fileState.status !== "valid") return null;
    const { file } = fileState;
    return `${file.name} • ${formatBytes(file.size)}`;
  }, [fileState]);

  const onProceed = useCallback(async () => {
    if (fileState.status !== "valid") return;
    setCurrentStep(2);
    
    try {
      await processFile(fileState.file);
      setCurrentStep(isComplete ? 4 : 3);
    } catch (error) {
      console.error('Processing failed:', error);
    }
  }, [fileState, processFile, isComplete]);

  const handleDownload = useCallback(() => {
    if (!result?.data) return;
    
    const csvContent = generateOutputCSV(result.data);
    downloadCSV(csvContent);
    setCurrentStep(4);
  }, [result]);

  // Determine current step based on processing state
  const displayStep = useMemo(() => {
    if (isProcessing) return 2;
    if (isComplete && result?.success) return 3;
    return currentStep;
  }, [currentStep, isProcessing, isComplete, result]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8">
        <header className="text-center">
          <h1 className="text-2xl font-bold tracking-tight">CitiBank CSV Transformer</h1>
          <p className="text-sm text-slate-600 mt-2">
            Convert CitiBank CSV exports to Sage Bank Manager format
          </p>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="converter" className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span>Converter</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Settings</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <History className="h-4 w-4" />
              <span>History</span>
            </TabsTrigger>
          </TabsList>

          {/* Main Converter Tab */}
          <TabsContent value="converter" className="mt-6">
            <div className="flex flex-col gap-6 max-w-4xl mx-auto">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">
                    {displayStep === 1 && "Upload your statement to get started."}
                    {displayStep === 2 && "Processing your CSV file..."}
                    {displayStep === 3 && "Review and download your converted file."}
                    {displayStep === 4 && "Processing complete!"}
                  </p>
                </div>
                <ProgressIndicator current={displayStep} total={4} />
              </div>

        {/* Step 1: File Upload */}
        {displayStep === 1 && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Upload CSV</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUploadZone
                acceptExtensions={[".csv"]}
                maxSizeBytes={MAX_SIZE_BYTES}
                onFileAccepted={(file) => {
                  const fileList = new DataTransfer();
                  fileList.items.add(file);
                  handleFileChange(fileList.files);
                }}
                onError={(message, tips) => setFileState({ status: "error", message, tips })}
                description="Drag & drop your CitiBank CSV here"
                hint="or"
              >
                <Button variant="outline" size="sm">
                  Browse files
                </Button>
                <p className="text-xs text-slate-500 mt-2">
                  We accept .csv files up to 10MB
                </p>
                <p className="sr-only" aria-live="polite">
                  Accepted file type: .csv. Maximum size: 10 megabytes.
                </p>
              </FileUploadZone>

              {fileState.status === "valid" && (
                <ValidationMessage
                  variant="success"
                  icon={<CheckCircle2 className="h-5 w-5" aria-hidden="true" />}
                  title="File ready"
                  message={successText ?? ""}
                  ariaLive="polite"
                />
              )}

              {fileState.status === "error" && (
                <ValidationMessage
                  ref={errorRef}
                  variant="error"
                  icon={<AlertCircle className="h-5 w-5" aria-hidden="true" />}
                  title="There was a problem with your file"
                  message={fileState.message}
                  tips={fileState.tips}
                  ariaLive="assertive"
                  focusable
                />
              )}

              <div className="flex items-center justify-between pt-2">
                <Button
                  variant="ghost"
                  className="text-slate-600 hover:text-slate-900"
                  onClick={reset}
                  aria-label="Reset selected file"
                >
                  Reset
                </Button>
                <ActionButton
                  ref={proceedButtonRef}
                  disabled={fileState.status !== "valid"}
                  onClick={onProceed}
                  label="Process File"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Processing */}
        {displayStep === 2 && isProcessing && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Processing File</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ProcessingStats
                processed={progress.currentRow || 0}
                total={progress.totalRows || 0}
                errors={errors.length}
                loading={isProcessing}
              />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{processingStep || 'Processing...'}</span>
                  <span>{progress.percentage}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress.percentage}%` }}
                  />
                </div>
                <p className="text-sm text-slate-600">{progress.message}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Results and Download */}
        {displayStep === 3 && isComplete && result && (
          <div className="space-y-6">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Processing Complete</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {result.success && (
                  <>
                    <ProcessingStats
                      processed={result.statistics.processedRows}
                      total={result.statistics.totalRows}
                      errors={result.statistics.errorRows}
                      loading={false}
                    />

                    {result.data.length > 0 && (
                      <div>
                        <h4 className="text-md font-medium text-slate-900 mb-2">
                          Data Preview (First 5 rows)
                        </h4>
                        <DataTable
                          columns={[
                            { key: 'Date', header: 'Date' },
                            { key: 'Description', header: 'Description' },
                            { key: 'Amount', header: 'Amount', align: 'right' }
                          ]}
                          rows={result.data.slice(0, 5)}
                        />
                      </div>
                    )}

                    <div className="flex gap-3 pt-4">
                      <DownloadButton
                        status="idle"
                        label="Download Converted CSV"
                        onClick={handleDownload}
                        className="flex-1"
                      />
                      <Button onClick={reset} variant="outline">
                        Process Another File
                      </Button>
                    </div>
                  </>
                )}

                {!result.success && (
                  <ValidationMessage
                    variant="error"
                    icon={<AlertCircle className="h-5 w-5" aria-hidden="true" />}
                    title="Processing Failed"
                    message="There was an error processing your CSV file."
                    tips={errors.slice(0, 3).map(e => e.message)}
                    ariaLive="assertive"
                  />
                )}
              </CardContent>
            </Card>
          </div>
        )}
            </div>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-6">
            <div className="flex justify-center">
              <SettingsPanel />
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="mt-6">
            <div className="flex justify-center">
              <HistoryPanel />
            </div>
          </TabsContent>
        </Tabs>

        <footer className="text-center text-xs text-slate-500">
          We never store your files. Your data is processed securely.
        </footer>
      </div>
    </main>
  );
}

function formatBytes(bytes: number, decimals = 1) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export default App;
