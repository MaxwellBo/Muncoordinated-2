import * as firebase from 'firebase/app';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { URLParameters, Dictionary } from '../types';
import { getStrawpollRef } from '../actions/strawpoll-actions';
import { useObject } from 'react-firebase-hooks/database';
import { Container, Header, Input, Button, List, Icon, Checkbox, Form, Modal, CheckboxProps, Progress } from 'semantic-ui-react';
import { fieldHandler, clearableZeroableValidatedNumberFieldHandler } from '../actions/handlers';
import Loading from './Loading';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useLocalStorage, uuidv4 } from '../utils';
import { StrawpollShareHint } from './ShareHint';
import { NotFound } from './NotFound';

enum StrawpollStage {
  Preparing = 'preparing',
  Voting = 'voting',
  Results = 'results',
}

enum StrawpollType {
  Checkbox = 'checkbox',
  Radio = 'radio'
}

enum StrawpollMedium {
  Manual = 'manual',
  Link = 'link'
}

export type StrawpollID = string;
export type StrawpollOptionID = string;
export type StrawpollVoteID = string;

export const DEFAULT_STRAWPOLL: StrawpollData = {
  question: 'undefined question',
  stage: StrawpollStage.Preparing,
  type: StrawpollType.Checkbox,
  medium: StrawpollMedium.Link,
  options: {},
}

export interface StrawpollData {
  question: string
  type: StrawpollType
  stage: StrawpollStage
  medium?: StrawpollMedium
  options?: Dictionary<StrawpollOptionID, StrawpollOptionData>
}

export interface StrawpollOptionData {
  text: string
  votes?: Dictionary<StrawpollVoteID, StrawpollVoteData>
  tally?: number
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

export interface ModalProps {
  open: boolean,
  onChangeOpenState: (open: boolean) => void,
  onConfirm: Function,
  trigger: React.ReactElement<Button>
}

function getNumberOfVotes(option: StrawpollOptionData, medium: StrawpollMedium) {

  if (medium === StrawpollMedium.Manual) {
    return option.tally || 0;
  } else {
    let votes = 0;

    Object.keys(option.votes || {}).forEach(vid => {
      votes += 1;
    })

    return votes;
  }
}

export function StrawpollModal(props: ModalProps) {
  const onYesClick = () => {
    props.onConfirm()
    props.onChangeOpenState(false)
  }

  const onNoClick = () => {
    props.onChangeOpenState(false)
  }

  return (
    <Modal
      size={"mini"}
      centered={false}
      open={props.open}
      onClose={() => props.onChangeOpenState(false)}
      onOpen={() => props.onChangeOpenState(true)}
      trigger={props.trigger}
    >
      <Modal.Header>Delete strawpoll?</Modal.Header>
      <Modal.Content>
        <Modal.Description>
          Are you sure that you want to delete this strawpoll? 
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <Button negative onClick={onYesClick}>Yes</Button>
        <Button onClick={onNoClick}>No</Button>
      </Modal.Actions>
    </Modal>
  )
}

export default function Strawpoll(props: StrawpollProps) {
    const { committeeID, strawpollID } = props.match.params;
    const strawpollFref = getStrawpollRef(committeeID, strawpollID)
    const  [value, loading] = useObject(strawpollFref);
    const [user] = useAuthState(firebase.auth());
    const [voterID, setVoterID] = useLocalStorage('voterID', undefined);
    const [modalOpen, setOpen] = React.useState(false)

    if (!voterID) {
      setVoterID(uuidv4())
    }


    if (loading) {
      return <Loading />
    }

    const strawpoll: StrawpollData | undefined = value ? value.val() : undefined;

    if (!strawpoll) {
      return <Container text>
        <NotFound id={strawpollID} item="strawpoll" />
      </Container>;
    }

    const stage: StrawpollStage = strawpoll ? strawpoll.stage || StrawpollStage.Results : StrawpollStage.Voting;
    const medium: StrawpollMedium = strawpoll ? strawpoll.medium || StrawpollMedium.Link : StrawpollMedium.Link;
    const options: Dictionary<StrawpollOptionID, StrawpollOptionData> = 
      strawpoll ? strawpoll.options || {}: {};

    let totalVotes = 0;

    Object.keys(options).forEach(oid => {
      totalVotes += getNumberOfVotes(options[oid], medium)
    })

    const addOption = () => {
      strawpollFref.child('options').push(DEFAULT_STRAWPOLL_OPTION);
    }

    const deleteStrawpoll = () => {
      strawpollFref.remove();
    }

    const createSharablePoll = () => {
      strawpollFref.child('stage').set(StrawpollStage.Voting);
      strawpollFref.child('medium').set(StrawpollMedium.Link);
    }

    const createManualPoll = () => {
      strawpollFref.child('stage').set(StrawpollStage.Voting);
      strawpollFref.child('medium').set(StrawpollMedium.Manual);
    }

    const reopenVoting = () => {
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

      const votes = getNumberOfVotes(option, medium);

      /* eslint no-unused-expressions: "warn" */
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
          return medium === StrawpollMedium.Link ? <Form.Field key={optionID}>
            <Checkbox
              label={option.text}
              name='checkboxRadioGroup'
              value={option.text}
              checked={isChecked}
              onChange={onCheck(optionID)}
            />
          </Form.Field> : 
            <List.Item key={optionID}>
              <Input
                fluid
                placeholder="Number of votes received"
                label={option.text}
                value={(!!option.tally || (option.tally === 0) ? option.tally : '').toString()}
                error={option.tally === undefined}
                onChange={clearableZeroableValidatedNumberFieldHandler<StrawpollOptionData>(strawpollOptionFref, 'tally')}
              />
            </List.Item>
        case StrawpollStage.Results:
          return <List.Item key={optionID}>
            <b>{option.text}</b> {votes} votes
            <Progress progress='value' value={votes} total={totalVotes} />
          </List.Item>
        default:
          return <div />
      }
    }

  let buttons = <div />;

  switch (stage) {
    case StrawpollStage.Preparing:
      let deleteButton =        
        <Button
        color="red"
        basic
        onClick={()=> setOpen(true)}
      >
        <Icon name="delete" />Delete Strawpoll
      </Button>
      
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
            onClick={createSharablePoll}
          >
            Create sharable poll
            </Button>
          <Button
            primary
            basic
            onClick={createManualPoll}
          >
            Create manual poll
            </Button>
          <StrawpollModal open={modalOpen} onChangeOpenState={setOpen} onConfirm={deleteStrawpoll} trigger={deleteButton} />
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
          onClick={reopenVoting}
        >
          Reopen voting
        </Button>
      break;
    default:
      break;
  }

  const optionsTree = Object.keys(options).map(key => {
    return renderOption(key, options[key])
  })


  return (
      <Container text style={{ padding: '1em 0em' }}>
        <Header as="h2">
          <Input
            value={strawpoll ? strawpoll.question : ''}
            onChange={fieldHandler<StrawpollData>(strawpollFref, 'question')}
            fluid
            placeholder="Type your question here"
          />
        </Header>
        {stage === StrawpollStage.Voting && medium === StrawpollMedium.Link &&
          <StrawpollShareHint committeeID={committeeID} strawpollID={strawpollID} />
        }
        <List>
          {optionsTree}
        </List>
        {buttons}
      </Container>
    );
}
