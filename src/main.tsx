import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Suppress benign Vite HMR WebSocket errors
const suppressWebSocketError = (event: any) => {
  const reason = event.reason || event.error || event.message;
  if (reason && (
    (typeof reason === 'string' && reason.includes('WebSocket')) ||
    (reason.message && reason.message.includes('WebSocket')) ||
    (reason.stack && reason.stack.includes('WebSocket'))
  )) {
    event.preventDefault();
    event.stopPropagation();
  }
};

window.addEventListener('unhandledrejection', suppressWebSocketError);
window.addEventListener('error', suppressWebSocketError);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
