import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Router } from 'react-router-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';
import createHistory from 'history/createBrowserHistory';
import * as ReactGA from 'react-ga';
import * as Sentry from "@sentry/react";
import { Integrations } from "@sentry/tracing";
import 'semantic-ui-css/semantic.min.css';

ReactGA.initialize('UA-122177622-1');
ReactGA.pageview(window.location.pathname + window.location.search);

Sentry.init({
  dsn: "https://e1ea501c7fed49d9af75b57440753eed@o456960.ingest.sentry.io/5450534",
  integrations: [
    new Integrations.BrowserTracing(),
  ],

  // We recommend adjusting this value in production, or using tracesSampler
  // for finer control
  tracesSampleRate: 1.0,
});

const history = createHistory();

history.listen((location, action) => {
  ReactGA.set({ page: location.pathname });
  ReactGA.pageview(location.pathname);
});

ReactDOM.render(
// @ts-ignore
  <Router history={history}>
    <App />
  </Router>,
  document.getElementById('root') as HTMLElement
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();