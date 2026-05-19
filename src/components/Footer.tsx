import * as React from 'react';

interface Props {
}

interface State {
  latestVersion?: string;
}

export const CLIENT_VERSION = 'v2.20.12-vi';

export function VersionLink(props: { 
  version: string 
}) {
  return <a href="https://github.com/penny2k8/vi-Muncoordinated-2/releases">
    {props.version}
  </a>
}

const RELEASES_LATEST = 'https://api.github.com/penny2k8/vi-Muncoordinated-2/releases/latest';

export default class Footer extends React.PureComponent<Props, State> {
  constructor(props: Props) {
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
  }

  render() {
    const { latestVersion } = this.state;

    return (
      <div style={{ position: 'fixed', bottom: 5, left: 5, background: '#FFFFFF' }}>
        Phiên bản <VersionLink version={latestVersion || CLIENT_VERSION} /> bởi <a href="https://github.com/MaxwellBo">Max Bo</a>, <a href="https://www.facebook.com/UQUNSA/">UQUNSA</a> &amp; <a href="https://github.com/penny2k8">Minh Le</a>
      </div>
    );
  }
}
