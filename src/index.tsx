import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Router } from 'react-router-dom';
import App from './App';
import * as serviceWorker from './serviceWorker';
import createHistory from 'history/createBrowserHistory';
import * as ReactGA from 'react-ga';
import * as Sentry from '@sentry/browser';
import 'semantic-ui-css/semantic.min.css';

Sentry.init({ dsn: 'https://1e4f23a087974ab482cacf50699c6dbd@sentry.io/1296285' });

ReactGA.initialize('UA-122177622-1');
ReactGA.pageview(window.location.pathname + window.location.search);

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