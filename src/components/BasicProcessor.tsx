import { useState, useCallback } from 'react';
import { Download, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useCSVProcessor } from '../hooks/useCSVProcessor';
import { generateOutputCSV, downloadCSV } from '../utils/csvTransformer';
import FileUploadZone from './file-upload-zone';
import ProcessingStats from './processing-stats';

const BasicProcessor = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const {
    processFile,
    progress,
    currentStep,
    result,
    errors,
    isProcessing,
    isComplete,
    reset
  } = useCSVProcessor();

  const handleFileAccepted = useCallback((file: File) => {
    setSelectedFile(file);
  }, []);

  const handleFileError = useCallback((message: string) => {
    console.error('File error:', message);
  }, []);

  const handleProcess = useCallback(async () => {
    if (selectedFile) {
      await processFile(selectedFile);
    }
  }, [selectedFile, processFile]);

  const handleDownload = useCallback(() => {
    if (!result?.data) return;

    const csvContent = generateOutputCSV(result.data);
    downloadCSV(csvContent);
  }, [result?.data]);

  const handleReset = useCallback(() => {
    setSelectedFile(null);
    reset();
  }, [reset]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* File Upload Section */}
      {!selectedFile && !isProcessing && !isComplete && (
        <FileUploadZone
          acceptExtensions={['.csv']}
          maxSizeBytes={10 * 1024 * 1024}
          onFileAccepted={handleFileAccepted}
          onError={handleFileError}
          description="Drag & drop your CitiBank CSV file here"
          hint="Supports CSV files up to 10MB"
        />
      )}

      {/* File Selected Section */}
      {selectedFile && !isProcessing && !isComplete && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            File Selected
          </h3>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg mb-4">
            <div className="flex items-center">
              <FileText className="h-6 w-6 text-blue-600 mr-3" />
              <div>
                <p className="font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-sm text-gray-600">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Remove
            </button>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleProcess}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Process File
            </button>
            <button
              onClick={handleReset}
              className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Processing Section */}
      {isProcessing && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Processing File
          </h3>
          <div className="space-y-4">
            <div className="flex items-center">
              <Loader2 className="h-5 w-5 text-blue-600 animate-spin mr-3" />
              <span className="text-sm font-medium text-gray-900">
                {currentStep || 'Processing...'}
              </span>
            </div>
            
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress.percentage}%` }}
              />
            </div>
            
            <p className="text-sm text-gray-600">{progress.message}</p>
            
            {progress.currentRow && progress.totalRows && (
              <p className="text-sm text-gray-500">
                Row {progress.currentRow} of {progress.totalRows}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Results Section */}
      {isComplete && result && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center mb-4">
            {result.success ? (
              <CheckCircle className="h-6 w-6 text-green-600 mr-3" />
            ) : (
              <AlertCircle className="h-6 w-6 text-red-600 mr-3" />
            )}
            <h3 className="text-lg font-medium text-gray-900">
              {result.success ? 'Processing Complete' : 'Processing Failed'}
            </h3>
          </div>

          {result.success && (
            <div className="space-y-4">
              <ProcessingStats
                processed={result.statistics.processedRows}
                total={result.statistics.totalRows}
                errors={result.statistics.errorRows}
              />

              {result.data.length > 0 && (
                <div>
                  <h4 className="text-md font-medium text-gray-900 mb-2">
                    Preview (First 5 rows)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {result.data.slice(0, 5).map((row, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row.Date}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row.Description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {row.Amount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleDownload}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download CSV
                </button>
                <button
                  onClick={handleReset}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Process Another File
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {errors.length > 0 && (
            <div className="mt-4">
              <h4 className="text-md font-medium text-red-900 mb-2">
                Errors ({errors.length})
              </h4>
              <div className="max-h-40 overflow-y-auto space-y-2">
                {errors.slice(0, 10).map((error, index) => (
                  <div key={index} className="text-sm p-2 bg-red-50 border border-red-200 rounded">
                    <span className="font-medium">Row {error.row}:</span> {error.message}
                    {error.field && (
                      <span className="text-red-600"> (Field: {error.field})</span>
                    )}
                  </div>
                ))}
                {errors.length > 10 && (
                  <p className="text-sm text-gray-600">
                    ... and {errors.length - 10} more errors
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BasicProcessor;
