import { TimerData } from '../Timer';
import * as React from 'react';
import { Feed, Icon, Flag, Label } from 'semantic-ui-react';
import { runLifecycle, Lifecycle } from '../../actions/caucusActions';
import { parseFlagName } from '../Member';

export enum Stance {
  For = 'For',
  Neutral = 'Neutral',
  Against = 'Against'
}

export interface SpeakerEvent {
  who: string; // FIXME: @mbo you dumb fuck, this was meant to be MemberID, not their fucking name
  stance: Stance;
  duration: number;
}

const StanceIcon = (props: { stance: Stance }) => {
  switch (props.stance) {
    case Stance.For:
      return <Icon name="thumbs up outline" />;
    case Stance.Against:
      return <Icon name="thumbs down outline" />;
    default:
      return <Icon name="hand point right outline" />;
  }
};

export const SpeakerFeedEntry = (props: {
  data?: SpeakerEvent, 
  speaking?: SpeakerEvent,
  fref: firebase.database.Reference, 
  speakerTimer: TimerData
}) => {

  const { data, speaking, fref, speakerTimer } = props;

  const yieldHandler = () => {
    const queueHeadDetails = {
      queueHeadData: data,
      queueHead: fref
    };

    // HACK
    // HERE BE DRAGONS
    // The only reason I'm doing this is because I honestly couldn't give a shit about propogating
    // the caucusRef all the way down. Furthermore, the only time this should ever be called is when the 
    // SpeakerEvent is in the "queue" zone, meaning we'll pop up into the "caucus" field.
    const caucusRef = (fref.parent as firebase.database.Reference).parent as firebase.database.Reference;

    const lifecycle: Lifecycle = {
      history: caucusRef.child('history'),
      speaking: caucusRef.child('speaking'),
      speakingData: speaking,
      timerData: speakerTimer,
      timer: caucusRef.child('speakerTimer'),
      yielding: true,
    };

    runLifecycle({ ...lifecycle, ...queueHeadDetails });
  };

  return data ? (
    <Feed.Event>
      {/* <Feed.Label image='/assets/images/avatar/small/helen.jpg' /> */}
      <Feed.Content>
        <Feed.Summary>
          <Feed.User>
            <Flag name={parseFlagName(data.who)} />
            {data.who}
          </Feed.User>
          <Feed.Date>{data.duration.toString() + ' seconds'}</Feed.Date>
        </Feed.Summary>
        <Feed.Meta>
          <Feed.Like>
            <StanceIcon stance={data.stance} />
            {data.stance}
          </Feed.Like>
          <Label size="mini" as="a" onClick={() => fref.remove()}>
            Remove
          </Label>
          {speaking && (<Label size="mini" as="a" onClick={yieldHandler}>
            Yield
          </Label>)}
        </Feed.Meta>
      </Feed.Content>
    </Feed.Event>
  ) : <Feed.Event />;
};

export const SpeakerFeed = (props: {
  data?: Map<string, SpeakerEvent>,
  fref: firebase.database.Reference,
  speaking?: SpeakerEvent,
  speakerTimer: TimerData
}) => {
  const { data, fref, speaking, speakerTimer } = props;

  const events = data || {};

  const eventItems = Object.keys(events).map(key =>
    (
      <SpeakerFeedEntry
        key={key}
        data={events[key]}
        fref={fref.child(key)}
        speaking={speaking}
        speakerTimer={speakerTimer}
      />
    )
  );

  return (
    <Feed size="large">
      {eventItems}
    </Feed>
  );
};