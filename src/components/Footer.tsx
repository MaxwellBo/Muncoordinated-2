import * as React from 'react';

import { Message } from 'semantic-ui-react';

export class Footer extends React.PureComponent<{}, {}> {
  render() {
    return (
      <Message compact size="mini">
        Made with 😡 by <a href="https://github.com/MaxwellBo">Max Bo</a>
      </Message>
    );
  }
}