import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';
import * as ReactGA from 'react-ga';
import * as Sentry from '@sentry/react';
import 'semantic-ui-css/semantic.min.css';

ReactGA.initialize('UA-122177622-1');
ReactGA.pageview(window.location.pathname + window.location.search);

Sentry.init({
  dsn: 'https://e1ea501c7fed49d9af75b57440753eed@o456960.ingest.sentry.io/5450534',
  integrations: [Sentry.browserTracingIntegration()],

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
});

// const history = createBrowserHistory();

// history.listen((location, action) => {
//   ReactGA.set({ page: location.pathname });
//   ReactGA.pageview(location.pathname);
// });

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('root');
  if (container) {
    const root = createRoot(container);
    root.render(
      // @ts-ignore
      <Router>
        <App />
      </Router>
    );
  } else {
    console.error("Container element with ID 'app' not found.");
  }
});

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
