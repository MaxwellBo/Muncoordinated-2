import * as React from 'react';
import * as firebase from 'firebase';
import { MemberID } from './Member';
import { AmendmentID, AmendmentData } from './Amendment';

interface Props { 
  fref: firebase.database.Reference;
}

interface State {
  resolution: ResolutionData;
}

export enum ResolutionStatus {
  Passed = 'Passed',
  Ongoing = 'Ongoing',
  Failed = 'Failed'
}

export type ResolutionID = string;

export interface ResolutionData {
  proposer: MemberID;
  seconder: MemberID;
  status: ResolutionStatus;
  caucus: string;
  amendments: Map<AmendmentID, AmendmentData>;
  votes: VotingResults;
}

export interface VotingResults {
  for: Map<string, MemberID>;
  abstaining: Map<string, MemberID>;
  against: Map<string, MemberID>;
}

export const DEFAULT_VOTES = {
  for: {} as Map<string, MemberID>,
  abstaining: {} as Map<string, MemberID>,
  against: {} as Map<string, MemberID>
};

export default class Resolution extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const defaultResolution = {
      proposer: '',
      seconder: '',
      status: ResolutionStatus.Ongoing,
      caucus: '',
      amendments: {} as Map<AmendmentID, AmendmentData>,
      votes: DEFAULT_VOTES
    };

    this.state = {
      resolution: defaultResolution,
    };
  }

  componentDidMount() {
    this.props.fref.on('value', (resolution) => {
      if (resolution) {
        this.setState({ resolution: resolution.val() });
      }
    });
  }

  componentWillUnmount() {
    this.props.fref.off();
  }

  render() {
    return (
      <div>
        <p>Resolution</p>
      </div>
    );
  }
}
