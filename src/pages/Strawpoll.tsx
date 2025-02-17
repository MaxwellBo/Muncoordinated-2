import firebase from 'firebase/compat/app';
import * as React from 'react';
import { RouteComponentProps } from 'react-router';
import { URLParameters } from '../types';
import {
  DEFAULT_STRAWPOLL_OPTION,
  getStrawpollRef,
  StrawpollData,
  StrawpollMedium,
  StrawpollOptionData,
  StrawpollOptionID,
  StrawpollStage,
  StrawpollType
} from '../models/strawpoll';
import { useObjectVal } from 'react-firebase-hooks/database';
import {
  Button,
  Checkbox,
  CheckboxProps,
  Container,
  Dropdown,
  DropdownProps,
  Form,
  Header,
  Icon,
  Input,
  List,
  Modal,
  Progress
} from 'semantic-ui-react';
import { modularCheckboxHandler, modularClearableZeroableValidatedNumberFieldHandler, modularFieldHandler } from '../modules/handlers';
import Loading from '../components/Loading';
import { useAuthState } from 'react-firebase-hooks/auth';
import { StrawpollShareHint } from '../components/share-hints';
import { NotFound } from '../components/NotFound';
import { useVoterID } from '../hooks';
import { push, remove, set, child } from 'firebase/database';
import { Helmet } from 'react-helmet';
import { FormattedMessage, injectIntl, type IntlShape } from 'react-intl';

export interface StrawpollProps extends RouteComponentProps<URLParameters> {
  intl: IntlShape;
}

