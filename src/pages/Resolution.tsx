import * as React from 'react';
import firebase from 'firebase/compat/app';
import * as _ from 'lodash';
import {canVote, MemberData, MemberID, nameToMemberOption, Rank} from '../modules/member';
import {
  Button,
  Card,
  Confirm,
  Container,
  Dropdown,
  Form,
  Grid,
  Icon,
  Input,
  Label,
  List,
  Message,
  Popup,
  Segment,
  SemanticCOLORS,
  SemanticICONS,
  Statistic,
  Tab,
  TabProps,
  TextArea,
  Table,
  Header,
  Divider
} from 'semantic-ui-react';
import {RouteComponentProps} from 'react-router';
import {URLParameters} from '../types';
import {
  checkboxHandler,
  dropdownHandler,
  fieldHandler,
  memberDropdownHandler,
  textAreaHandler
} from '../modules/handlers';
import {
  AMENDMENT_STATUS_OPTIONS,
  AmendmentData,
  AmendmentID,
  DEFAULT_AMENDMENT, DEFAULT_RESOLUTION, Majority, MAJORITY_OPTIONS,
  recoverLinkedCaucus, RESOLUTION_STATUS_OPTIONS, ResolutionData, ResolutionID, ResolutionStatus, Vote,
  voteOnResolution
} from '../models/resolution';
import {CaucusData, CaucusID, DEFAULT_CAUCUS, putCaucus, Stance} from '../models/caucus';
import {NotFound} from '../components/NotFound';
import Files from './Files';
import {CommitteeStatsTable} from '../modules/committee-stats';
import {CommitteeData, recoverMemberOptions} from "../models/committee";
import {getThreshold, getThresholdName} from "../viewmodels/resolution";
import { Helmet } from 'react-helmet';
import { FormattedMessage, injectIntl, type IntlShape } from 'react-intl';
import Loading from '../components/Loading';

const TAB_ORDER = ['feed', 'text', 'amendments', 'voting'];

export const IDENTITCAL_PROPOSER_SECONDER = (
  <Message error>
    <FormattedMessage 
      id="resolution.error.same.proposer.seconder" 
      defaultMessage="A resolution's proposer and seconder cannot be the same" 
    />
  </Message>
);

export const DELEGATES_CAN_AMEND_NOTICE = (
  <Message basic attached="bottom">
    <FormattedMessage 
      id="resolution.notice.delegates.amend" 
      defaultMessage="Delegates can create and edit, but not delete, amendments." 
    />
  </Message>
);

interface DeleteResolutionModalProps {
  onConfirm: () => void;
  intl: IntlShape;
}

function DeleteResolutionModal(props: DeleteResolutionModalProps) {
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  return (
    <>
      <Dropdown.Item 
        negative 
        fluid 
        basic
        onClick={() => setIsModalOpen(true)}
      >
        <Icon name="delete" />
        <FormattedMessage id="resolution.action.delete" defaultMessage="Delete resolution?" />
      </Dropdown.Item>
      <Confirm
        open={isModalOpen}
        header={props.intl.formatMessage({ 
          id: 'resolution.delete.title', 
          defaultMessage: 'Delete resolution?' 
        })}
        content={props.intl.formatMessage({ 
          id: 'resolution.delete.confirm', 
          defaultMessage: 'Are you sure? This is irreversible and will delete all posts, text, amendments and voting history. You might want to close the resolution (top right dropdown) instead?' 
        })}
        onCancel={() => setIsModalOpen(false)}
        onConfirm={() => { setIsModalOpen(false); props.onConfirm(); }}
      />
    </>
  );
}

const DeleteResolutionModalWithIntl = injectIntl(DeleteResolutionModal);

interface Props extends RouteComponentProps<URLParameters> {
  intl: IntlShape;
}

interface State {
  committeeFref: firebase.database.Reference;
  committee?: CommitteeData;
  authUnsubscribe?: () => void;
  user?: firebase.User | null;
  loading: boolean;
}

