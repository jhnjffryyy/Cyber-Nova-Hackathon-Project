import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import {applyTheme, getStoredTheme} from './lib/theme';

applyTheme(getStoredTheme());

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch((error: unknown) => {
      console.error('Failed to register the Study Hub offline app worker', error);
    });
  });
}

createRoot(document.getElementById('root')!).render(<App />);
