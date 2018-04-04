import * as React from 'react';
import { CaucusData } from '../Caucus';
import { TimerData } from '../Timer';
import { Header, Segment, Button, Icon, Feed, Label, Flag } from 'semantic-ui-react';
import { parseFlagName } from '../Member';
import { runLifecycle, Lifecycle } from '../../actions/caucusActions';
import { SpeakerEvent, Stance } from './SpeakerFeed';
import { SpeakerFeed } from './SpeakerFeed';
import * as _ from 'lodash';

interface Props {
  data: CaucusData;
  speakerTimer: TimerData;
  fref: firebase.database.Reference;
}

export class CaucusNextSpeaking extends React.Component<Props, {}> {
  constructor(props: Props) {
    super(props);
  }

  handleKeyDown = (ev: KeyboardEvent) => {
    if (ev.keyCode === 78 && ev.altKey) {
      this.nextSpeaker();
    }
  }

  componentDidMount() {
    const { handleKeyDown } = this;
    document.addEventListener<'keydown'>('keydown', handleKeyDown);
  }

  componentWillUnmount() {
    const { handleKeyDown } = this;
    document.removeEventListener('keydown', handleKeyDown);
  }

  interlace = () => {
    const { props } = this;

    const q = props.data.queue || {};

    const vs: SpeakerEvent[] = _.values(q);

    const fors     = vs.filter((se) => se.stance === Stance.For);
    const againsts = vs.filter((se) => se.stance === Stance.Against);
    const neutrals = vs.filter((se) => se.stance === Stance.Neutral);

    const interlaced = _.flatten(_.zip(fors, againsts, neutrals));

    props.fref.child('queue').set({});

    interlaced.forEach((se: SpeakerEvent) => {
      if (se) {
        props.fref.child('queue').push().set(se);
      }
    });
  }

  nextSpeaker = () => {
    const { props } = this;

    const queue = props.data.queue || {};

    const queueHeadKey = Object.keys(queue)[0];

    let queueHeadDetails = {};

    if (queueHeadKey) {
      queueHeadDetails = {
        queueHeadData: queue[queueHeadKey],
        queueHead: props.fref.child('queue').child(queueHeadKey)
      };
    }

    const lifecycle: Lifecycle = {
      history: props.fref.child('history'),
      speakingData: props.data.speaking,
      speaking: props.fref.child('speaking'),
      timerData: props.speakerTimer,
      timer: props.fref.child('speakerTimer'),
      yielding: false,
    };

    runLifecycle({ ...lifecycle, ...queueHeadDetails });
  }

  render() {
    const { nextSpeaker, props, interlace } = this;

    return (
      <div>
        <Header as="h3" attached="top">
          Next Speaking
        </Header>
        <Segment attached textAlign="center">
          <Button
            basic
            icon
            primary
            onClick={nextSpeaker}
          >
            <Icon name="arrow up" />
            Next
          </Button>
          <Button
            icon
            basic
            color="purple"
            onClick={interlace}
          >
            <Icon name="random" />
            Interlace
          </Button>
        </Segment>
        <Segment attached="bottom">
          <SpeakerFeed 
            data={props.data.queue} 
            fref={props.fref.child('queue')} 
            speaking={props.data.speaking} 
            speakerTimer={props.speakerTimer} 
          />
        </Segment>
      </div>
    );
  }
}