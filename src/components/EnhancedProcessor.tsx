import { useState, useCallback } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useCSVProcessor } from '../hooks/useCSVProcessor';
import { generateOutputCSV, downloadCSV, formatAmountForDisplay } from '../utils/csvTransformer';

// Shadcn UI components
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';

const EnhancedProcessor = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

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

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
    }
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragOver(false);
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* File Upload Section */}
      {!selectedFile && !isProcessing && !isComplete && (
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Upload CitiBank CSV File</CardTitle>
            <CardDescription>
              Select your CitiBank CSV export file to convert to Sage Bank Manager format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300 ${
                dragOver
                  ? 'border-primary bg-primary/5 scale-105'
                  : 'border-border hover:border-primary/50 hover:bg-muted/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <Upload className={`mx-auto h-12 w-12 text-muted-foreground mb-4 transition-transform ${dragOver ? 'scale-110' : ''}`} />
              <h3 className="text-lg font-medium mb-2">
                Drag and drop your file here
              </h3>
              <p className="text-muted-foreground mb-4">
                or click to browse for files
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
                id="file-input"
              />
              <Button asChild>
                <label htmlFor="file-input" className="cursor-pointer">
                  <FileText className="mr-2 h-4 w-4" />
                  Choose File
                </label>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File Selected Section */}
      {selectedFile && !isProcessing && !isComplete && (
        <Card className="animate-slide-up">
          <CardHeader>
            <CardTitle>File Selected</CardTitle>
            <CardDescription>Ready to process your CSV file</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="flex items-center">
                <FileText className="h-6 w-6 text-primary mr-3" />
                <div>
                  <p className="font-medium">{selectedFile.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Badge variant="secondary">CSV File</Badge>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleProcess} className="flex-1">
                <CheckCircle className="mr-2 h-4 w-4" />
                Process File
              </Button>
              <Button onClick={handleReset} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Processing Section */}
      {isProcessing && (
        <Card className="animate-scale-in">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Processing File
            </CardTitle>
            <CardDescription>Converting your CSV data...</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>{currentStep || 'Processing...'}</span>
                <span>{progress.percentage}%</span>
              </div>
              <Progress value={progress.percentage} className="w-full" />
            </div>
            
            <p className="text-sm text-muted-foreground">{progress.message}</p>
            
            {progress.currentRow && progress.totalRows && (
              <p className="text-sm text-muted-foreground">
                Processing row {progress.currentRow} of {progress.totalRows}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Results Section */}
      {isComplete && result && (
        <div className="space-y-6 animate-fade-in">
          <Alert className="animate-slide-up">
            <div className="flex items-center">
              {result.success ? (
                <CheckCircle className="h-4 w-4 text-green-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-red-600" />
              )}
              <AlertTitle className="ml-2">
                {result.success ? 'Processing Complete!' : 'Processing Failed'}
              </AlertTitle>
            </div>
            <AlertDescription className="mt-2">
              {result.success 
                ? 'Your CSV file has been successfully converted to Sage Bank Manager format.'
                : 'There was an error processing your CSV file. Please check the errors below.'}
            </AlertDescription>
          </Alert>

          {result.success && (
            <>
              {/* Statistics */}
              <Card className="animate-slide-up">
                <CardHeader>
                  <CardTitle>Processing Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                      <p className="text-2xl font-bold text-primary">
                        {result.statistics.totalRows}
                      </p>
                      <p className="text-sm text-muted-foreground">Total Rows</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                      <p className="text-2xl font-bold text-green-600">
                        {result.statistics.processedRows}
                      </p>
                      <p className="text-sm text-muted-foreground">Processed</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                      <p className="text-2xl font-bold text-yellow-600">
                        {result.statistics.metadataRows}
                      </p>
                      <p className="text-sm text-muted-foreground">Skipped</p>
                    </div>
                    <div className="text-center p-4 bg-muted rounded-lg hover:bg-muted/80 transition-colors">
                      <p className="text-2xl font-bold text-red-600">
                        {result.statistics.errorRows}
                      </p>
                      <p className="text-sm text-muted-foreground">Errors</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Data Preview */}
              {result.data.length > 0 && (
                <Card className="animate-scale-in">
                  <CardHeader>
                    <CardTitle>Data Preview</CardTitle>
                    <CardDescription>First 5 rows of converted data</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.data.slice(0, 5).map((row, index) => (
                          <TableRow key={index} className="hover:bg-muted/50 transition-colors">
                            <TableCell className="font-medium">{row.Date}</TableCell>
                            <TableCell>{row.Description}</TableCell>
                            <TableCell className="text-right">{formatAmountForDisplay(row.Amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 animate-slide-up">
                <Button onClick={handleDownload} className="flex-1 hover:scale-105 transition-transform">
                  <Download className="mr-2 h-4 w-4" />
                  Download Converted CSV
                </Button>
                <Button onClick={handleReset} variant="outline" className="hover:scale-105 transition-transform">
                  Process Another File
                </Button>
              </div>
            </>
          )}

          {/* Error Display */}
          {errors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Errors Found ({errors.length})</CardTitle>
                <CardDescription>Issues encountered during processing</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {errors.slice(0, 10).map((error, index) => (
                    <Alert key={index} variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Row {error.row}</AlertTitle>
                      <AlertDescription>
                        {error.message}
                        {error.field && (
                          <span className="block text-sm mt-1">Field: {error.field}</span>
                        )}
                      </AlertDescription>
                    </Alert>
                  ))}
                  {errors.length > 10 && (
                    <p className="text-sm text-muted-foreground text-center pt-2">
                      ... and {errors.length - 10} more errors
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedProcessor;
