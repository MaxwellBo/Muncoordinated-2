import * as React from 'react';

import { Message } from 'semantic-ui-react';

interface State {
  latestVersion?: string;
}

const CLIENT_VERSION = 'v2.1.1'
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
    this.fetchLatestVersion();
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
        <Message.Item>New version available - refresh your browser</Message.Item>
      </Message.List>
    );

    return (
      <Message compact size="mini" loading={!!latestVersion} list={["HMM"]}>
        Made with 💖 by <a href="https://github.com/MaxwellBo">Max Bo</a>. {version}
        {latestVersion !== CLIENT_VERSION && refreshNudge}
      </Message>
    );
  }
}