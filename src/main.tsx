import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { PosProvider } from './lib/pos/store';
import { AppSettingsProvider } from './lib/appSettings';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppSettingsProvider>
      <PosProvider>
        <App />
      </PosProvider>
    </AppSettingsProvider>
  </StrictMode>,
);
