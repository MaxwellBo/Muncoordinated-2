import * as React from 'react';
import * as firebase from 'firebase/app';
import * as _ from 'lodash';
import { MemberID, nameToMemberOption, MemberData, Rank } from './Member';
import { AmendmentID, AmendmentData, DEFAULT_AMENDMENT, AMENDMENT_STATUS_OPTIONS, recoverLinkedCaucus } from './Amendment';
import {
  Card, Button, Form, Dropdown, Segment, Input, TextArea, Confirm,
  List, SemanticICONS, Icon, Tab, Grid, SemanticCOLORS, Container, Message, Label, Popup, Statistic, DropdownItemProps, TabProps
} from 'semantic-ui-react';
import { Helmet } from 'react-helmet';
import { CommitteeData, recoverMemberOptions } from './Committee';
import { CaucusID, DEFAULT_CAUCUS, CaucusData } from './Caucus';
import { RouteComponentProps } from 'react-router';
import { URLParameters } from '../types';
import {
  dropdownHandler, fieldHandler, textAreaHandler, memberDropdownHandler,
  checkboxHandler
} from '../actions/handlers';
import { makeDropdownOption } from '../utils';
import { canVote, CommitteeStats, makeCommitteeStats } from './Admin';
import { voteOnResolution } from '../actions/resolution-actions';
import { putCaucus } from '../actions/caucus-actions';
import { Stance } from './caucus/SpeakerFeed';
import { NotFound } from './NotFound';
import Files from './Files';

const TAB_ORDER = ['feed', 'text', 'amendments', 'voting'];

export const IDENTITCAL_PROPOSER_SECONDER = (
  <Message
    error
    content="A resolution's proposer and seconder cannot be the same"
  />
);

export const DELEGATES_CAN_AMEND_NOTICE = (
  <Message
    basic
    attached="bottom"
  >
    Delegates can create and edit, but not delete, amendments.
  </Message>
);

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  committeeFref: firebase.database.Reference;
  committee?: CommitteeData;
  authUnsubscribe?: () => void;
  user?: firebase.User | null;
  loading: boolean;
  askToDeleteResolution: boolean
}

export enum ResolutionStatus {
  Introduced = 'Introduced',
  Passed = 'Passed',
  Failed = 'Failed'
}

const RESOLUTION_STATUS_OPTIONS = [
  ResolutionStatus.Introduced,
  ResolutionStatus.Passed,
  ResolutionStatus.Failed
].map(makeDropdownOption)

enum Majority {
  Simple = "Simple majority",
  TwoThirds = "Two-thirds majority",
  TwoThirdsNoAbstentions = "Two-thirds majority, ignoring abstentions"
}

const MAJORITY_OPTIONS: DropdownItemProps[] = [
  { key: Majority.Simple, value: Majority.Simple, text: "Simple (50%) majority required" },
  { key: Majority.TwoThirds, value: Majority.TwoThirds, text: "Two-thirds majority required" },
  { key: Majority.TwoThirdsNoAbstentions, value: Majority.TwoThirdsNoAbstentions, text: "Two-thirds majority required, ignoring abstentions" },
]

function getThreshold(requiredMajority: Majority, committee: CommitteeData | undefined, fors: number, againsts: number): number {
  const stats = makeCommitteeStats(committee)
  switch (requiredMajority) {
    case Majority.TwoThirds:
      return stats.twoThirdsMajority;
    case Majority.TwoThirdsNoAbstentions:
      return Math.ceil((2/3) * (fors + againsts));
    case Majority.Simple:
    default:
      return stats.simpleMajority;
  }
}

function getThresholdName(majority: Majority): string {
  switch (majority) {
    case Majority.TwoThirds:
      return "two-thirds majority"
    case Majority.TwoThirdsNoAbstentions:
      return "two-thirds majority"
    case Majority.Simple:
    default:
      return "simple majority";
  }
}

export type ResolutionID = string;

export interface ResolutionData {
  name: string;
  link: string;
  proposer?: MemberID;
  seconder?: MemberID;
  status: ResolutionStatus;
  caucus?: CaucusID;
  amendments?: Record<AmendmentID, AmendmentData>;
  votes?: Votes;
  amendmentsArePublic?: boolean; // TODO: Migrate
  requiredMajority?: Majority; // TODO: Migrate
}

