import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#f8fafc', padding: '2rem', textAlign: 'center',
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h2 style={{ color: '#1e293b', marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ color: '#64748b', marginBottom: 24, maxWidth: 400 }}>
            This page encountered an error. Please go back or refresh.
          </p>
          <button
            onClick={() => { this.setState({ hasError: false, error: null }); window.history.back(); }}
            style={{
              background: '#10b981', color: '#fff', border: 'none',
              borderRadius: 8, padding: '10px 24px', cursor: 'pointer', fontWeight: 600,
            }}
          >
            Go Back
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
