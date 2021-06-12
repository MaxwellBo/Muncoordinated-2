import * as React from 'react';
import firebase from 'firebase/app';
import { CommitteeData } from './Committee';
import { RouteComponentProps } from 'react-router';
import { URLParameters } from '../types';
import { TextArea, Form, Container } from 'semantic-ui-react';
import { Helmet } from 'react-helmet';
import { textAreaHandler } from '../actions/handlers';
import Loading from './Loading';

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  committee?: CommitteeData;
  committeeFref: firebase.database.Reference;
}

export default class Notes extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { match } = props;

    this.state = {
      committeeFref: firebase.database().ref('committees')
        .child(match.params.committeeID)
    };
  }

  firebaseCallback = (committee: firebase.database.DataSnapshot | null) => {
    if (committee) {
      this.setState({ committee: committee.val() });
    }
  }

  componentDidMount() {
    this.state.committeeFref.on('value', this.firebaseCallback);
  }

  componentWillUnmount() {
    this.state.committeeFref.off('value', this.firebaseCallback);
  }

  render() {
    const { committee, committeeFref } = this.state;

    // const trigger = <Button icon="question" size="mini" basic floated="right" />;

    return committee ? (
      <Container text style={{ padding: '1em 0em' }}>
        <Helmet>
          <title>{`Notes - Muncoordinated`}</title>
        </Helmet>
        <Form>
          <TextArea
            value={committee ? committee.notes : ''}
            onChange={textAreaHandler<CommitteeData>(committeeFref, 'notes')}
            autoHeight
            placeholder="Notes"
          />
          {/* <Popup
            trigger={trigger}
            content="Shift + Enter to add a new line"
            basic
          /> */}
        </Form>
      </Container> 
    ) : <Loading />;
  }
}