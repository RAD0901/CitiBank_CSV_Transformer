"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import FileQueue from "@/components/advanced/file-queue"
import SettingsPanel, { type AdvancedSettings } from "@/components/advanced/settings-panel"
import ErrorDashboard, { type ErrorItem } from "@/components/advanced/error-dashboard"
import HistoryPanel from "@/components/advanced/history-panel"
import HelpSystem from "@/components/advanced/help-system"
import ThemeToggle from "@/components/advanced/theme-toggle"
import KeyboardShortcuts from "@/components/advanced/keyboard-shortcuts"
import { Layers, Settings, History, HelpCircle } from 'lucide-react'

export default function AdvancedPage() {
  const [settings, setSettings] = useState<AdvancedSettings>({
    dateFormat: "DD/MM/YYYY",
    rounding: "round",
    errorStrategy: "skip",
    filenameTemplate: "sage_bank_import_{YYYY}-{MM}-{DD}_{HH}{mm}{ss}.csv",
    strictness: "normal",
    batchSize: 2,
  })
  const [errors, setErrors] = useState<ErrorItem[]>([])

  const onErrorsUpdate = (items: ErrorItem[]) => setErrors(items)
  const onSettingsChange = (next: AdvancedSettings) => setSettings(next)

  const tabs = useMemo(
    () => [
      { key: "queue", label: "Queue", icon: Layers },
      { key: "settings", label: "Settings", icon: Settings },
      { key: "history", label: "History", icon: History },
      { key: "help", label: "Help", icon: HelpCircle },
    ],
    []
  )

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Enterprise CSV Transformer</h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">Batch process, customize, and manage your transformations.</p>
          </div>
          <div className="flex items-center gap-2">
            <KeyboardShortcuts />
            <ThemeToggle />
          </div>
        </header>

        <Card className="border-slate-200 shadow-sm dark:border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Workspace</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="queue" className="w-full">
              <TabsList className="flex w-full items-center gap-2 overflow-x-auto">
                {tabs.map((t) => {
                  const Icon = t.icon
                  return (
                    <TabsTrigger key={t.key} value={t.key} className="gap-2">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {t.label}
                    </TabsTrigger>
                  )
                })}
              </TabsList>

              <TabsContent value="queue" className="mt-4">
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-2 space-y-4">
                    <FileQueue settings={settings} onErrorsUpdate={onErrorsUpdate} />
                  </div>
                  <div className="space-y-4">
                    <SettingsPanel value={settings} onChange={onSettingsChange} />
                  </div>
                </div>

                <Separator className="my-6" />

                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <ErrorDashboard items={errors} />
                  </div>
                  <div className="space-y-4">
                    <HelpSystem />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="mt-4">
                <div className="max-w-3xl">
                  <SettingsPanel value={settings} onChange={onSettingsChange} expanded />
                </div>
              </TabsContent>

              <TabsContent value="history" className="mt-4">
                <HistoryPanel />
              </TabsContent>

              <TabsContent value="help" className="mt-4">
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <HelpSystem expanded />
                  </div>
                  <div>
                    <ErrorDashboard items={errors} compact />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
