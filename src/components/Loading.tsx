import * as React from 'react';
import { Loader, Dimmer } from 'semantic-ui-react';

export class Loading extends React.PureComponent<{}, {}> {
  render() {
    return (
      <Dimmer active inverted>
        <Loader inverted size="large" />
      </Dimmer>
    );
  }
}
