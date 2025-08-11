import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useHistory } from '@/hooks/useHistory';
import { type ProcessingSession } from '@/utils/localStorage';
import { 
  History, 
  Search, 
  Trash2, 
  Download, 
  Eye, 
  Clock, 
  FileText, 
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Calendar
} from 'lucide-react';

export function HistoryPanel() {
  const {
    history,
    removeSession,
    clearHistory,
    getHistoryStats,
    searchSessions,
  } = useHistory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSession, setSelectedSession] = useState<ProcessingSession | null>(null);

  const filteredSessions = searchQuery.trim() 
    ? searchSessions(searchQuery) 
    : history;

  const stats = getHistoryStats();

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const getStatusColor = (session: ProcessingSession) => {
    if (session.statistics.errorRows > 0) return 'destructive';
    if (session.statistics.warningRows > 0) return 'secondary';
    return 'default';
  };

  const getStatusIcon = (session: ProcessingSession) => {
    if (session.statistics.errorRows > 0) return <AlertCircle className="h-4 w-4" />;
    return <CheckCircle2 className="h-4 w-4" />;
  };

  const handleRedownload = (session: ProcessingSession) => {
    // This would trigger a re-download of the processed file
    // In a real implementation, you'd need to store the processed data
    // or have a way to regenerate it from the original file
    console.log('Re-download not implemented yet for session:', session.id);
  };

  return (
    <Card className="w-full max-w-6xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <CardTitle>Processing History</CardTitle>
            <Badge variant="secondary">{history.length} sessions</Badge>
          </div>
          {history.length > 0 && (
            <Button
              onClick={clearHistory}
              variant="destructive"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Statistics Overview */}
        {history.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-3">
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Files</p>
                  <p className="text-lg font-semibold">{stats.totalFilesProcessed}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-3">
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Rows</p>
                  <p className="text-lg font-semibold">{stats.totalRowsProcessed.toLocaleString()}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-3">
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Avg. Time</p>
                  <p className="text-lg font-semibold">{formatDuration(stats.averageProcessingTime)}</p>
                </div>
              </div>
            </Card>
            
            <Card className="p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Errors</p>
                  <p className="text-lg font-semibold">{stats.totalErrors}</p>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Search */}
        {history.length > 0 && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by filename..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        )}

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <div className="text-center py-8">
            <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No processing history</h3>
            <p className="text-muted-foreground">
              {searchQuery.trim() 
                ? 'No sessions match your search.' 
                : 'Process some files to see your history here.'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSessions.map((session) => (
              <Card key={session.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium">{session.originalFilename}</h4>
                      <Badge variant={getStatusColor(session)}>
                        {getStatusIcon(session)}
                        {session.statistics.errorRows > 0 
                          ? `${session.statistics.errorRows} errors`
                          : 'Success'
                        }
                      </Badge>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(session.timestamp)}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDuration(session.statistics.processingTime)}</span>
                      </div>
                      <span>{session.statistics.processedRows} rows processed</span>
                      <span>{formatFileSize(session.originalFileSize)} → {formatFileSize(session.outputFileSize)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSession(session)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Session Details</DialogTitle>
                        </DialogHeader>
                        {selectedSession && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">File Information</h4>
                                <div className="space-y-1 text-sm">
                                  <p><strong>Original:</strong> {selectedSession.originalFilename}</p>
                                  <p><strong>Output:</strong> {selectedSession.outputFilename}</p>
                                  <p><strong>Original Size:</strong> {formatFileSize(selectedSession.originalFileSize)}</p>
                                  <p><strong>Output Size:</strong> {formatFileSize(selectedSession.outputFileSize)}</p>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Processing Statistics</h4>
                                <div className="space-y-1 text-sm">
                                  <p><strong>Total Rows:</strong> {selectedSession.statistics.totalRows}</p>
                                  <p><strong>Processed:</strong> {selectedSession.statistics.processedRows}</p>
                                  <p><strong>Errors:</strong> {selectedSession.statistics.errorRows}</p>
                                  <p><strong>Warnings:</strong> {selectedSession.statistics.warningRows}</p>
                                  <p><strong>Processing Time:</strong> {formatDuration(selectedSession.statistics.processingTime)}</p>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium mb-2">Settings Used</h4>
                              <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                  <p><strong>Date Format:</strong> {selectedSession.settings.dateFormat}</p>
                                  <p><strong>Amount Rounding:</strong> {selectedSession.settings.amountRounding}</p>
                                </div>
                                <div>
                                  <p><strong>Error Handling:</strong> {selectedSession.settings.errorHandling}</p>
                                  <p><strong>Filename Template:</strong> {selectedSession.settings.filenameTemplate}</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRedownload(session)}
                      disabled
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Re-download
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeSession(session.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
