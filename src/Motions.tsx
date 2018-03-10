import * as React from 'react';
import * as firebase from 'firebase';
import { CommitteeData, URLParameters } from './Committee';
import { RouteComponentProps } from 'react-router';
import { Loader } from 'semantic-ui-react';

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  committee?: CommitteeData;
  fref: firebase.database.Reference;
}

enum MotionType {
  UnmoderatedCaucus = 'Unmoderated Caucus',
  ModeratedCaucus = 'Moderated Caucus',
  OpenDebate = 'Open Debate',
  SuspendDebate = 'Open Debate',
  ReopenDebate = 'Reopen Debate',
  CloseDebate = 'Close Debate',
  IntroduceResolution = 'Introduce Resolution'
}

const MOTION_TYPE_OPTIONS = [
  { key: MotionType.UnmoderatedCaucus, value: MotionType.UnmoderatedCaucus, text: MotionType.UnmoderatedCaucus },
  { key: MotionType.ModeratedCaucus, value: MotionType.ModeratedCaucus, text: MotionType.ModeratedCaucus },
  { key: MotionType.OpenDebate, value: MotionType.OpenDebate, text: MotionType.OpenDebate },
  { key: MotionType.SuspendDebate, value: MotionType.SuspendDebate, text: MotionType.SuspendDebate },
  { key: MotionType.ReopenDebate, value: MotionType.ReopenDebate, text: MotionType.ReopenDebate },
  { key: MotionType.CloseDebate, value: MotionType.CloseDebate, text: MotionType.CloseDebate },
  { key: MotionType.IntroduceResolution, value: MotionType.IntroduceResolution, text: MotionType.IntroduceResolution },
];

interface Motion {
  proposal: string;
  proposer: string;
  speakerTime: number;
  caucusTimer: number;
  type: MotionType;
}

export default class Motions extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { match } = props;

    this.state = {
      fref: firebase.database().ref('committees').child(match.params.committeeID)
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

  renderMotions(committee: CommitteeData) {
    return (
      
    )
  }

  render() {
    const { committee } = this.state;

    if (committee) {
      return this.renderMotions(committee);
    } else {
      return <Loader>Loading</Loader>;
    }
  }
}