interface ModalProps {
  open: boolean;
  onChangeOpenState: (open: boolean) => void;
  onConfirm: () => void;
  trigger: React.ReactElement<typeof Button>;
  intl: IntlShape;
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

function DeleteStrawpollModal({ open, onChangeOpenState, onConfirm, trigger, intl }: ModalProps) {
  const onYesClick = () => {
    onConfirm();
    onChangeOpenState(false);
  };

  const onNoClick = () => {
    onChangeOpenState(false);
  };

  return (
    <Modal
      size="mini"
      centered={false}
      open={open}
      onClose={() => onChangeOpenState(false)}
      onOpen={() => onChangeOpenState(true)}
      trigger={trigger}
    >
      <Modal.Header>
        <FormattedMessage id="strawpoll.delete.title" defaultMessage="Delete strawpoll?" />
      </Modal.Header>
      <Modal.Content>
        <Modal.Description>
          <FormattedMessage 
            id="strawpoll.delete.confirm" 
            defaultMessage="Are you sure that you want to delete this strawpoll?" 
          />
        </Modal.Description>
      </Modal.Content>
      <Modal.Actions>
        <Button negative onClick={onYesClick}>
          <FormattedMessage id="strawpoll.action.yes" defaultMessage="Yes" />
        </Button>
        <Button onClick={onNoClick}>
          <FormattedMessage id="strawpoll.action.no" defaultMessage="No" />
        </Button>
      </Modal.Actions>
    </Modal>
  );
}

function StrawpollComponent(props: StrawpollProps) {
  const { committeeID, strawpollID } = props.match.params;
  const strawpollFref = getStrawpollRef(committeeID, strawpollID);
  const [value, loading] = useObjectVal<StrawpollData>(strawpollFref);
  const [user] = useAuthState(firebase.auth() as any);
  const [voterID] = useVoterID();
  const [modalOpen, setOpen] = React.useState(false);

  if (loading) {
    return <Loading />;
  }

  const strawpoll = value as StrawpollData | undefined;

  if (!strawpoll) {
    return (
      <Container text>
        <NotFound id={strawpollID} item="strawpoll" />
      </Container>
    );
  }

  const type = strawpoll.type || StrawpollType.Checkbox;
  const stage = strawpoll.stage || StrawpollStage.Preparing;
  const medium = strawpoll.medium || StrawpollMedium.Link;
  const options = strawpoll.options || {};

  let totalVotes = 0;

  Object.keys(options).forEach(oid => {
    totalVotes += getNumberOfVotes(options[oid], medium);
  });

  const addOption = () => {
    push(child(strawpollFref, 'options'), DEFAULT_STRAWPOLL_OPTION);
  }

  const togglePollType = (event: React.SyntheticEvent<HTMLElement>, data: DropdownProps) => {
    set(child(strawpollFref, 'type'), data.value as StrawpollType);
    // reset votes
    Object.keys(options).forEach(oid => {
      const votes = options[oid].votes;
      if (votes) {
        set(child(child(child(strawpollFref, 'options'), oid), 'votes'), {});
      }
    });
  };

  const handleCheckboxChange = (event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => {
    modularCheckboxHandler<StrawpollData>(strawpollFref, 'optionsArePublic')(event, data);
  };

  const deleteStrawpoll = () => {
    remove(strawpollFref);
  }

  const createSharablePoll = () => {
    set(child(strawpollFref, 'stage'), StrawpollStage.Voting);
    set(child(strawpollFref, 'medium'), StrawpollMedium.Link);
  }

  const createManualPoll = () => {
    set(child(strawpollFref, 'stage'), StrawpollStage.Voting);
    set(child(strawpollFref, 'medium'), StrawpollMedium.Manual);
  }

  const reopenVoting = () => {
    set(child(strawpollFref, 'stage'), StrawpollStage.Voting);
  }

  const editOptions = () => {
    set(child(strawpollFref, 'stage'), StrawpollStage.Preparing);
  }

  const viewResults = () => {
    set(child(strawpollFref, 'stage'), StrawpollStage.Results);
  }

  const onCheck = (oid: StrawpollOptionID) => (event: React.FormEvent<HTMLInputElement>, data: CheckboxProps) => {
    if (type === StrawpollType.Checkbox) {
      if (data.checked) {
        set(child(strawpollFref, `options/${oid}/votes/${voterID}`), true);
      } else {
        remove(child(strawpollFref, `options/${oid}/votes`))
      }
    } else if (type === StrawpollType.Radio) {
      if (data.checked) {
        // Set everything to unchecked
        Object.keys(options).forEach(id =>
          remove(child(strawpollFref, `options/${id}/votes/${voterID}`)).catch(console.error)
        );
        set(child(strawpollFref, `options/${oid}/votes/${voterID}`), true);
      }
    }
  }

  const renderOption = (optionID: StrawpollOptionID, option: StrawpollOptionData) => {
    const strawpollOptionFref = child(child(strawpollFref, 'options'), optionID);

    const isChecked = option.votes ? (option.votes[voterID] ? !!option.votes[voterID] : false) : false;
    const votes = getNumberOfVotes(option, medium);

    switch (stage) {
      case StrawpollStage.Preparing:
        return (
          <List.Item key={optionID}>
            <Input
              value={option.text}
              onChange={modularFieldHandler<StrawpollOptionData>(strawpollOptionFref, 'text')}
              fluid
              placeholder={props.intl.formatMessage({ 
                id: 'strawpoll.option.placeholder', 
                defaultMessage: 'Enter poll option' 
              })}
              action
            >
              <input />
              <Button
                negative
                icon="trash"
                basic
                onClick={() => remove(strawpollOptionFref)}
              />
            </Input>
          </List.Item>
        );
      case StrawpollStage.Voting:
        return medium === StrawpollMedium.Link ? (
          <Form.Field key={optionID}>
            <Checkbox
              label={option.text}
              name="checkboxRadioGroup"
              radio={type === StrawpollType.Radio || undefined}
              value={option.text}
              checked={isChecked}
              onChange={onCheck(optionID)}
            />
          </Form.Field>
        ) : (
          <List.Item key={optionID}>
            <Input
              fluid
              placeholder={props.intl.formatMessage({ 
                id: 'strawpoll.votes.placeholder', 
                defaultMessage: 'Number of votes received' 
              })}
              label={option.text}
              value={(!!option.tally || option.tally === 0 ? option.tally : '').toString()}
              error={option.tally === undefined}
              onChange={modularClearableZeroableValidatedNumberFieldHandler<StrawpollOptionData>(
                strawpollOptionFref,
                'tally'
              )}
            />
          </List.Item>
        );
      case StrawpollStage.Results:
        return (
          <List.Item key={optionID}>
            <b>{option.text}</b>{' '}
            <FormattedMessage 
              id="strawpoll.votes.count" 
              defaultMessage="{votes} votes" 
              values={{ votes }} 
            />
            <Progress progress="value" value={votes} total={totalVotes} />
          </List.Item>
        );
      default:
        return undefined;
    }
  };

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
          <Icon name="plus" />
          <FormattedMessage id="strawpoll.button.add.option" defaultMessage="Add option" />
        </Button>
      </List.Item>
      }
    </List>
  }

