import * as React from 'react';
import * as firebase from 'firebase';
import * as _ from 'lodash';
import { MemberID, nameToCountryOption, MemberData } from './Member';
import { AmendmentID, AmendmentData, DEFAULT_AMENDMENT, AMENDMENT_STATUS_OPTIONS } from './Amendment';
import {
  Card, Button, Form, Dropdown, Segment, Input, TextArea, Checkbox,
  List, SemanticICONS, Icon, Tab, Grid, SemanticCOLORS, Container, Message, Label, Popup
} from 'semantic-ui-react';
import { CommitteeData } from './Committee';
import { CaucusID, DEFAULT_CAUCUS, CaucusData } from './Caucus';
import { RouteComponentProps } from 'react-router';
import { URLParameters } from '../types';
import {
  dropdownHandler, fieldHandler, textAreaHandler, countryDropdownHandler,
  checkboxHandler
} from '../actions/handlers';
import { makeDropdownOption, recoverCountryOptions } from '../utils';
import { canVote, CommitteeStats } from './Admin';
import { voteOnResolution, deleteResolution } from '../actions/resolutionActions';
import { postCaucus } from '../actions/caucusActions';
import { Stance } from './caucus/SpeakerFeed';
import { NotFound } from './NotFound';

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
].map(makeDropdownOption);

export type ResolutionID = string;

export interface ResolutionData {
  name: string;
  link: string;
  proposer?: MemberID;
  seconder?: MemberID;
  status: ResolutionStatus;
  caucus?: CaucusID;
  amendments?: Map<AmendmentID, AmendmentData>;
  votes?: Votes;
  amendmentsArePublic?: boolean; // TODO: Migrate
}

export enum Vote {
  For = 'For',
  Abstaining = 'Abstaining',
  Against = 'Against'
}

type Votes = Map<string, Vote>;

