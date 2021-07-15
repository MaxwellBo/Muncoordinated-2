/**
 * This is truly the most fucked up file in the entire codebase.
 * Mercy up on all those who must modify this.
 */

import * as firebase from 'firebase/app';
import { TimerData } from '../Timer';
import * as React from 'react';
import { Feed, Icon, Flag, Label, FeedEvent } from 'semantic-ui-react';
import { runLifecycle, Lifecycle } from '../../actions/caucus-actions';
import { parseFlagName } from '../Member';
import { DragDropContext, Droppable, Draggable, DraggableProvided, DropResult } from 'react-beautiful-dnd';
import { useAuthState } from 'react-firebase-hooks/auth';

export enum Stance {
  For = 'For',
  Neutral = 'Neutral',
  Against = 'Against'
}

export interface SpeakerEvent {
  who: string;
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

export class SpeakerFeedEntry extends React.PureComponent<{
  data?: SpeakerEvent,
  speaking?: SpeakerEvent,
  fref: firebase.database.Reference,
  speakerTimer: TimerData,
  draggableProvided?: DraggableProvided
}> {

  yieldHandler = () => {
    const { fref, data, speakerTimer, speaking } = this.props;

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
      timerResetSeconds: 0 // this shouldn't ever be used when yielding
    };

    runLifecycle({ ...lifecycle, ...queueHeadDetails });
  };

  renderContent() {
    const { data, speaking, fref } = this.props;

    return (
      <Feed.Content>
        <Feed.Summary>
          <Feed.User>
            {data && <Flag name={parseFlagName(data.who)} />}
            {data ? data.who : ''}
          </Feed.User>
          <Feed.Date>{data ? data.duration.toString() + ' seconds': ''}</Feed.Date>
        </Feed.Summary>
        <Feed.Meta>
          <Feed.Like>
            {data && <StanceIcon stance={data.stance} />}
            {data ? data.stance : ''}
          </Feed.Like>
          {data && <Label size="mini" as="a" onClick={() => fref.remove()}>
            Remove
          </Label>}
          {data && speaking && (<Label size="mini" as="a" onClick={this.yieldHandler}>
            Yield
          </Label>)}
        </Feed.Meta>
      </Feed.Content>
    )
  }
  
  render() {
    const { draggableProvided } = this.props;

    return draggableProvided ? (
      <div
        className="event" // XXX: quite possibly the most bullshit hack known to man
        ref={draggableProvided.innerRef}
          {...draggableProvided.draggableProps}>
            {this.renderContent()}
            <div {...draggableProvided.dragHandleProps}
                style={{ paddingLeft: '120px'}
            }> ⠿ </div>
      </div>
    ) : <FeedEvent>
      {this.renderContent()}
    </FeedEvent>
  }
};

function reorder<T>(list: T[], startIndex: number, endIndex: number) {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);

  return result;
};

export const SpeakerFeed = (props: {
  data?: Record<string, SpeakerEvent>,
  queueFref: firebase.database.Reference,
  speaking?: SpeakerEvent,
  speakerTimer: TimerData
}) => {
  const { data, queueFref, speaking, speakerTimer } = props;
  const [ user  ] = useAuthState(firebase.auth());

  const events = data || {};

  const eventItems = Object.keys(events).map((key, index) =>
    (
      <Draggable key={key} draggableId={key} index={index}>
        {(provided, snapshot) => 
          <SpeakerFeedEntry
            draggableProvided={provided}
            key={key}
            data={events[key]}
            fref={queueFref.child(key)}
            speaking={speaking}
            speakerTimer={speakerTimer}
          />
        }
      </Draggable>
    )
  );

  const onDragEnd = (result: DropResult) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    // no auth
    if (!user) {
      return;
    }

    const events = data || {};

    const reorderedKeys = reorder(
      Object.keys(events),
      result.source.index,
      result.destination.index
    );

    queueFref.set({});

    reorderedKeys.forEach(key => {
      const se = (data || {})[key]

      if (se) {
        queueFref.push().set(se);
      }
    });
  }

  return (
    <DragDropContext
      onDragEnd={onDragEnd}
    >
      <Droppable droppableId="droppable">
        {(provided, snapshot) =>
          <div 
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            <Feed 
              size="large" 
            >
              {eventItems}
              {provided.placeholder}
            </Feed>
          </div>
        }
      </Droppable>
    </DragDropContext>
  );
};