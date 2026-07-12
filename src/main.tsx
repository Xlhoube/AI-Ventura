















import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppRoutes } from './AppRoutes';
import './index.css';

const container = document.getElementById('root');
if (container) {
  let root = (window as any)._reactRoot;

  if (!root) {
    root = createRoot(container);
    (window as any)._reactRoot = root;
  }

  root.render(
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </ErrorBoundary>
  );
}