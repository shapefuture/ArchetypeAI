import React, { Suspense, useEffect } from 'react';
import { useApp } from '../app.jsx';
import { homeScreen } from '../core/boot.ts';
import { store, KEYS } from '../core/local-store';

/* Runs onCommit only after the wrapped screen has rendered, never while a lazy chunk is suspended. */
function Committed({ onCommit, children }) {
  useEffect(() => { onCommit?.(); }, [onCommit]);
  return children;
}

/* A failed route chunk or render error becomes an explicit, recoverable state instead of a blank app. */
export class RouteBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  componentDidUpdate(previous) {
    if (this.state.failed && previous.resetKey !== this.props.resetKey) this.setState({ failed: false });
  }

  render() {
    return this.state.failed ? <RouteFailure /> : this.props.children;
  }
}

/* Lazy routes suspend to `fallback`; the deep link is settled only after the requested screen commits.
   The Suspense boundary is keyed by route so a route change swaps screens instead of hiding the old one in the DOM. */
export function RouteFrame({ resetKey, fallback, onCommit, children }) {
  return (
    <RouteBoundary resetKey={resetKey}>
      <Suspense key={resetKey} fallback={fallback}>
        <Committed onCommit={onCommit}>{children}</Committed>
      </Suspense>
    </RouteBoundary>
  );
}

function RouteFailure() {
  const { t, go, setOverlay } = useApp();
  const home = () => {
    setOverlay(null);
    go(homeScreen(store.load(KEYS.onboarded, false)));
  };
  return (
    <div className="screen" style={{ alignItems: 'center', justifyContent: 'center', display: 'flex' }}>
      <div role="alert" className="card" style={{ width: 280, textAlign: 'center' }}>
        <div className="h2">{t('routeErrT')}</div>
        <p className="sub mt8">{t('routeErrB')}</p>
        <button className="btn primary block mt16" onClick={() => window.location.reload()}>⟳ {t('tryAgain')}</button>
        <button className="btn ghost block mt12" onClick={home}>{t('bootHome')}</button>
      </div>
    </div>
  );
}
