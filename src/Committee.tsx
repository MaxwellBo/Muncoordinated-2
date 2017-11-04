import * as React from 'react';
import * as firebase from 'firebase';
import { RouteComponentProps } from 'react-router';
import { MemberData, MemberID } from './Member';
import { CaucusData, CaucusID } from './Caucus';
import { ResolutionData, ResolutionID } from './Resolution';

interface Props extends RouteComponentProps<any> {
}

interface State {
  committee: CommitteeData;
  fref: firebase.database.Reference;
}

export type CommitteeID = string;

export interface CommitteeData {
  name: String;
  chair: String;
  topic: String;
  members: Map<MemberID, MemberData>;
  caucuses: Map<CaucusID, CaucusData>;
  resolutions: Map<ResolutionID, ResolutionData>;
}

function CommitteeMeta(props: { value: CommitteeData }) {
  return (
    <div>
      <p>Committee Meta</p>
      <p>{props.value.name}</p>
      <p>{props.value.chair}</p>
      <p>{props.value.topic}</p>
    </div>
  );
}

export default class Committee extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const defaultCommittee = {
      name: '',
      chair: '',
      topic: '',
      members: {} as Map<MemberID, MemberData>,
      caucuses: {} as Map<CaucusID, CaucusData>,
      resolutions: {} as Map<ResolutionID, ResolutionData>
    };

    const committeeID: CommitteeID = this.props.match.params.committeeID;

    this.state = {
      committee: defaultCommittee,
      fref: firebase.database().ref('commitees').child(committeeID)
    };
  }

  componentDidMount() {
    this.state.fref.on('value', (committee) => {
      if (committee) {
        this.setState({ committee: committee.val() });
      }
    });
  }

  componentWillUnmount() {
    this.state.fref.off();
  }

  render() {
    return (
      <div>
        <CommitteeMeta value={this.state.committee} />
      </div>
    );
  }
}
