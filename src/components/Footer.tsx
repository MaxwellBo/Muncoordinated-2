import * as React from 'react';

import { Message } from 'semantic-ui-react';

export class Footer extends React.PureComponent<{}, {}> {

  version = (
    <a href="https://github.com/MaxwellBo/Muncoordinated-2/releases">
      v2.1.1
    </a>
  );

  render() {
    const { version } = this;

    return (
      <Message compact size="mini">
        Made with 😡 by <a href="https://github.com/MaxwellBo">Max Bo</a>. {version}
      </Message>
    );
  }
}