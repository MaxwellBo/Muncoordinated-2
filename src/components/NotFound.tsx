import * as React from 'react';
import { Message, Icon } from 'semantic-ui-react';

interface Props {
  item: string;
  id: string;
}

interface State {
}

export class NotFound extends React.PureComponent<Props, State> {
  componentDidMount() {
    const { item, id } = this.props;
    console.info(`${item} with ID ${id} could not be found`);
  }

  render() {
    const { item, id } = this.props;
    return (
      <Message error icon>
        <Icon name="question" />
        <Message.Content>
          <Message.Header as="h1">Item não encontrado</Message.Header>
          O {item} que você está procurando (ID: {id}) não foi encontrado.
          Ele pode ter sido deletado, ou o URL que você navegou era incorreto.
        </Message.Content>
      </Message>
    );
  }
}
