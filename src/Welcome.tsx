import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { Link } from 'react-router-dom';
import * as firebase from 'firebase';
import { CommitteeData, CommitteeID } from './Committee';
import { Segment, Button, Divider } from 'semantic-ui-react';
import { user } from './Auth';

interface URLParameters {
}

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  committees: Map<String, CommitteeData>;
}

function CommitteeItem(props: { id: CommitteeID, data: CommitteeData } ) {
  // XXX: Might want to share code with CaucusItem?
  return (
    <div style={{ border: 'solid' }}>
      <h4>Name</h4>
      <p>{props.data.name}</p>
      <h4>Chair</h4>
      <p>{props.data.chair}</p>
      <h4>Topic</h4>
      <p>{props.data.topic}</p>
      <Link to={`/committees/${props.id}`}><button>Route</button></Link>
    </div>
  );
}

export default class Welcome extends React.Component<Props, State> {
  // TODO: Rename database field `commitees` to `committees`
  committeesRef = firebase.database().ref('commitees');

  constructor(props: Props) {
    super(props);

    this.state = {
      committees : {} as Map<String, CommitteeData>
    };
  }

  componentDidMount() {
    this.committeesRef.on('value', (committees) => {
      if (committees) {
        this.setState({ committees: committees.val() });
      }
    });
  }

  componentWillUnmount() {
    this.committeesRef.off();
  }

  render() {
    const items = Object.keys(this.state.committees).map(key => 
      <CommitteeItem key={key} id={key} data={this.state.committees[key]} />
    );

    return (
      <Segment padded>
        <Button primary fluid onClick={() => this.props.history.push(`/login`)}>Login</Button>
        <Divider horizontal>Or</Divider>
        <Button secondary fluid disabled={!user}>Create Committee</Button>
      </Segment>
    );
  }
}
