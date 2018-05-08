import * as React from 'react';
import { Loader, Dimmer, Icon } from 'semantic-ui-react';

interface Props {
  small?: boolean;
}

export default class Loading extends React.PureComponent<Props, {}> {
  render() {
    if (this.props.small) {
      return <Icon name="circle notched" loading />;
    } else {
      return (
        <Dimmer active inverted>
          <Loader inverted size="large" />
        </Dimmer>
      );
    }
  }
}