import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Self-hosted fonts (Fontsource). Browsers only download a face when text uses it,
// so each mode fetches its own families.
import '@fontsource-variable/geist/wght.css';
import '@fontsource-variable/geist-mono/wght.css';
import '@fontsource-variable/newsreader/opsz.css';
import '@fontsource-variable/newsreader/opsz-italic.css';
import '@fontsource-variable/source-sans-3/wght.css';
import '@fontsource-variable/ibm-plex-sans/wght.css';
import '@fontsource/ibm-plex-mono/400.css';
import '@fontsource/ibm-plex-mono/500.css';

import './styles/base.css';
import { App } from './App';
import { startRouting } from './shell/mode';

startRouting();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