export const DEFAULT_RESOLUTION: ResolutionData = {
  name: 'untitled resolution',
  link: '',
  status: ResolutionStatus.Introduced,
  amendments: {} as Map<AmendmentID, AmendmentData>,
  votes: {} as Votes,
  amendmentsArePublic: false
};

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

    const ref = postCaucus(committeeID, newCaucus);

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

    const ref = postCaucus(committeeID, newCaucus);

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
    const { user } = this.state;

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

    const statusDropdown = (
      <Dropdown
        disabled={!user}
        value={status}
        options={AMENDMENT_STATUS_OPTIONS}
        onChange={dropdownHandler<AmendmentData>(amendmentFref, 'status')}
      />
    );

    const countryOptions = recoverCountryOptions(this.state.committee);

    const proposerDropdown = (
      <Form.Dropdown
        key="proposer"
        icon="search"
        value={nameToCountryOption(proposer).key}
        error={!proposer}
        search
        selection
        fluid
        label="Proposer"
        placeholder="Proposer"
        onChange={countryDropdownHandler<AmendmentData>(amendmentFref, 'proposer', countryOptions)}
        options={countryOptions}
      />
    );

    const provisionTree = !((amendment || { caucus: undefined }).caucus) ? (
      <Button
        floated="right"
        disabled={!amendment || amendment.proposer === '' || !user}
        content="Provision Caucus"
        onClick={() => handleProvisionAmendment(id, amendment!)}
      />
    ) : (
        <Button
          floated="right"
          content="Associated Caucus"
          onClick={() => this.gotoCaucus(amendment!.caucus)}
        />
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
              disabled={!user}
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

  renderVotingMembers = (members: Map<string, MemberData>, votes: Votes) => {
    const { renderVotingMember } = this;

    return _.chain(members)
      .keys()
      .filter(key => canVote(members[key]) && members[key].present)
      .sortBy((key: string) => [members[key].name])
      .map((key: string) => renderVotingMember(key, members[key], votes[key]))
      .value();
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

  renderVoting = (resolution?: ResolutionData) => {
    const { renderVotingMembers, renderCount } = this;
    const { committee } = this.state;

    const members = committee ? committee.members : undefined;
    const votes = resolution ? resolution.votes : undefined;

    const votingMembers = renderVotingMembers(
      members || {} as Map<string, MemberData>,
      votes || {} as Votes
    );

    const votesValues: Vote[] = _.values(votes || {});

    const fors = votesValues.filter(v => v === Vote.For).length;
    const abstains = votesValues.filter(v => v === Vote.Abstaining).length;
    const againsts = votesValues.filter(v => v === Vote.Against).length;

    const COLUMNS = 3;
    const ROWS = Math.ceil(votingMembers.length / COLUMNS);

    const columns = _.times(3, i => (
      <Grid.Column key={i}>
        <List
          inverted
        >
          {_.chain(votingMembers).drop(ROWS * i).take(ROWS).value()}
        </List>
      </Grid.Column>
    ));

    return (
      <Segment inverted loading={!resolution}>
        <Grid columns="equal">
          {columns}
        </Grid>
        <Grid columns="equal">
          {renderCount('yes', 'green', 'plus', fors)}
          {renderCount('no', 'red', 'remove', againsts)}
          {renderCount('abstaining', 'yellow', 'minus', abstains)}
        </Grid>
      </Segment>
    );
  }

  renderHeader = (resolution?: ResolutionData) => {
    const resolutionFref = this.recoverResolutionFref();
    const { handleProvisionResolution, amendmentsArePublic } = this;

    const statusDropdown = (
      <Dropdown
        value={resolution ? resolution.status : ResolutionStatus.Introduced}
        options={RESOLUTION_STATUS_OPTIONS}
        onChange={dropdownHandler<ResolutionData>(resolutionFref, 'status')}
        loading={!resolution}
      />
    );

    const countryOptions = recoverCountryOptions(this.state.committee);

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
        value={proposer ? nameToCountryOption(proposer).key : undefined}
        error={!proposer || hasIdenticalProposerSeconder}
        loading={!resolution}
        search
        selection
        fluid
        onChange={countryDropdownHandler<ResolutionData>(resolutionFref, 'proposer', countryOptions)}
        options={countryOptions}
        label="Proposer"
      />
    );

    const seconderTree = (
      <Form.Dropdown
        key="seconder"
        loading={!resolution}
        icon="search"
        value={seconder ? nameToCountryOption(seconder).key : undefined}
        error={!seconder || hasIdenticalProposerSeconder}
        search
        selection
        fluid
        onChange={countryDropdownHandler<ResolutionData>(resolutionFref, 'seconder', countryOptions)}
        options={countryOptions}
        label="Seconder"
      />
    );

    const hasError = hasIdenticalProposerSeconder;

    const provisionTree = this.hasLinkedCaucus(resolution) ? (
      <Form.Button
        loading={!resolution}
        disabled={!resolution}
        content="Associated Caucus"
        onClick={() => this.gotoCaucus(resolution!.caucus)}
      />
    ) : (
        // if there's no linked caucus
        <Form.Button
          loading={!resolution}
          disabled={!resolution || !resolution.proposer || !resolution.seconder || hasError}
          content="Provision Caucus"
          onClick={() => handleProvisionResolution(resolution!)}
        />
      );

    return (
      <React.Fragment>
        <Segment attached={amendmentsArePublic(resolution) ? 'top' : undefined}>
          <Input
            value={resolution ? resolution.name : ''}
            label={statusDropdown}
            loading={!resolution}
            labelPosition="right"
            onChange={fieldHandler<ResolutionData>(resolutionFref, 'name')}
            attatched="top"
            size="massive"
            fluid
            placeholder="Resolution Name"
          />
          <Form error={hasError}>
            <Form.Group widths="equal">
              {proposerTree}
              {seconderTree}
            </Form.Group>
            {IDENTITCAL_PROPOSER_SECONDER}
            <Form.Group>
              {provisionTree}
              <Form.Checkbox
                label="Delegates can amend"
                indeterminate={!resolution}
                toggle
                checked={amendmentsArePublic(resolution)}
                onChange={checkboxHandler<ResolutionData>(resolutionFref, 'amendmentsArePublic')}
              />
            </Form.Group>
            <TextArea
              value={resolution ? resolution.link : ''}
              autoHeight
              onChange={textAreaHandler<ResolutionData>(resolutionFref, 'link')}
              attatched="top"
              rows={1}
              placeholder="Resolution text or link to resolution text"
            />
          </Form>
        </Segment>
        {amendmentsArePublic(resolution) && DELEGATES_CAN_AMEND_NOTICE}
      </React.Fragment>
    );
  }

  renderAmendments = (amendments: Map<AmendmentID, AmendmentData>) => {
    const { renderAmendment, recoverResolutionFref } = this;

    const resolutionRef = recoverResolutionFref();

    return Object.keys(amendments).map(key => {
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
        {renderAmendments(amendments || {} as Map<string, AmendmentData>)}
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

  handleDelete = () => {
    const { resolutionID, committeeID } = this.props.match.params;

    deleteResolution(committeeID, resolutionID);
  }

  renderDelete = () => {
    return (
      <Button
        negative
        icon="trash"
        content="Delete"
        basic
        onClick={this.handleDelete}
      />
    );
  }

  renderResolution = (resolution?: ResolutionData) => {
    const { renderHeader, renderAmendmentsGroup, renderVoting, renderDelete } = this;

    const panes = [
      {
        menuItem: 'Amendments',
        render: () => <Tab.Pane>{renderAmendmentsGroup(resolution)}</Tab.Pane>
      },
      {
        menuItem: 'Voting',
        render: () => <Tab.Pane>{renderVoting(resolution)}</Tab.Pane>
      }, {
        menuItem: 'Options',
        render: () => <Tab.Pane>{renderDelete()}</Tab.Pane>
      }
    ];

    return (
      <Container>
        {renderHeader(resolution)}
        <Tab panes={panes} />
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
        <Container text>
          <NotFound item="resolution" id={resolutionID} />
        </Container>
      );
    } else {
      return this.renderResolution(resolution);
    }
  }
}