  const renderMetaButtons = () => {
    switch (stage) {
      case StrawpollStage.Preparing:
        return (
          <List>
            <List.Item>
              <Button.Group fluid>
                <Dropdown
                  basic
                  button
                  className="purple centered"
                  upward={false}
                  options={[{
                    key: StrawpollType.Checkbox,
                    value: StrawpollType.Checkbox,
                    text: props.intl.formatMessage({ id: 'strawpoll.dropdown.choose.many', defaultMessage: 'Choose many' }),
                    icon: "check square"
                  }, {
                    key: StrawpollType.Radio,
                    value: StrawpollType.Radio,
                    text: props.intl.formatMessage({ id: 'strawpoll.dropdown.choose.one', defaultMessage: 'Choose one' }),
                    icon: "radio"
                  }]}
                  onChange={togglePollType}
                  value={type}
                />
                <DeleteStrawpollModal
                  open={modalOpen}
                  onChangeOpenState={setOpen}
                  onConfirm={deleteStrawpoll}
                  intl={props.intl}
                  trigger={
                    <Button
                      color="red"
                      basic
                      onClick={() => setOpen(true)}
                    >
                      <Icon name="delete" />
                      <FormattedMessage id="strawpoll.button.delete" defaultMessage="Delete strawpoll?" />
                    </Button>
                  }
                />
              </Button.Group>
            </List.Item>
            <List.Item>
              <Checkbox
                label={<FormattedMessage id="strawpoll.checkbox.delegates.options" defaultMessage="Delegates can add options" />}
                toggle
                checked={strawpoll ? (strawpoll.optionsArePublic || false) : false}
                onChange={handleCheckboxChange}
              />
            </List.Item>
          </List>
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
              <FormattedMessage id="strawpoll.button.create.shareable" defaultMessage="Create shareable poll" />
              <Icon name="arrow right" />
            </Button>
            <Button.Or />
            <Button
              primary
              basic
              onClick={createManualPoll}
            >
              <FormattedMessage id="strawpoll.button.create.manual" defaultMessage="Create manual poll" />
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
              <FormattedMessage id="strawpoll.button.edit.options" defaultMessage="Edit options" />
            </Button>
            <Button
              primary
              basic
              disabled={!user}
              onClick={viewResults}
            >
              <FormattedMessage id="strawpoll.button.view.results" defaultMessage="View results" />
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
            <FormattedMessage id="strawpoll.button.reopen.voting" defaultMessage="Reopen voting" />
          </Button>
        )
      default:
        return <div />;
    }
  }

  return (
    <Container text style={{ padding: '1em 0em 1.5em' }}>
      <Helmet>
        <title>
          <FormattedMessage 
            id="strawpoll.page.title" 
            defaultMessage="Strawpoll - {pollName}" 
            values={{ pollName: strawpoll?.question || 'Untitled' }}
          />
        </title>
      </Helmet>
      <Header as="h2">
        {strawpoll.question || (
          <FormattedMessage id="strawpoll.untitled" defaultMessage="Untitled Strawpoll" />
        )}
      </Header>
      {renderMetaButtons()}
      {renderOptions()}
      {renderNavButtons()}
    </Container>
  );
}

export default injectIntl(StrawpollComponent);
