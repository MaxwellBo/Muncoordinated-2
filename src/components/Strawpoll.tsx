import * as firebase from 'firebase/app';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { URLParameters } from '../types';
import { getStrawpollRef } from '../actions/strawpoll-actions';
import { useObject } from 'react-firebase-hooks/database';
import { Container, Header, Input, Button, List, Icon, Checkbox, Form, Modal, CheckboxProps, DropdownProps, Progress, Dropdown } from 'semantic-ui-react';
import { Helmet } from 'react-helmet';
import { fieldHandler, clearableZeroableValidatedNumberFieldHandler } from '../actions/handlers';
import Loading from './Loading';
import { useAuthState } from 'react-firebase-hooks/auth';
import { StrawpollShareHint } from './ShareHint';
import { NotFound } from './NotFound';
import { useVoterID } from '../hooks';

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
  options?: Record<StrawpollOptionID, StrawpollOptionData>
}

export interface StrawpollOptionData {
  text: string
  votes?: Record<StrawpollVoteID, StrawpollVoteData>
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

export function DeleteStrawpollModal(props: ModalProps) {
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
    const [voterID] = useVoterID()
    const [modalOpen, setOpen] = React.useState(false)

    if (loading) {
      return <Loading />
    }

    const strawpoll: StrawpollData | undefined = value ? value.val() : undefined;

    if (!strawpoll) {
      return <Container text>
        <NotFound id={strawpollID} item="strawpoll" />
      </Container>;
    }

    const type: StrawpollType = strawpoll ? strawpoll.type || StrawpollType.Checkbox : StrawpollType.Checkbox;
    const stage: StrawpollStage = strawpoll ? strawpoll.stage || StrawpollStage.Preparing : StrawpollStage.Preparing;
    const medium: StrawpollMedium = strawpoll ? strawpoll.medium || StrawpollMedium.Link : StrawpollMedium.Link;
    const options: Record<StrawpollOptionID, StrawpollOptionData> = 
      strawpoll ? strawpoll.options || {}: {};

    let totalVotes = 0;

    Object.keys(options).forEach(oid => {
      totalVotes += getNumberOfVotes(options[oid], medium)
    })

    const addOption = () => {
      strawpollFref.child('options').push(DEFAULT_STRAWPOLL_OPTION);
    }

    const togglePollType = (event: React.SyntheticEvent, data: DropdownProps) => {
      strawpollFref.child('type').set(data.value);
      // reset votes
      Object.keys(options).forEach(oid => {
        const votes = options[oid].votes;
        if (votes) {
          strawpollFref.child('options').child(oid).child('votes').set({})
        }
      });
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
      if (type === StrawpollType.Checkbox) {
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
      } else if (type === StrawpollType.Radio) {
        if (data.checked) {
          // Set everything to unchecked
          Object.keys(options).forEach(id =>
            strawpollFref
              .child('options')
              .child(id)
              .child('votes')
              .child(voterID)
              .remove()
          );
          strawpollFref
            .child('options')
            .child(oid)
            .child('votes')
            .child(voterID)
            .set(true);
        }
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
              radio={type === StrawpollType.Radio || undefined}
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
          return undefined
      }
    }

  const renderOptions = () => {
    return <List>
      {Object.keys(options).map(key => {
        return renderOption(key, options[key])
      })}
      {stage === StrawpollStage.Preparing && <List.Item>
        <Button
          basic
          fluid
          onClick={addOption}
        >
          <Icon name="plus" />Add option
        </Button>
      </List.Item>
    }
    </List>
  }

  const renderMetaButtons = () => {
    switch (stage) {
      case StrawpollStage.Preparing:
        return (
          <Button.Group fluid>
            <Dropdown
              basic 
              button
              className="purple centered"
              upward={false}
              options={[{
                key: StrawpollType.Checkbox,
                value: StrawpollType.Checkbox,
                text: "Choose many",
                icon: "check square"
              }, {
                key: StrawpollType.Radio,
                value: StrawpollType.Radio,
                text: "Choose one",
                icon: "radio"
              }]}
              onChange={togglePollType}
              value={type}
            />
            <DeleteStrawpollModal 
              open={modalOpen} 
              onChangeOpenState={setOpen} 
              onConfirm={deleteStrawpoll} 
              trigger={
                <Button
                  color="red"
                  basic
                  onClick={()=> setOpen(true)}
                >
                  <Icon name="delete" />Delete strawpoll?
                </Button>
              } 
            />
          </Button.Group>
        )
        case StrawpollStage.Voting:
          return medium === StrawpollMedium.Link 
            && <StrawpollShareHint 
              committeeID={committeeID} 
              strawpollID={strawpollID} 
            /> 
        default:
          return undefined

    }
  }

  const renderNavButtons = () => {
    switch (stage) {
      case StrawpollStage.Preparing:
        return (
          <Button.Group fluid>
            <Button
              primary
              basic
              onClick={createSharablePoll}
            >
              Create shareable poll
              <Icon name="arrow right" />
              </Button>
            <Button.Or />
            <Button
              primary
              basic
              onClick={createManualPoll}
            >
              Create manual poll
              <Icon name="arrow right" />
              </Button>
          </Button.Group>
        );
      case StrawpollStage.Voting:
        return (
          <Button.Group fluid>
            <Button
              basic
              secondary
              onClick={editOptions}
            >
              <Icon name="arrow left" />
              Edit options
            </Button>
            <Button
              primary
              basic
              disabled={!user}
              onClick={viewResults}
            >
              View results
              <Icon name="arrow right" />
            </Button>
          </Button.Group>
        )
      case StrawpollStage.Results:
       return (
          <Button
            fluid
            secondary
            basic
            onClick={reopenVoting}
          >
            <Icon name="arrow left" />
            Reopen voting
          </Button>
       )
      default:
        return <div />;
    }
  }

  return (
      <Container text style={{ padding: '1em 0em' }}>
        <Helmet>
          <title>{`${strawpoll.question} - Muncoordinated`}</title>
        </Helmet>
        <Header as="h2">
          <Input
            value={strawpoll ? strawpoll.question : ''}
            onChange={fieldHandler<StrawpollData>(strawpollFref, 'question')}
            fluid
            placeholder="Type your question here"
          />
        </Header>
        {renderMetaButtons()}
        {renderOptions()}
        {renderNavButtons()}
      </Container>
    );
}
