import * as firebase from 'firebase/app';
import * as _ from 'lodash';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { URLParameters, Dictionary } from '../types';
import { getStrawpollRef } from '../actions/strawpollActions';
import { useObject } from 'react-firebase-hooks/database';
import { Container, Header, Input, Button, List, Icon, Checkbox, Form, CheckboxProps } from 'semantic-ui-react';
import { fieldHandler } from '../actions/handlers';
import Loading from './Loading';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useLocalStorage, uuidv4 } from '../utils';

enum StrawpollStage {
  Preparing = 'preparing',
  Voting = 'voting',
  Results = 'results',
}

enum StrawpollType {
  Checkbox = 'checkbox',
  Radio = 'radio'
}

export type StrawpollID = string;
export type StrawpollOptionID = string;
export type StrawpollVoteID = string;

export const DEFAULT_STRAWPOLL: StrawpollData = {
  question: 'undefined question',
  stage: StrawpollStage.Preparing,
  type: StrawpollType.Checkbox,
  options: {},
}

export interface StrawpollData {
  question: string
  type: StrawpollType
  stage: StrawpollStage
  options?: Dictionary<StrawpollOptionID, StrawpollOptionData>
}

export interface StrawpollOptionData {
  text: string
  votes?: Dictionary<StrawpollVoteID, StrawpollVoteData>
}

const DEFAULT_STRAWPOLL_OPTION: StrawpollOptionData = {
  text: '',
  votes: {}
}

export interface StrawpollVoteData {
  voterID: string
}

export interface StrawpollProps extends RouteComponentProps<URLParameters> {
} 


export default function Strawpoll(props: StrawpollProps) {
    const { committeeID, strawpollID } = props.match.params;
    const strawpollFref = getStrawpollRef(committeeID, strawpollID)
    const { error, loading, value: strawpoll } = useObject(strawpollFref);
    const stage = strawpoll ? strawpoll.val().stage || StrawpollStage.Results : StrawpollStage.Voting;
    const options: Dictionary<StrawpollOptionID, StrawpollOptionData> = 
      strawpoll ? strawpoll.val().options || {}: {};
    const { initialising, user } = useAuthState(firebase.auth());

    const [voterID, setVoterID] = useLocalStorage('voterID', undefined);
    if (!voterID) {
      setVoterID(uuidv4())
    }

    const addOption = () => {
      strawpollFref.child('options').push(DEFAULT_STRAWPOLL_OPTION);
    }

    const createPoll = () => {
      strawpollFref.child('stage').set(StrawpollStage.Voting);
    }

    const editOptions = () => {
      strawpollFref.child('stage').set(StrawpollStage.Preparing);
    }

    const viewResults = () => {
      strawpollFref.child('stage').set(StrawpollStage.Results);
    }

    const onCheck = (oid: StrawpollOptionID) => (event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => {
      if (data.checked) {
        strawpollFref
          .child('options')
          .child(oid)
          .child('votes')
          .child(voterID)
          .set(true)
      } else {
        strawpollFref
          .child('options')
          .child(oid)
          .child('votes')
          .child(voterID)
          .remove()
      }
    }

    const renderOption = (optionID: StrawpollOptionID, option: StrawpollOptionData) => {
      const strawpollOptionFref = strawpollFref
        .child('options')
        .child(optionID);

      const isChecked = 
        option.votes 
          ? option.votes[voterID] 
            ? !!option.votes[voterID]
            : false
          : false

      const count = Object.keys(option.votes || {}).length

      switch (stage) {
        case StrawpollStage.Preparing:
          return <List.Item key={optionID}>
            <Input
              value={option.text}
              onChange={fieldHandler<StrawpollOptionData>(strawpollOptionFref, 'text')}
              fluid
              placeholder="Enter poll option"
              action
            >
              <input />
              <Button
                negative
                icon="trash"
                basic
                onClick={() => strawpollOptionFref.remove()}
              />
            </Input>
          </List.Item>
        case StrawpollStage.Voting:
          return <Form.Field key={optionID}>
            <Checkbox
              label={option.text}
              name='checkboxRadioGroup'
              value={option.text}
              checked={isChecked}
              onChange={onCheck(optionID)}
            />
          </Form.Field>
        case StrawpollStage.Results:
          return <List.Item key={optionID}>
            {count} votes for {option.text}
          </List.Item>
        default:
          <div />
      }
    }

  let buttons = <div />;

  switch (stage) {
    case StrawpollStage.Preparing:
      buttons =
        <Button.Group fluid>
          <Button
            color="purple"
            basic
            onClick={addOption}
          >
            <Icon name="plus" />Add Option
          </Button>
          <Button
            primary
            basic
            onClick={createPoll}
          >
            Create poll
            </Button>
        </Button.Group>
      break;
    case StrawpollStage.Voting:
      buttons =
        <Button.Group fluid>
          <Button
            basic
            color="purple"
            onClick={editOptions}
          >
            Edit options
          </Button>
          <Button
            primary
            basic
            disabled={!user}
            onClick={viewResults}
          >
            View results
          </Button>
        </Button.Group>
      break;
    case StrawpollStage.Results:
      buttons = 
        <Button
          fluid
          primary
          basic
          
          onClick={createPoll}
        >
          Reopen voting
        </Button>
      break;
    default:
      break;
  }

    return !loading ? (
        <Container text style={{ padding: '1em 0em' }}>
          <Header as="h2">
            <Input
              value={strawpoll ? strawpoll.val().question : ''}
              onChange={fieldHandler<StrawpollData>(strawpollFref, 'question')}
              fluid
              placeholder="Type your question here"
            />
          </Header>
          <List>
            {Object.keys(options).map(key => {
              return renderOption(key, options[key])
            })}
          </List>
          {buttons}
        </Container>
      ) : <Loading />
}