import * as React from 'react';
import { DatabaseReference, ref, onValue, off, DataSnapshot } from 'firebase/database';
import { database } from '../App';
import { RouteComponentProps } from 'react-router';
import { URLParameters } from '../types';
import { TextArea, Form, Container } from 'semantic-ui-react';
import { textAreaHandler } from '../modules/handlers';
import Loading from '../components/Loading';
import {CommitteeData} from "../models/committee";
import { Helmet } from 'react-helmet';

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  committee?: CommitteeData;
  committeeFref: DatabaseReference;
}

export default class Notes extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { match } = props;

    this.state = {
      committeeFref: ref(database, `committees/${match.params.committeeID}`)
    };
  }

  firebaseCallback = (snapshot: DataSnapshot) => {
    if (snapshot.exists()) {
      this.setState({ committee: snapshot.val() });
    }
  }

  componentDidMount() {
    onValue(this.state.committeeFref, this.firebaseCallback);
  }

  componentWillUnmount() {
    off(this.state.committeeFref, 'value', this.firebaseCallback);
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