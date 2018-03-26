import * as React from 'react';
import * as firebase from 'firebase';
import { CommitteeData, URLParameters } from './Committee';
import { RouteComponentProps } from 'react-router';
import { Loader, Segment, Input, Dropdown, Button } from 'semantic-ui-react';
import { fieldHandler, dropdownHandler } from './handlers';
import { makeDropdownOption } from './utils';

export type MotionID = string;

enum MotionType {
  UnmoderatedCaucus = 'Unmoderated Caucus',
  ModeratedCaucus = 'Moderated Caucus',
  OpenDebate = 'Open Debate',
  SuspendDebate = 'Open Debate',
  ReopenDebate = 'Reopen Debate',
  CloseDebate = 'Close Debate',
  IntroduceResolution = 'Introduce Resolution'
}

export interface MotionData {
  proposal: string;
  proposer: string;
  speakerTime: number;
  caucusTimer: number;
  type: MotionType;
}

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  committee?: CommitteeData;
  newMotion: MotionData;
  committeeFref: firebase.database.Reference;
}

const MOTION_TYPE_OPTIONS = [
  MotionType.UnmoderatedCaucus,
  MotionType.ModeratedCaucus,
  MotionType.OpenDebate,
  MotionType.SuspendDebate,
  MotionType.ReopenDebate,
  MotionType.CloseDebate,
  MotionType.IntroduceResolution,
].map(makeDropdownOption);

const DEFAULT_MOTION: MotionData = {
  proposal: '',
  proposer: '',
  speakerTime: 600,
  caucusTimer: 60,
  type: MotionType.ModeratedCaucus
};

export default class Motions extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { match } = props;

    this.state = {
      committeeFref: firebase.database().ref('committees').child(match.params.committeeID),
      newMotion: DEFAULT_MOTION
    };
  }

  componentDidMount() {
    this.state.committeeFref.on('value', (committee) => {
      if (committee) {
        this.setState({ committee: committee.val() });
      }
    });
  }

  componentWillUnmount() {
    this.state.committeeFref.off();
  }

  handlePushMotion = (): void => {
    this.state.committeeFref.child('motions').push().set(DEFAULT_MOTION);
  }

  renderMotion = (id: MotionID, motionData: MotionData, motionFref: firebase.database.Reference) => {
    const { proposal, type } = motionData;

    return (
      <Segment>
        <Input 
          value={proposal}
          onChange={fieldHandler(motionFref, 'proposal')} 
          fluid 
          placeholder="Proposal" 
        />
        <Dropdown
          placeholder="Select type"
          search
          selection
          fluid
          options={MOTION_TYPE_OPTIONS}
          onChange={dropdownHandler(motionFref, 'type')}
          value={type}
        />
      </Segment>
    );
  }

  renderMotions = (motions: Map<MotionID, MotionData>) => {
    const { renderMotion } = this;
    const { committeeFref } = this.state;

    return Object.keys(motions).map(key => {
      renderMotion(key, motions[key], committeeFref.child('motions').child(key));
    });
  }

  renderTab = (committee: CommitteeData) => {
    const { renderMotions } = this;
    const { handlePushMotion } = this;

    const motions = committee.motions || {} as Map<MotionID, MotionData>;

    return (
      <div>
        {renderMotions(motions)}
        <Button
          icon="plus"
          primary
          fluid
          basic
          onClick={handlePushMotion}
        />
      </div>
    );
  }

  render() {
    const { committee } = this.state;

    if (committee) {
      return this.renderTab(committee);
    } else {
      return <Loader>Loading</Loader>;
    }
  }
}