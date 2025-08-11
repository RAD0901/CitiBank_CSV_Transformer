"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from 'lucide-react'

type Props = {
  children: React.ReactNode
}

type State = {
  hasError: boolean
  error?: Error
}

export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("Processing UI error:", error, info)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="mx-auto my-16 max-w-xl rounded-lg border border-red-200 bg-red-50 p-6 text-red-800 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300" role="alert" aria-live="assertive" tabIndex={-1}>
          <div className="mb-3 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" aria-hidden="true" />
            <h2 className="text-lg font-semibold">Something went wrong</h2>
          </div>
          <p className="text-sm">
            The processing interface encountered an unexpected error. Please try again.
          </p>
          <div className="mt-4">
            <Button onClick={this.handleReset}>Reload UI</Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
