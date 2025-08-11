import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useSettings } from '@/hooks/useSettings';
import { getStorageUsage } from '@/utils/localStorage';
import { Settings, Download, Upload, RotateCcw, HardDrive } from 'lucide-react';

export function SettingsPanel() {
  const {
    settings,
    updateSetting,
    resetSettings,
    exportSettings,
    importSettings,
    generateFilename,
    isDirty,
  } = useSettings();
  
  const [importText, setImportText] = useState('');
  const [showImportSuccess, setShowImportSuccess] = useState(false);
  const [showImportError, setShowImportError] = useState(false);

  const storageUsage = getStorageUsage();
  const storagePercentage = (storageUsage.used / storageUsage.available) * 100;

  const handleExport = () => {
    const settingsJson = exportSettings();
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'citibank-transformer-settings.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const success = importSettings(importText);
    if (success) {
      setShowImportSuccess(true);
      setImportText('');
      setTimeout(() => setShowImportSuccess(false), 3000);
    } else {
      setShowImportError(true);
      setTimeout(() => setShowImportError(false), 3000);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setImportText(text);
    };
    reader.readAsText(file);
  };

  const previewFilename = generateFilename('sample-citibank-export.csv');

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader className="flex flex-row items-center space-y-0 pb-4">
        <div className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <CardTitle>Advanced Settings</CardTitle>
        </div>
        {isDirty && (
          <div className="ml-auto">
            <span className="text-sm text-muted-foreground">Changes saved automatically</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="processing" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="processing">Processing</TabsTrigger>
            <TabsTrigger value="output">Output</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          {/* Processing Settings */}
          <TabsContent value="processing" className="space-y-6">
            <div className="grid gap-6">
              <div className="space-y-3">
                <Label htmlFor="date-format">Date Format</Label>
                <Select
                  value={settings.dateFormat}
                  onValueChange={(value: 'DD/MM/YYYY' | 'MM/DD/YYYY') => 
                    updateSetting('dateFormat', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DD/MM/YYYY">DD/MM/YYYY (UK/EU format)</SelectItem>
                    <SelectItem value="MM/DD/YYYY">MM/DD/YYYY (US format)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Output date format for converted transactions
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="amount-rounding">Amount Rounding</Label>
                <Select
                  value={settings.amountRounding}
                  onValueChange={(value: 'round' | 'truncate') => 
                    updateSetting('amountRounding', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="round">Round to nearest integer</SelectItem>
                    <SelectItem value="truncate">Truncate decimal places</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  How to handle decimal amounts in transactions
                </p>
              </div>

              <div className="space-y-3">
                <Label htmlFor="error-handling">Error Handling</Label>
                <Select
                  value={settings.errorHandling}
                  onValueChange={(value: 'skip' | 'stop') => 
                    updateSetting('errorHandling', value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">Skip invalid rows and continue</SelectItem>
                    <SelectItem value="stop">Stop processing on first error</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  What to do when encountering invalid data
                </p>
              </div>
            </div>
          </TabsContent>

          {/* Output Settings */}
          <TabsContent value="output" className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="filename-template">Filename Template</Label>
              <Input
                id="filename-template"
                value={settings.filenameTemplate}
                onChange={(e) => updateSetting('filenameTemplate', e.target.value)}
                placeholder="{originalName}_sage_{date}"
              />
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Available variables:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li><code>{'{originalName}'}</code> - Original filename without extension</li>
                  <li><code>{'{date}'}</code> - Current date (YYYY-MM-DD)</li>
                  <li><code>{'{time}'}</code> - Current time (HH-MM-SS)</li>
                  <li><code>{'{datetime}'}</code> - Date and time combined</li>
                </ul>
                <p className="mt-2">Preview: <code>{previewFilename}</code></p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="auto-download"
                checked={settings.autoDownload}
                onCheckedChange={(checked) => updateSetting('autoDownload', checked)}
              />
              <Label htmlFor="auto-download">Auto-download processed files</Label>
            </div>
          </TabsContent>

          {/* Preferences */}
          <TabsContent value="preferences" className="space-y-6">
            <div className="space-y-3">
              <Label htmlFor="theme">Theme</Label>
              <Select
                value={settings.theme}
                onValueChange={(value: 'light' | 'dark') => 
                  updateSetting('theme', value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="show-advanced-stats"
                checked={settings.showAdvancedStats}
                onCheckedChange={(checked) => updateSetting('showAdvancedStats', checked)}
              />
              <Label htmlFor="show-advanced-stats">Show advanced processing statistics</Label>
            </div>
          </TabsContent>

          {/* Data Management */}
          <TabsContent value="data" className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Storage Usage</Label>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Used: {(storageUsage.used / 1024).toFixed(1)} KB</span>
                    <span>{storagePercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <HardDrive className="h-4 w-4 mr-1" />
                  Local browser storage
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Button onClick={handleExport} variant="outline" className="flex-1">
                    <Download className="h-4 w-4 mr-2" />
                    Export Settings
                  </Button>
                  <Button onClick={resetSettings} variant="outline" className="flex-1">
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Reset to Defaults
                  </Button>
                </div>

                <div className="space-y-3">
                  <Label>Import Settings</Label>
                  <div className="space-y-2">
                    <Input
                      type="file"
                      accept=".json"
                      onChange={handleFileImport}
                      className="file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-sm file:bg-primary file:text-primary-foreground"
                    />
                    <Textarea
                      placeholder="Or paste settings JSON here..."
                      value={importText}
                      onChange={(e) => setImportText(e.target.value)}
                      rows={4}
                    />
                    <Button 
                      onClick={handleImport} 
                      disabled={!importText.trim()}
                      className="w-full"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Import Settings
                    </Button>
                  </div>
                  
                  {showImportSuccess && (
                    <p className="text-sm text-green-600">Settings imported successfully!</p>
                  )}
                  {showImportError && (
                    <p className="text-sm text-red-600">Invalid settings format. Please check your JSON.</p>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
