import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App, { type PageProps } from './App';
import './style.css';
declare global {
  interface Window {
    __WATAD__?: PageProps;
  }
}
const root = document.getElementById('root')!;
const props = window.__WATAD__ || { locale: location.pathname.includes('/en/') ? 'en' : 'ar' };
if (root.hasChildNodes())
  hydrateRoot(
    root,
    <React.StrictMode>
      <App {...props} />
    </React.StrictMode>,
  );
else
  createRoot(root).render(
    <React.StrictMode>
      <App {...props} />
    </React.StrictMode>,
  );
