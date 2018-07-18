import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Router } from 'react-router-dom';
import App from './App';
import registerServiceWorker from './registerServiceWorker';
import createHistory from 'history/createBrowserHistory';
import * as ReactGA from 'react-ga';
import 'semantic-ui-css/semantic.min.css';

ReactGA.initialize('UA-122177622-1');
ReactGA.pageview(window.location.pathname + window.location.search);

const history = createHistory();

history.listen((location, action) => {
  ReactGA.set({ page: location.pathname });
  ReactGA.pageview(location.pathname);
});

ReactDOM.render(
  <Router history={history}>
    <App />
  </Router>,
  document.getElementById('root') as HTMLElement
);
registerServiceWorker();