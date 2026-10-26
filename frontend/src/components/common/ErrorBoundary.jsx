import { Component } from 'react';
import ServerError from '../../pages/errors/ServerError.jsx';

/**
 * Catches unexpected rendering errors so the visitor sees a friendly page, never a blank screen.
 * resetKey: navigating (the key changes) clears the error.
 * fallback:  optional ({ error, reset }) => element, used by the top-level boundary which sits outside the router.
 */
export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('UI error:', error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    if (this.state.hasError && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ hasError: false, error: null });
    }
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback({ error: this.state.error, reset: this.reset });
    return <ServerError error={this.state.error} onRetry={this.reset} />;
  }
}