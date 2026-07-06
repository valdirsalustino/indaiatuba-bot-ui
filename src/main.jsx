import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import './index.css'

window.addEventListener('error', (e) => {
  const errDiv = document.createElement('div');
  errDiv.style.color = 'red';
  errDiv.style.background = 'white';
  errDiv.style.position = 'fixed';
  errDiv.style.top = '0';
  errDiv.style.left = '0';
  errDiv.style.padding = '20px';
  errDiv.style.zIndex = '9999';
  errDiv.innerText = e.error ? e.error.stack : e.message;
  document.body.appendChild(errDiv);
});

// Suppress the specific "findDOMNode" warning from react-quill
const originalWarn = console.error;
console.error = (...args) => {
  if (args[0] && typeof args[0] === 'string' && args[0].includes('findDOMNode')) {
    return;
  }
  originalWarn.apply(console, args);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ToastProvider>
        <App />
      </ToastProvider>
    </BrowserRouter>
  </React.StrictMode>,
)