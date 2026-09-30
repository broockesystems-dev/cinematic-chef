"use client";

import { Component, type ReactNode } from "react";

/** If WebGL fails at runtime, fall back instead of breaking the page. */
export class GlobeBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