export enum Vote {
  For = 'For',
  Abstaining = 'Abstaining',
  Against = 'Against'
}

type Votes = Record<string, Vote>;

export const DEFAULT_RESOLUTION: ResolutionData = {
  name: 'untitled resolution',
  link: '',
  status: ResolutionStatus.Introduced,
  amendments: {} as Record<AmendmentID, AmendmentData>,
  votes: {} as Votes,
  amendmentsArePublic: false,
  requiredMajority: Majority.Simple
};

export default class Resolution extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);

    const { match } = props;

    this.state = {
      committeeFref: firebase.database().ref('committees').child(match.params.committeeID),
      loading: true,
      askToDeleteResolution: false
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

    const newCaucus: CaucusData = {
      ...DEFAULT_CAUCUS,
      name: `Amendment by ${amendment.proposer}`,
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

    const textArea = (
      <TextArea
        value={text}
        label="Text"
        autoHeight
        onChange={textAreaHandler<AmendmentData>(amendmentFref, 'text')}
        rows={1}
        placeholder="Text"
      />
    );

    let hasAuth = false;

    if (committee && user) {
      hasAuth = committee.creatorUid === user.uid;
    }

    const statusDropdown = (
      <Dropdown
        disabled={!hasAuth}
        value={status}
        options={AMENDMENT_STATUS_OPTIONS}
        onChange={dropdownHandler<AmendmentData>(amendmentFref, 'status')}
      />
    );

    const memberOptions = recoverMemberOptions(this.state.committee);

    const proposerDropdown = (
      <Form.Dropdown
        key="proposer"
        icon="search"
        value={nameToMemberOption(proposer).key}
        error={!proposer}
        search
        selection
        fluid
        label="Proposer"
        placeholder="Proposer"
        onChange={memberDropdownHandler<AmendmentData>(amendmentFref, 'proposer', memberOptions)}
        options={memberOptions}
      />
    );

    const provisionTree = recoverLinkedCaucus(amendment) ? (
      <Button
        floated="right"
        onClick={() => this.gotoCaucus(amendment!.caucus)}
      >
        Associated caucus
        <Icon name="arrow right" />
      </Button>
    ):(
      <Button
        floated="right"
        disabled={!amendment || amendment.proposer === '' || !hasAuth}
        onClick={() => handleProvisionAmendment(id, amendment!)}
      >
        Provision caucus
      </Button>
    );

    return (
      <Card
        key={id}
      >
        <Card.Content>
          <Card.Header>
            {statusDropdown}
            <Button
              floated="right"
              icon="trash"
              negative
              disabled={!hasAuth}
              basic
              onClick={() => amendmentFref.remove()}
            />
            {provisionTree}
          </Card.Header>
          <Card.Meta>
            {proposerDropdown}
          </Card.Meta>
          <Form>
            {textArea}
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

    return <CommitteeStats verbose={false} data={committee} />;
  }

  renderCount = (key: string, color: SemanticCOLORS, icon: SemanticICONS, count: number) => {
    const trigger = (
      <Button
        key={'count' + key}
        color={color}
        icon
        fluid
      >
        {key.toUpperCase()}: {count}
      </Button>
    );

    return (
      <Grid.Column key={key}>
        {/* <Button
          key={'icon' + key}
          color={color}
          icon
        >
          <Icon 
            name={icon}
            color={color === 'yellow' ? 'black' : undefined}
          />
        </Button> */}
        <Popup trigger={trigger}>
          {this.renderStats()}
        </Popup>
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
    const { renderVotingMember, renderCount } = this;
    const { committee } = this.state;

    const members = (committee ? committee.members : undefined) || {};
    const votes = (resolution ? resolution.votes : undefined) || {};

    const sortedPresentAndCanVote = _.chain(members)
      .keys()
      .filter(key => canVote(members[key]) && members[key].present)
      .sortBy((key: string) => [members[key].name])
      .value();

    const rendered = sortedPresentAndCanVote
      .map((key: string) => renderVotingMember(key, members[key], votes[key]));

    const vetoes = _.chain(sortedPresentAndCanVote)
      .filter((key: string) => members[key].rank === Rank.Veto && votes[key] === Vote.Against)
      .map(key => members[key])
      .value();

    const resolutionVetoed = !!vetoes[0];

    const votesByVoters = Object.keys(votes || {})
      .filter(k => sortedPresentAndCanVote.includes(k))
      .map(k => votes[k]);

    const fors = votesByVoters.filter(v => v === Vote.For).length;
    const abstains = votesByVoters.filter(v => v === Vote.Abstaining).length;
    const againsts = votesByVoters.filter(v => v === Vote.Against).length;
    const remaining = sortedPresentAndCanVote.length - votesByVoters.length;

    const requiredMajority: Majority = resolution 
      ? (resolution.requiredMajority || DEFAULT_RESOLUTION.requiredMajority as Majority)
      : DEFAULT_RESOLUTION.requiredMajority as Majority;

    const threshold = getThreshold(requiredMajority, committee, fors, againsts);
    const thresholdName = getThresholdName(requiredMajority);

    const resolutionPassed: boolean = fors >= threshold && !resolutionVetoed; 
    const resolutionFailed: boolean = fors + remaining < threshold && !resolutionVetoed;

    const COLUMNS = 3;
    const ROWS = Math.ceil(sortedPresentAndCanVote.length / COLUMNS);

    const columns = _.times(3, i => (
      <Grid.Column key={i}>
        <List
          inverted
        >
          {_.chain(rendered).drop(ROWS * i).take(ROWS).value()}
        </List>
      </Grid.Column>
    ));


    return (
      <Segment inverted loading={!resolution} textAlign="center">
        <Grid columns="equal">
          {columns}
        </Grid>
        <Grid columns="equal">
          {renderCount('yes', 'green', 'plus', fors)}
          {renderCount('no', 'red', 'remove', againsts)}
          {renderCount('abstaining', 'yellow', 'minus', abstains)}
        </Grid>
        {resolutionPassed && <Statistic inverted>
          <Statistic.Value>Passed</Statistic.Value>
          <Statistic.Label>{fors} clears the required {thresholdName} of {threshold}</Statistic.Label>
          {requiredMajority === Majority.TwoThirdsNoAbstentions && 
            <Statistic.Label>Further votes may change the result from 'Passed'</Statistic.Label>
          }
        </Statistic>} 
        {resolutionFailed && <Statistic inverted>
          <Statistic.Value>Failed</Statistic.Value>
          <Statistic.Label>There are insufficient votes remaining to achieve a {thresholdName}</Statistic.Label>
        </Statistic>} 
        {resolutionVetoed && <Statistic inverted>
          <Statistic.Value>Vetoed</Statistic.Value>
          <Statistic.Label>{vetoes[0].name} was the first to veto the resolution</Statistic.Label>
        </Statistic>} 
        <Segment inverted>
          {this.renderMajoritySelector(resolution)}
        </Segment>
      </Segment>
    );
  }

  renderMeta = (resolution?: ResolutionData) => {
    const resolutionFref = this.recoverResolutionFref();
    const { handleProvisionResolution, amendmentsArePublic } = this;

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
        label="Proposer"
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
        label="Seconder"
      />
    );

    const hasError = hasIdenticalProposerSeconder;

    const provisionTree = this.hasLinkedCaucus(resolution) ? (
      <Form.Button
        loading={!resolution}
        disabled={!resolution}
        onClick={() => this.gotoCaucus(resolution!.caucus)}
      >
        Associated caucus
        <Icon name="arrow right" />
      </Form.Button>
    ) : (
        // if there's no linked caucus
        <Form.Button
          loading={!resolution}
          disabled={!resolution || !resolution.proposer || !resolution.seconder || hasError}
          onClick={() => handleProvisionResolution(resolution!)}
        >
          Provision caucus
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
              label="Delegates can amend"
              indeterminate={!resolution}
              toggle
              checked={amendmentsArePublic(resolution)}
              onChange={checkboxHandler<ResolutionData>(resolutionFref, 'amendmentsArePublic')}
            />
          </Form>
        </Segment>
        {amendmentsArePublic(resolution) && DELEGATES_CAN_AMEND_NOTICE}
      </React.Fragment>
    );
  }

  renderText = (resolution?: ResolutionData) => {
    const resolutionFref = this.recoverResolutionFref();

    return (
      <Form>
        <TextArea
          value={resolution ? resolution.link : ''}
          autoHeight
          onChange={textAreaHandler<ResolutionData>(resolutionFref, 'link')}
          attatched="top"
          rows={3}
          placeholder="Resolution text"
        />
      </Form>
    )
  }

  renderHeader = (resolution?: ResolutionData) => {
    const resolutionFref = this.recoverResolutionFref();

    const statusDropdown = (
      <Dropdown
        value={resolution ? resolution.status : ResolutionStatus.Introduced}
        options={RESOLUTION_STATUS_OPTIONS}
        onChange={dropdownHandler<ResolutionData>(resolutionFref, 'status')}
        loading={!resolution}
      />
    );

    return (
      <Input
        value={resolution ? resolution.name : ''}
        label={statusDropdown}
        loading={!resolution}
        labelPosition="right"
        onChange={fieldHandler<ResolutionData>(resolutionFref, 'name')}
        attatched="top"
        size="massive"
        fluid
        placeholder="Set resolution name"
      />
    );
  }

  renderAmendments = (amendments: Record<AmendmentID, AmendmentData>) => {
    const { renderAmendment, recoverResolutionFref } = this;

    const resolutionRef = recoverResolutionFref();

    return Object.keys(amendments).reverse().map(key => {
      return renderAmendment(key, amendments[key], resolutionRef.child('amendments').child(key));
    });
  }

  renderAmendmentsGroup = (resolution?: ResolutionData) => {
    const { renderAmendments, handlePushAmendment } = this;
    const amendments = resolution ? resolution.amendments : undefined;

    const adder = (
      <Card>
        {/* <Card.Content> */}
        <Button
          icon="plus"
          primary
          fluid
          basic
          onClick={handlePushAmendment}
        />
        {/* </Card.Content> */}
      </Card>
    );

    return (
      <Card.Group
        itemsPerRow={1}
      >
        {adder}
        {renderAmendments(amendments || {} as Record<string, AmendmentData>)}
      </Card.Group>
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

  deleteResolution = () => {
    return (<div>
        <Button negative fluid basic
            onClick={() => {this.setState({ askToDeleteResolution: true })}}
        >
          <Icon name="delete" /> Delete resolution?
        </Button>
        <Confirm
          open={this.state.askToDeleteResolution}
          header='Delete resolution?'
          content='Are you sure? This is irreversible and will delete all
                   posts, text, amendments and voting history. You may be
                   looking to close the resolution (top right dropdown).'
          onCancel={() => {this.setState({ askToDeleteResolution: false })}}
          onConfirm={() => {this.setState({ askToDeleteResolution: false });
                            this.recoverResolutionFref().remove()}}
        />
      </div>)
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
        menuItem: 'Feed',
        render: () => <Tab.Pane>{renderFeed()}</Tab.Pane>
      }, {
        menuItem: 'Text',
        render: () => <Tab.Pane>{renderText(resolution)}</Tab.Pane>
      }, {
        menuItem: 'Amendments',
        render: () => <Tab.Pane>{renderAmendmentsGroup(resolution)}</Tab.Pane>
      }, {
        menuItem: 'Voting',
        render: () => <Tab.Pane>{renderVoting(resolution)}</Tab.Pane>
      }
    ];

    return (
      <Container style={{ 'padding-bottom': '2em' }}>
        <Helmet>
          <title>{`${resolution?.name} - Muncoordinated`}</title>
        </Helmet>
        <Grid columns="equal" stackable>
          <Grid.Row>
            <Grid.Column>
              {this.renderHeader(resolution)}
            </Grid.Column>
          </Grid.Row>
          <Grid.Row>
            <Grid.Column width={11}>
              <Tab panes={panes} onTabChange={this.onTabChange} activeIndex={index}/>
            </Grid.Column>
            <Grid.Column width={5}>
              {this.renderMeta(resolution)}
              {this.deleteResolution()}
            </Grid.Column>
          </Grid.Row>
        </Grid >
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
