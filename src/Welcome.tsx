import * as React from 'react';
import { Link } from 'react-router-dom';
import * as firebase from 'firebase';
import { CommitteeData, CommitteeID } from './Committee';
import TimerData from './Timer';

interface Props { }

interface State {
  committees: Map<String, CommitteeData>;
}

function CommitteeItem(props: { id: CommitteeID, data: CommitteeData } ) {
  return (
    <div>
      <p>{props.data.name}</p>
      <Link to={`/committee/${props.id}`}><button>Route</button></Link>
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
      <div>
        {items}
      </div>
    );
  }
}
