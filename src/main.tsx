
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom';
import { AppProviders } from '@/context/AppProviders'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AppProviders>
      <App />
    </AppProviders>
  </BrowserRouter>
);
