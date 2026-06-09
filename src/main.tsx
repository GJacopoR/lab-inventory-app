import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { initDb } from './repositories/db';

// Vite provides BASE_URL at runtime for correct routing in both dev and production
const basename = import.meta.env.BASE_URL;

async function startApp() {
  // Initialise the IndexedDB and seed if empty
  await initDb();

  const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
  );

  root.render(
    <React.StrictMode>
      <BrowserRouter basename={basename}>
        <App />
      </BrowserRouter>
    </React.StrictMode>
  );
}

startApp();
