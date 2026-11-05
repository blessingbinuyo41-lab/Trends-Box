import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Handle dynamic import / chunk errors that happen right after a new production deployment
window.addEventListener('vite:preloadError', () => {
  const hasReloaded = sessionStorage.getItem('vite_chunk_reloaded');
  if (!hasReloaded) {
    sessionStorage.setItem('vite_chunk_reloaded', 'true');
    window.location.reload();
  }
});

// Clear the reload flag once the app mounts successfully
sessionStorage.removeItem('vite_chunk_reloaded');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