export default class Resolution extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { match } = props;

    this.state = {
      committeeFref: firebase.database().ref('committees').child(match.params.committeeID),
      loading: true
    };
  }

  authStateChangedCallback = (user: firebase.User | null) => {
    this.setState({ user: user });
  }

  firebaseCallback = (committee: firebase.database.DataSnapshot | null) => {
    if (committee) {
      this.setState({ committee: committee.val(), loading: false });
    }
  }

  componentDidMount() {
    this.state.committeeFref.on('value', this.firebaseCallback);

    const authUnsubscribe = firebase.auth().onAuthStateChanged(
      this.authStateChangedCallback,
    );

    this.setState({ authUnsubscribe });
  }

  componentWillUnmount() {
    this.state.committeeFref.off('value', this.firebaseCallback);

    if (this.state.authUnsubscribe) {
      this.state.authUnsubscribe();
    }
  }

  recoverResolutionFref = () => {
    const resolutionID: ResolutionID = this.props.match.params.resolutionID;

    return this.state.committeeFref
      .child('resolutions')
      .child(resolutionID);
  }

  handlePushAmendment = (): void => {
    this.recoverResolutionFref().child('amendments').push().set(DEFAULT_AMENDMENT);
  }

  handleProvisionAmendment = (id: AmendmentID, amendment: AmendmentData) => {
    const { committeeID } = this.props.match.params;
    const { proposer, text } = amendment;
    const { intl } = this.props;

    const newCaucus: CaucusData = {
      ...DEFAULT_CAUCUS,
      name: intl.formatMessage(
        { 
          id: 'resolution.amendment.caucus.name', 
          defaultMessage: 'Amendment by {proposer}' 
        },
        { proposer: amendment.proposer }
      ),
      topic: text,
      speaking: {
        duration: DEFAULT_CAUCUS.speakerTimer.remaining,
        who: proposer,
        stance: Stance.For,
      }
    };

    const ref = putCaucus(committeeID, newCaucus);

    this.recoverResolutionFref().child('amendments').child(id).child('caucus').set(ref.key);

    this.gotoCaucus(ref.key);
  }

  gotoCaucus = (caucusID: CaucusID | null | undefined) => {
    const { committeeID } = this.props.match.params;

    if (caucusID) {
      this.props.history
        .push(`/committees/${committeeID}/caucuses/${caucusID}`);
    }
  }

  handleProvisionResolution = (resolutionData: ResolutionData) => {
    const { committeeID } = this.props.match.params;
    const { proposer, seconder, name } = resolutionData;

    const newCaucus: CaucusData = {
      ...DEFAULT_CAUCUS,
      name: name,
      speaking: {
        duration: DEFAULT_CAUCUS.speakerTimer.remaining,
        who: proposer || '', // defend against undefined proposers
        stance: Stance.For,
      }
    };

    const ref = putCaucus(committeeID, newCaucus);

    ref.child('queue').push().set({
      duration: DEFAULT_CAUCUS.speakerTimer.remaining,
      who: seconder,
      stance: Stance.For,
    });

    this.recoverResolutionFref().child('caucus').set(ref.key);

    this.gotoCaucus(ref.key);
  }

  renderAmendment = (id: AmendmentID, amendment: AmendmentData, amendmentFref: firebase.database.Reference) => {
    const { handleProvisionAmendment } = this;
    const { proposer, text, status } = amendment;
    const { user, committee } = this.state;
    const { intl } = this.props;

    let hasAuth = false;

    if (committee && user) {
      hasAuth = committee.creatorUid === user.uid;
    }

    const memberOptions = recoverMemberOptions(this.state.committee);

    return (
      <Card key={id}>
        <Card.Content>
          <Card.Header>
            <Dropdown
              disabled={!hasAuth}
              value={status}
              options={AMENDMENT_STATUS_OPTIONS}
              onChange={dropdownHandler<AmendmentData>(amendmentFref, 'status')}
            />
            <Button
              floated="right"
              icon="trash"
              negative
              disabled={!hasAuth}
              basic
              onClick={() => amendmentFref.remove()}
              title={intl.formatMessage({ 
                id: 'resolution.amendment.action.delete', 
                defaultMessage: 'Delete amendment' 
              })}
            />
            {recoverLinkedCaucus(amendment) ? (
              <Button
                floated="right"
                onClick={() => this.gotoCaucus(amendment.caucus)}
              >
                <FormattedMessage 
                  id="resolution.amendment.action.goto.caucus" 
                  defaultMessage="Associated caucus" 
                />
                <Icon name="arrow right" />
              </Button>
            ) : (
              <Button
                floated="right"
                disabled={!amendment || amendment.proposer === '' || !hasAuth}
                onClick={() => handleProvisionAmendment(id, amendment)}
              >
                <FormattedMessage 
                  id="resolution.amendment.action.provision" 
                  defaultMessage="Provision caucus" 
                />
              </Button>
            )}
          </Card.Header>
          <Card.Meta>
            <Form.Dropdown
              key="proposer"
              icon="search"
              value={nameToMemberOption(proposer).key}
              error={!proposer}
              search
              selection
              fluid
              label={<FormattedMessage 
                id="resolution.amendment.proposer.label" 
                defaultMessage="Proposer" 
              />}
              placeholder={intl.formatMessage({ 
                id: 'resolution.amendment.proposer.placeholder', 
                defaultMessage: 'Select proposer' 
              })}
              onChange={memberDropdownHandler<AmendmentData>(amendmentFref, 'proposer', memberOptions)}
              options={memberOptions}
            />
          </Card.Meta>
          <Form>
            <TextArea
              value={text}
              label={<FormattedMessage 
                id="resolution.amendment.text.label" 
                defaultMessage="Amendment text" 
              />}
              autoHeight
              onChange={textAreaHandler<AmendmentData>(amendmentFref, 'text')}
              rows={1}
              placeholder={intl.formatMessage({ 
                id: 'resolution.amendment.text.placeholder', 
                defaultMessage: 'Enter amendment text' 
              })}
            />
          </Form>
        </Card.Content>
      </Card>
    );
  }

  cycleVote = (memberID: MemberID, member: MemberData, currentVote?: Vote) => {
    const { resolutionID, committeeID } = this.props.match.params;

    // leave this be in the case of undefined and Against
    let newVote = undefined;

    if (currentVote === undefined) {
      newVote = Vote.For;
    } else if (currentVote === Vote.For) {
      if (member.voting) {
        newVote = Vote.Against;
      } else {
        newVote = Vote.Abstaining;
      }
    } else if (currentVote === Vote.Abstaining) {
      newVote = Vote.Against;
    } else if (currentVote === Vote.Against) {
      // delete the vote
    }

    voteOnResolution(committeeID, resolutionID, memberID, newVote);
  }

  renderVotingMember = (key: MemberID, member: MemberData, vote?: Vote) => {
    const { cycleVote } = this;

    let color: 'green' | 'yellow' | 'red' | undefined;
    let icon: SemanticICONS = 'question';

    if (vote === Vote.For) {
      color = 'green';
      icon = 'plus';
    } else if (vote === Vote.Abstaining) {
      color = 'yellow';
      icon = 'minus';
    } else if (vote === Vote.Against) {
      color = 'red';
      icon = 'remove';
    }

    const button = (
      <Button
        floated="left"
        color={color}
        icon
        onClick={() => cycleVote(key, member, vote)}
      >
        <Icon
          name={icon}
          color={color === 'yellow' ? 'black' : undefined}
        />
      </Button>
    );

    // const { voting, rank } = member;
    // const veto: boolean = rank === Rank.Veto;

    // const description = (
    //   <List.Description>
    //     Veto
    //   </List.Description>
    // );

    const voting = (
      <Popup
        trigger={<Label style={{ marginLeft: 5 }} circular size="mini" color="purple">V</Label>}
        content="Voting"
      />
    );

    return (
      <List.Item key={key}>
        {button}
        <List.Content verticalAlign="middle">
          <List.Header>
            {member.name.toUpperCase()}
            {member.voting && voting}
            {/* {!member.present && <Label circular color="red" size="mini">NP</Label>} */}
          </List.Header>
        </List.Content>
      </List.Item>
    );
  }

  renderStats = () => {
    const { committee } = this.state;

    return <CommitteeStatsTable verbose={false} data={committee} />;
  }

  renderCount = (key: string, color: SemanticCOLORS, icon: SemanticICONS, count: number) => {
   return (
      <Grid.Column key={key}>
        <Button
          key={'count' + key}
          color={color}
          icon
          fluid
        >
          {key.toUpperCase()}: {count}
        </Button>
      </Grid.Column>
    );
  }

  renderMajoritySelector = (resolution?: ResolutionData) => {
    const resolutionFref = this.recoverResolutionFref();
    const requiredMajority = resolution ? resolution.requiredMajority : undefined;

    return (
      <Dropdown
        placeholder="Select majority type"
        search
        options={MAJORITY_OPTIONS}
        onChange={dropdownHandler<ResolutionData>(resolutionFref, 'requiredMajority')}
        value={requiredMajority || DEFAULT_RESOLUTION.requiredMajority}
      />
    )

  }

  renderVoting = (resolution?: ResolutionData) => {
    const { committee } = this.state;
    const members = committee ? committee.members : undefined;

    if (!resolution || !members) {
      return <Loading />;
    }

    const votes = resolution.votes || {};
    const voting = Object.keys(members).filter(key => members[key].voting);

    if (voting.length === 0) {
      return (
        <Message warning>
          <FormattedMessage 
            id="resolution.voting.no.voters" 
            defaultMessage="No voting members in committee" 
          />
        </Message>
      );
    }

    const renderVoteCount = () => {
      const voteCount = {
        [Vote.For]: 0,
        [Vote.Against]: 0,
        [Vote.Abstaining]: 0
      };

      Object.keys(votes).forEach(vid => {
        const vote = votes[vid] as Vote;
        voteCount[vote] += 1;
      });

      return (
        <Statistic.Group>
          <Statistic color="green">
            <Statistic.Value>{voteCount[Vote.For]}</Statistic.Value>
            <Statistic.Label>
              <FormattedMessage 
                id="resolution.vote.infavor" 
                defaultMessage="In favor" 
              />
            </Statistic.Label>
          </Statistic>
          <Statistic color="red">
            <Statistic.Value>{voteCount[Vote.Against]}</Statistic.Value>
            <Statistic.Label>
              <FormattedMessage 
                id="resolution.vote.against" 
                defaultMessage="Against" 
              />
            </Statistic.Label>
          </Statistic>
          <Statistic color="grey">
            <Statistic.Value>{voteCount[Vote.Abstaining]}</Statistic.Value>
            <Statistic.Label>
              <FormattedMessage 
                id="resolution.vote.abstain" 
                defaultMessage="Abstain" 
              />
            </Statistic.Label>
          </Statistic>
        </Statistic.Group>
      );
    };

    return (
      <div>
        <Header as="h3">
          <FormattedMessage 
            id="resolution.voting.title" 
            defaultMessage="Voting" 
          />
        </Header>
        {renderVoteCount()}
        <Table compact celled>
          <Table.Header>
            <Table.Row>
              <Table.HeaderCell>
                <FormattedMessage 
                  id="resolution.voting.table.member" 
                  defaultMessage="Member" 
                />
              </Table.HeaderCell>
              <Table.HeaderCell>
                <FormattedMessage 
                  id="resolution.voting.table.vote" 
                  defaultMessage="Vote" 
                />
              </Table.HeaderCell>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {voting.map(key => this.renderVotingMember(key, members[key], votes[key]))}
          </Table.Body>
        </Table>
      </div>
    );
  }

  renderMeta = (resolution?: ResolutionData) => {
    const resolutionFref = this.recoverResolutionFref();
    const { handleProvisionResolution, amendmentsArePublic } = this;
    const { intl } = this.props;

    const memberOptions = recoverMemberOptions(this.state.committee);

    // TFW no null coalescing operator 
    const proposer = resolution
      ? resolution.proposer
      : undefined;

    const seconder = resolution
      ? resolution.seconder
      : undefined;

    const hasIdenticalProposerSeconder = proposer && seconder ? proposer === seconder : false;

    const proposerTree = (
      <Form.Dropdown
        key="proposer"
        icon="search"
        value={proposer ? nameToMemberOption(proposer).key : undefined}
        error={!proposer || hasIdenticalProposerSeconder}
        loading={!resolution}
        search
        selection
        fluid
        onChange={memberDropdownHandler<ResolutionData>(resolutionFref, 'proposer', memberOptions)}
        options={memberOptions}
        label={<FormattedMessage id="resolution.meta.proposer.label" defaultMessage="Proposer" />}
      />
    );

    const seconderTree = (
      <Form.Dropdown
        key="seconder"
        loading={!resolution}
        icon="search"
        value={seconder ? nameToMemberOption(seconder).key : undefined}
        error={!seconder || hasIdenticalProposerSeconder}
        search
        selection
        fluid
        onChange={memberDropdownHandler<ResolutionData>(resolutionFref, 'seconder', memberOptions)}
        options={memberOptions}
        label={<FormattedMessage id="resolution.meta.seconder.label" defaultMessage="Seconder" />}
      />
    );

    const hasError = hasIdenticalProposerSeconder;

    const provisionTree = this.hasLinkedCaucus(resolution) ? (
      <Form.Button
        loading={!resolution}
        disabled={!resolution}
        onClick={() => this.gotoCaucus(resolution!.caucus)}
      >
        <FormattedMessage id="resolution.meta.caucus.associated" defaultMessage="Associated caucus" />
        <Icon name="arrow right" />
      </Form.Button>
    ) : (
      <Form.Button
        loading={!resolution}
        disabled={!resolution || !resolution.proposer || !resolution.seconder || hasError}
        onClick={() => handleProvisionResolution(resolution!)}
      >
        <FormattedMessage id="resolution.meta.caucus.provision" defaultMessage="Provision caucus" />
      </Form.Button>
    );

    return (
      <React.Fragment>
        <Segment attached={amendmentsArePublic(resolution) ? 'top' : undefined}>
          <Form error={hasError}>
            {proposerTree}
            {seconderTree}
            {IDENTITCAL_PROPOSER_SECONDER}
            {provisionTree}
            <Form.Checkbox
              label={<FormattedMessage id="resolution.meta.amendments.public" defaultMessage="Delegates can amend" />}
              indeterminate={!resolution}
              toggle
              checked={amendmentsArePublic(resolution)}
              onChange={checkboxHandler<ResolutionData>(resolutionFref, 'amendmentsArePublic')}
            />
          </Form>
          {this.renderAdditionalOptions()}
        </Segment>
        {amendmentsArePublic(resolution) && DELEGATES_CAN_AMEND_NOTICE}
      </React.Fragment>
    );
  }

  renderText = (resolution?: ResolutionData) => {
    const { committee } = this.state;
    const { intl } = this.props;

    if (!resolution || !committee) {
      return <Loading />;
    }

    const { amendmentsArePublic } = this;

    if (!amendmentsArePublic(resolution)) {
      return (
        <Message info>
          <FormattedMessage 
            id="resolution.text.notice.private" 
            defaultMessage="Delegates cannot amend this resolution" 
          />
        </Message>
      );
    }

    return (
      <Form>
        <TextArea
          value={resolution.link}
          autoHeight
          onChange={textAreaHandler<ResolutionData>(this.recoverResolutionFref(), 'link')}
          rows={3}
          placeholder={intl.formatMessage({
            id: 'resolution.text.placeholder',
            defaultMessage: 'Enter resolution text'
          })}
        />
      </Form>
    );
  }

  renderHeader = (resolution?: ResolutionData) => {
    const { committee } = this.state;
    const members = committee ? committee.members : undefined;
    const { intl } = this.props;

    if (!resolution || !members) {
      return <Loading />;
    }

    const memberOptions = recoverMemberOptions(committee);
    const resolutionFref = this.recoverResolutionFref();

    return (
      <Form>
        <Form.Group>
          <Form.Input
            width={8}
            value={resolution.name}
            onChange={fieldHandler<ResolutionData>(resolutionFref, 'name')}
            fluid
            label={<FormattedMessage 
              id="resolution.header.name.label" 
              defaultMessage="Name" 
            />}
            placeholder={intl.formatMessage({
              id: 'resolution.header.name.placeholder',
              defaultMessage: 'Resolution name'
            })}
          />
          <Form.Dropdown
            width={4}
            icon="search"
            value={resolution.proposer ? nameToMemberOption(resolution.proposer).key : ''}
            error={!resolution.proposer}
            search
            selection
            fluid
            label={<FormattedMessage 
              id="resolution.header.proposer.label" 
              defaultMessage="Proposer" 
            />}
            placeholder={intl.formatMessage({
              id: 'resolution.header.proposer.placeholder',
              defaultMessage: 'Select proposer'
            })}
            onChange={memberDropdownHandler<ResolutionData>(resolutionFref, 'proposer', memberOptions)}
            options={memberOptions}
          />
          <Form.Dropdown
            width={4}
            icon="search"
            value={resolution.seconder ? nameToMemberOption(resolution.seconder).key : ''}
            error={!resolution.seconder}
            search
            selection
            fluid
            label={<FormattedMessage 
              id="resolution.header.seconder.label" 
              defaultMessage="Seconder" 
            />}
            placeholder={intl.formatMessage({
              id: 'resolution.header.seconder.placeholder',
              defaultMessage: 'Select seconder'
            })}
            onChange={memberDropdownHandler<ResolutionData>(resolutionFref, 'seconder', memberOptions)}
            options={memberOptions}
          />
        </Form.Group>
        {resolution.proposer && resolution.seconder && resolution.proposer === resolution.seconder && (
          <Message error>
            <FormattedMessage 
              id="resolution.header.error.same.proposer.seconder" 
              defaultMessage="The proposer and seconder cannot be the same member" 
            />
          </Message>
        )}
        <Form.Field>
          <label>
            <FormattedMessage 
              id="resolution.header.status.label" 
              defaultMessage="Status" 
            />
          </label>
          <Dropdown
            selection
            value={resolution.status}
            options={[
              { 
                key: ResolutionStatus.Introduced, 
                value: ResolutionStatus.Introduced, 
                text: intl.formatMessage({ 
                  id: 'resolution.status.introduced', 
                  defaultMessage: 'Introduced' 
                }) 
              },
              { 
                key: ResolutionStatus.Passed, 
                value: ResolutionStatus.Passed, 
                text: intl.formatMessage({ 
                  id: 'resolution.status.passed', 
                  defaultMessage: 'Passed' 
                }) 
              },
              { 
                key: ResolutionStatus.Failed, 
                value: ResolutionStatus.Failed, 
                text: intl.formatMessage({ 
                  id: 'resolution.status.failed', 
                  defaultMessage: 'Failed' 
                }) 
              }
            ]}
            onChange={dropdownHandler<ResolutionData>(resolutionFref, 'status')}
          />
        </Form.Field>
      </Form>
    );
  }

  getStatusText = (status: ResolutionStatus, intl: IntlShape) => {
    switch (status) {
      case ResolutionStatus.Introduced:
        return intl.formatMessage({ id: 'resolution.status.introduced', defaultMessage: 'Introduced' });
      case ResolutionStatus.Passed:
        return intl.formatMessage({ id: 'resolution.status.passed', defaultMessage: 'Passed' });
      case ResolutionStatus.Failed:
        return intl.formatMessage({ id: 'resolution.status.failed', defaultMessage: 'Failed' });
      default:
        return status;
    }
  }

  renderAmendments = (amendments: Record<AmendmentID, AmendmentData>) => {
    const { renderAmendment, recoverResolutionFref } = this;

    const resolutionRef = recoverResolutionFref();

    return Object.keys(amendments).reverse().map(key => {
      return renderAmendment(key, amendments[key], resolutionRef.child('amendments').child(key));
    });
  }

  renderAdditionalOptions = () => {
    return  (
      <Dropdown
        text='More options'
        className='icon'
      >
      <Dropdown.Menu>
        <DeleteResolutionModalWithIntl onConfirm={() => this.recoverResolutionFref().remove()} />
      </Dropdown.Menu>
    </Dropdown>)
  }

  renderAmendmentsGroup = (resolution?: ResolutionData) => {
    const { committee } = this.state;
    const { handlePushAmendment } = this;

    if (!resolution || !committee) {
      return <Loading />;
    }

    const amendments = resolution.amendments || {};

    if (!this.amendmentsArePublic(resolution)) {
      return (
        <Message info>
          <FormattedMessage 
            id="resolution.amendments.notice.private" 
            defaultMessage="Delegates cannot amend this resolution" 
          />
        </Message>
      );
    }

    return (
      <div>
        <Button
          primary
          fluid
          onClick={handlePushAmendment}
        >
          <Icon name="plus" />
          <FormattedMessage 
            id="resolution.amendments.action.add" 
            defaultMessage="Add amendment" 
          />
        </Button>
        <Divider />
        {Object.keys(amendments).length === 0 ? (
          <Message info>
            <FormattedMessage 
              id="resolution.amendments.notice.empty" 
              defaultMessage="No amendments have been proposed yet" 
            />
          </Message>
        ) : (
          <Card.Group>
            {Object.keys(amendments).map(id =>
              this.renderAmendment(id, amendments[id], this.recoverResolutionFref().child('amendments').child(id))
            )}
          </Card.Group>
        )}
      </div>
    );
  }

  hasLinkedCaucus = (resolution?: ResolutionData): boolean => {
    return resolution
      ? !!resolution.caucus
      : false;
  }

  amendmentsArePublic = (resolution?: ResolutionData): boolean => {
    return resolution
      ? resolution.amendmentsArePublic || false
      : false;
  }

  renderFeed = () => {
    const resolutionID: ResolutionID = this.props.match.params.resolutionID;

    return <Files {...this.props} forResolution={resolutionID} />;
  }

  onTabChange = (event: React.MouseEvent<HTMLDivElement>, data: TabProps) => {
    const { committeeID, resolutionID } = this.props.match.params;

    // @ts-ignore
    const tab = TAB_ORDER[data.activeIndex];

    if (tab) {
      this.props.history
        .push(`/committees/${committeeID}/resolutions/${resolutionID}/${tab}`);
    } else {
      this.props.history
        .push(`/committees/${committeeID}/resolutions/${resolutionID}`);
    }
  }

  renderResolution = (resolution?: ResolutionData) => {
    const { renderAmendmentsGroup, renderVoting, renderFeed, renderText } = this;
    const { tab } = this.props.match.params;

    let index = TAB_ORDER.findIndex(x => x === tab)
    if (index === -1) {
      index = 0
    }

    const panes = [
      {
        menuItem: <FormattedMessage id="resolution.tab.feed" defaultMessage="Feed" />,
        render: () => <Tab.Pane>{renderFeed()}</Tab.Pane>
      }, {
        menuItem: <FormattedMessage id="resolution.tab.text" defaultMessage="Text" />,
        render: () => <Tab.Pane>{renderText(resolution)}</Tab.Pane>
      }, {
        menuItem: <FormattedMessage id="resolution.tab.amendments" defaultMessage="Amendments" />,
        render: () => <Tab.Pane>{renderAmendmentsGroup(resolution)}</Tab.Pane>
      }, {
        menuItem: <FormattedMessage id="resolution.tab.voting" defaultMessage="Voting" />,
        render: () => <Tab.Pane>{renderVoting(resolution)}</Tab.Pane>
      }
    ];

    return (
      <Container style={{ paddingBottom: '2em' }}>
        <Helmet>
          <title>
            <FormattedMessage 
              id="resolution.page.title" 
              defaultMessage="Resolution - {resolutionName}" 
              values={{ resolutionName: resolution?.name || 'Untitled' }}
            />
          </title>
        </Helmet>
        <Tab
          panes={panes}
          activeIndex={index}
          onTabChange={this.onTabChange}
        />
      </Container>
    );
  }

  render() {
    const { committee, loading } = this.state;
    const resolutionID: ResolutionID = this.props.match.params.resolutionID;

    const resolutions = committee ? committee.resolutions : {};
    const resolution = (resolutions || {})[resolutionID];

    if (!loading && !resolution) {
      return (
        <Container text style={{ 'padding-bottom': '2em' }}>
          <NotFound item="resolution" id={resolutionID} />
        </Container>
      );
    } else {
      return this.renderResolution(resolution);
    }
  }
}
