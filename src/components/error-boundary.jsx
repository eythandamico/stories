import { Component } from 'react'
import Icon from '../lib/icon.jsx'

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-[var(--inv-bg)] flex flex-col items-center justify-center px-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--inv-bg-alt)] flex items-center justify-center mb-5">
            <Icon name="alert" size={28} className="text-[var(--inv-muted)]" />
          </div>
          <h2 className="text-[22px] font-semibold text-[var(--inv-heading)] mb-2">Something went wrong</h2>
          <p className="text-[16px] text-[var(--inv-muted)] mb-6">The app ran into an error. Try restarting.</p>
          <button
            type="button"
            onClick={() => { this.setState({ hasError: false }); window.location.href = '/' }}
            className="px-6 h-[48px] rounded-2xl bg-[var(--inv-heading)] text-[var(--inv-bg)] font-medium text-[16px] cursor-pointer active:scale-[0.96]"
          >
            Restart App
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
