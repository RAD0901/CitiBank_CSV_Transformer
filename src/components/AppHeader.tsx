import { FileSpreadsheet, Zap, Shield, Download } from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';

const AppHeader = () => {
  return (
    <div className="text-center mb-12">
      <div className="flex justify-center mb-6">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse"></div>
          <div className="relative bg-primary/10 p-4 rounded-full">
            <FileSpreadsheet className="h-12 w-12 text-primary" />
          </div>
        </div>
      </div>
      
      <h1 className="text-5xl font-bold text-foreground mb-4 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
        CitiBank CSV Transformer
      </h1>
      
      <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
        Seamlessly convert CitiBank CSV exports to Sage Bank Manager format with professional-grade processing
      </p>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
        <Card className="border-muted">
          <CardContent className="p-4 text-center">
            <Zap className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">Lightning Fast</p>
            <p className="text-xs text-muted-foreground">Process thousands of rows in seconds</p>
          </CardContent>
        </Card>
        
        <Card className="border-muted">
          <CardContent className="p-4 text-center">
            <Shield className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">Data Secure</p>
            <p className="text-xs text-muted-foreground">All processing happens locally in your browser</p>
          </CardContent>
        </Card>
        
        <Card className="border-muted">
          <CardContent className="p-4 text-center">
            <Download className="h-6 w-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-medium">Instant Download</p>
            <p className="text-xs text-muted-foreground">Get your converted CSV immediately</p>
          </CardContent>
        </Card>
      </div>

      {/* Supported formats */}
      <div className="mt-8 flex justify-center gap-2">
        <Badge variant="secondary">CitiBank CSV</Badge>
        <span className="text-muted-foreground">→</span>
        <Badge variant="default">Sage Bank Manager</Badge>
      </div>
    </div>
  );
};

export default AppHeader;
