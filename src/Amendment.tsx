import * as React from 'react';
import * as firebase from 'firebase';
import { ResolutionStatus, VotingResults, DEFAULT_VOTES } from './Resolution';
import { CaucusID } from './Caucus';
import { MemberID } from './Member';

interface Props { 
  fref: firebase.database.Reference;
}

interface State {
  amendment: AmendmentData;
}

export type AmendmentID = string;

export interface AmendmentData {
  proposer: MemberID;
  status: ResolutionStatus;
  text: String;
  caucus: CaucusID;
  votes: VotingResults;
}

export default class Amendment extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const defaultAmendment = {
      proposer: '',
      status: ResolutionStatus.Ongoing,
      text: '',
      caucus: '',
      votes: DEFAULT_VOTES
    };

    this.state = {
      amendment: defaultAmendment,
    };
  }

  componentDidMount() {
    this.props.fref.on('value', (amendment) => {
      if (amendment) {
        this.setState({ amendment: amendment.val() });
      }
    });
  }

  componentWillUnmount() {
    this.props.fref.off();
  }

  render() {
    return (
      <div>
        <p>this.state.amendment.text</p>
      </div>
    );
  }
}
