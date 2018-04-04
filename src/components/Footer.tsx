import * as React from 'react';

import { Message } from 'semantic-ui-react';
import { Loading } from './Loading';

interface State {
  latestVersion?: string;
  timerId?: NodeJS.Timer;
}

const CLIENT_VERSION = 'v2.2.2';
const RELEASES_LATEST = 'https://api.github.com/repos/MaxwellBo/Muncoordinated-2/releases/latest';

export class Footer extends React.PureComponent<{}, State> {
  constructor(props: {}) {
    super(props);

    this.state = {};
  }

  fetchLatestVersion = (): Promise<void> => {
    this.setState({ latestVersion: undefined });

    return fetch(RELEASES_LATEST).then(response =>
      response.json()
    ).then(json => 
      this.setState({ latestVersion: json.tag_name })
    );
  }

  componentDidMount() {
    const { fetchLatestVersion } = this;
    fetchLatestVersion();

    this.setState({ timerId: setInterval(fetchLatestVersion, 1000 * 60 * 30) });
  }

  componentWillUnmount() {
    const { timerId } = this.state;

    if (timerId) {
      clearInterval(timerId);
    }
  }

  render() {
    const { latestVersion } = this.state;

    const version = (
      <a href="https://github.com/MaxwellBo/Muncoordinated-2/releases">
        {CLIENT_VERSION}
      </a>
    );

    const refreshNudge = (
      <Message.List>
        <Message.Item>New version available</Message.Item>
      </Message.List>
    );

    return (
      <Message compact size="mini">
        {!latestVersion && <Loading />}
        Made with 💖 by <a href="https://github.com/MaxwellBo">Max Bo</a>. {version}
        {latestVersion !== CLIENT_VERSION && refreshNudge}
      </Message>
    );
  }
}
