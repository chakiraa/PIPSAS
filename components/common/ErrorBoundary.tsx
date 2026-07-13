"use client";

import { Component, type ReactNode } from "react";

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

/**
 * Small render-error boundary, ported from the legacy PIP app's
 * `ErrorBoundary` class component. Used to wrap each EmailCard so a bad
 * template doesn't take down the whole InlineEmailPanel.
 */
export class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(err: unknown): ErrorBoundaryState {
    return { hasError: true, message: err instanceof Error ? err.message : "Render error" };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="card rounded-xl px-4 py-3 text-xs" style={{ borderLeft: "3px solid var(--red)", color: "var(--muted)" }}>
          ⚠ Could not render this card: {this.state.message}
        </div>
      );
    }
    return this.props.children;
  }
}
