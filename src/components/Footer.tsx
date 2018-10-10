import * as React from 'react';

interface State {
  latestVersion?: string;
  timerId?: NodeJS.Timer;
}

const CLIENT_VERSION = 'v2.9.0';
const RELEASES_LATEST = 'https://api.github.com/repos/MaxwellBo/Muncoordinated-2/releases/latest';

export default class Footer extends React.PureComponent<{}, State> {
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
      <span>
        . New version available
      </span>
    );

    return (
      <div style={{ position: 'fixed', bottom: 5, left: 5, background: '#FFFFFF' }}>
        {version} by <a href="https://github.com/MaxwellBo">Max Bo</a> &amp; <a href="https://www.facebook.com/UQUNSA/">UQUNSA</a>{latestVersion !== CLIENT_VERSION && refreshNudge}
      </div>
    );
  }
}
