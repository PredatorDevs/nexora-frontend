import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from '@/app/App.jsx';
import {
  applyPreferenceAttributes,
  readPreferences,
} from '@/preferences/preference-storage.js';
import '@/styles/global.css';

applyPreferenceAttributes(readPreferences());

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
