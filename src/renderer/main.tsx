import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/globals.css';

// Global error listeners to write renderer errors directly to the main process log file
window.addEventListener('error', (event) => {
  if (window.api?.writeLog) {
    window.api.writeLog('error', 'Renderer-Uncaught', event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error ? { message: event.error.message, stack: event.error.stack } : null
    });
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (window.api?.writeLog) {
    window.api.writeLog('error', 'Renderer-PromiseRejection', String(event.reason), {
      reason: event.reason instanceof Error ? { message: event.reason.message, stack: event.reason.stack } : event.reason
    });
  }
});

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
