"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { saveTemplate, loadTemplates } from "@/lib/enterprise-storage"
import { Save, Download, Settings2 } from 'lucide-react'

export type AdvancedSettings = {
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY"
  rounding: "round" | "truncate"
  errorStrategy: "skip" | "stop" | "fix"
  filenameTemplate: string
  strictness: "lenient" | "normal" | "strict"
  batchSize: number
}

export default function SettingsPanel({
  value,
  onChange,
  expanded = false,
}: {
  value: AdvancedSettings
  onChange: (next: AdvancedSettings) => void
  expanded?: boolean
}) {
  const [local, setLocal] = useState<AdvancedSettings>(value)
  useEffect(() => setLocal(value), [value])

  const [templateName, setTemplateName] = useState("")
  const [templates, setTemplates] = useState<{ name: string; settings: AdvancedSettings }[]>([])

  useEffect(() => setTemplates(loadTemplates()), [])

  const onSaveTemplate = () => {
    if (!templateName.trim()) return
    saveTemplate(templateName.trim(), local)
    setTemplates(loadTemplates())
    setTemplateName("")
  }

  const header = useMemo(
    () => (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4" aria-hidden="true" />
          <span>Advanced settings</span>
        </div>
        <div className="text-xs text-slate-500">Templates, output, validation</div>
      </div>
    ),
    []
  )

  return (
    <Card className="border-slate-200 shadow-sm dark:border-slate-800">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{header}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Accordion type="multiple" defaultValue={expanded ? ["formatting","errors","output","performance","templates"] : ["formatting","output"]}>
          <AccordionItem value="formatting">
            <AccordionTrigger>Date and amount</AccordionTrigger>
            <AccordionContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="dateFormat">Date format</Label>
                  <Select
                    value={local.dateFormat}
                    onValueChange={(v: any) => setLocal((p) => ({ ...p, dateFormat: v }))}
                  >
                    <SelectTrigger id="dateFormat"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="rounding">Amount rule</Label>
                  <Select
                    value={local.rounding}
                    onValueChange={(v: any) => setLocal((p) => ({ ...p, rounding: v }))}
                  >
                    <SelectTrigger id="rounding"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="round">Round</SelectItem>
                      <SelectItem value="truncate">Truncate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="errors">
            <AccordionTrigger>Error handling</AccordionTrigger>
            <AccordionContent className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="strategy">Strategy</Label>
                <Select
                  value={local.errorStrategy}
                  onValueChange={(v: any) => setLocal((p) => ({ ...p, errorStrategy: v }))}
                >
                  <SelectTrigger id="strategy"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skip">Skip bad rows</SelectItem>
                    <SelectItem value="stop">Stop on error</SelectItem>
                    <SelectItem value="fix">Attempt auto-fix</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <Label>Strict validation</Label>
                  <div className="text-xs text-slate-500">Stricter checks catch more issues but may slow processing.</div>
                </div>
                <Switch
                  checked={local.strictness !== "lenient"}
                  onCheckedChange={(v) => setLocal((p) => ({ ...p, strictness: v ? "strict" : "lenient" }))}
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="output">
            <AccordionTrigger>Output & filename</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div>
                <Label htmlFor="template">Filename template</Label>
                <Input
                  id="template"
                  value={local.filenameTemplate}
                  onChange={(e) => setLocal((p) => ({ ...p, filenameTemplate: e.target.value }))}
                  placeholder="sage_bank_import_{YYYY}-{MM}-{DD}_{HH}{mm}{ss}.csv"
                />
                <div className="mt-1 text-xs text-slate-500">Placeholders: {'{YYYY} {MM} {DD} {HH} {mm} {ss}'}</div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="performance">
            <AccordionTrigger>Performance</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div>
                <Label>Batch size</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[local.batchSize]}
                    min={1}
                    max={5}
                    step={1}
                    onValueChange={([v]) => setLocal((p) => ({ ...p, batchSize: v }))}
                    className="max-w-[240px]"
                  />
                  <span className="text-sm font-medium">{local.batchSize}</span>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="templates">
            <AccordionTrigger>Templates</AccordionTrigger>
            <AccordionContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Template name"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                />
                <Button onClick={onSaveTemplate} className="gap-2">
                  <Save className="h-4 w-4" aria-hidden="true" />
                  Save
                </Button>
              </div>
              <div className="space-y-2">
                {templates.length === 0 ? (
                  <div className="text-sm text-slate-500">No templates saved yet.</div>
                ) : (
                  templates.map((t) => (
                    <div key={t.name} className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2 ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800">
                      <div>
                        <div className="text-sm font-medium">{t.name}</div>
                        <div className="text-xs text-slate-500">{t.settings.filenameTemplate}</div>
                      </div>
                      <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => {
                          setLocal(t.settings)
                          onChange(t.settings)
                        }}
                      >
                        <Download className="h-4 w-4" aria-hidden="true" />
                        Load
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={() => setLocal(value)}>Reset</Button>
          <Button onClick={() => onChange(local)} className="bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-600">
            Apply
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
