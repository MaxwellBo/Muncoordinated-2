import * as React from 'react';
import * as firebase from 'firebase';
import * as _ from 'lodash';
import { MemberID, nameToCountryOption, MemberData } from './Member';
import { AmendmentID, AmendmentData, DEFAULT_AMENDMENT, AMENDMENT_STATUS_OPTIONS } from './Amendment';
import {
  Card, Button, Form, Dropdown, Segment, Input, TextArea, Checkbox,
  List, SemanticICONS, Icon, Tab, Grid, SemanticCOLORS, Container, Message
} from 'semantic-ui-react';
import { CommitteeData } from './Committee';
import { CaucusID, DEFAULT_CAUCUS, CaucusData } from './Caucus';
import { RouteComponentProps } from 'react-router';
import { URLParameters } from '../types';
import { dropdownHandler, fieldHandler, textAreaHandler, countryDropdownHandler, 
  checkboxHandler } from '../actions/handlers';
import { makeDropdownOption, recoverCountryOptions } from '../utils';
import Loading from './Loading';
import { canVote } from './Admin';
import { voteOnResolution } from '../actions/resolutionActions';
import { postCaucus } from '../actions/caucusActions';
import { Stance } from './caucus/SpeakerFeed';

export const IDENTITCAL_PROPOSER_SECONDER = (
  <Message
    error
    content="A resolution's proposer and seconder cannot be the same"
  />
);

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  committeeFref: firebase.database.Reference;
  committee?: CommitteeData;
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
      committeeFref: firebase.database().ref('committees').child(match.params.committeeID)
    };
  }

  firebaseCallback = (committee: firebase.database.DataSnapshot | null) => {
    if (committee) {
      this.setState({ committee: committee.val() });
    }
  }

  componentDidMount() {
    this.state.committeeFref.on('value', this.firebaseCallback);
  }

  componentWillUnmount() {
    this.state.committeeFref.off('value', this.firebaseCallback);
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

    const textArea = (
      <TextArea
        value={text}
        autoHeight
        onChange={textAreaHandler<AmendmentData>(amendmentFref, 'text')}
        rows={1}
        placeholder="Text"
      />
    );

    const statusDropdown = (
      <Dropdown
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
        search
        selection
        fluid
        placeholder="Proposer"
        onChange={countryDropdownHandler<AmendmentData>(amendmentFref, 'proposer', countryOptions)}
        options={countryOptions}
      />
    );

    const provisionTree = !((amendment || { caucus: undefined }).caucus) ? (
      <Button
        floated="right"
        disabled={!amendment || amendment.proposer === ''}
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
              basic
              onClick={() => amendmentFref.remove()}
            />
            {provisionTree}
          </Card.Header>
          <Form>
            {textArea}
          </Form>
          <Card.Meta>
            {proposerDropdown}
          </Card.Meta>
        </Card.Content>
      </Card>
    );
  }

  cycleVote = (memberID: MemberID, member: MemberData, currentVote?: Vote) => {
    const { resolutionID, committeeID } = this.props.match.params;

    // leave this be in the case of undefined and Against
    let newVote: Vote = Vote.For;

    if (currentVote === Vote.For) {
      if (member.voting) {
        newVote = Vote.Against;
      } else {
        newVote = Vote.Abstaining;
      }
    } else if (currentVote === Vote.Abstaining) {
      newVote = Vote.Against;
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

    return (
      <List.Item key={key}>
        {button}
        <List.Content verticalAlign="middle">
          <List.Header>{member.name.toUpperCase()}</List.Header>
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

  renderCount = (key: string, color: SemanticCOLORS, icon: SemanticICONS, count: number) => {
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
          {renderCount('no', 'red', 'minus', againsts)}
          {renderCount('abstaining', 'yellow', 'minus', abstains)}
        </Grid>
      </Segment>
    );
  }

  renderHeader = (resolution?: ResolutionData) => {
    const resolutionFref = this.recoverResolutionFref();
    const { handleProvisionResolution } = this;

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

    const provisionTree = !((resolution || { caucus: undefined }).caucus) ? (
      // if there's no linked caucus
      <Form.Button
        disabled={!resolution || !resolution.proposer || !resolution.seconder || hasError} 
        content="Provision Caucus"
        onClick={() => handleProvisionResolution(resolution!)}
      />
    ) : (
        <Form.Button
          content="Associated Caucus"
          onClick={() => this.gotoCaucus(resolution!.caucus)}
        />
      );

    return (
      <Segment loading={!resolution}>
        <Input
          value={resolution ? resolution.name : ''}
          label={statusDropdown}
          labelPosition="right"
          onChange={fieldHandler<ResolutionData>(resolutionFref, 'name')}
          attatched="top"
          size="massive"
          fluid
          placeholder="Resolution Name"
        />
        <Form error={hasError}>
          <TextArea
            value={resolution ? resolution.link : ''}
            autoHeight
            onChange={textAreaHandler<ResolutionData>(resolutionFref, 'link')}
            attatched="top"
            rows={1}
            placeholder="Link"
          />
          <Form.Group widths="equal">
            {proposerTree}
            {seconderTree}
          </Form.Group>
          {IDENTITCAL_PROPOSER_SECONDER}
          {provisionTree}
        </Form>
      </Segment>
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

    const resolutionFref = this.recoverResolutionFref();

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
        <Checkbox
          label="Delegates can amend"
          indeterminate={!resolution}
          toggle
          checked={resolution ? (resolution.amendmentsArePublic || false) : false}
          onChange={checkboxHandler<ResolutionData>(resolutionFref, 'amendmentsArePublic')}
        />
        {/* </Card.Content> */}
      </Card>
    );

    return (
      <Card.Group
        itemsPerRow={1}
      >
        {adder}
        {!resolution && <Loading />}
        {renderAmendments(amendments || {} as Map<string, AmendmentData>)}
      </Card.Group>
    );
  }

  renderOptions = () => {
    const { recoverResolutionFref } = this;
    return (<Button negative content="Delete" basic onClick={() => recoverResolutionFref().remove()} />);
  }

  renderResolution = (resolution?: ResolutionData) => {
    const { renderHeader, renderAmendmentsGroup, renderVoting, renderOptions } = this;

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
        render: () => <Tab.Pane>{renderOptions()}</Tab.Pane>
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
    const { committee } = this.state;
    const resolutionID: ResolutionID = this.props.match.params.resolutionID;

    const resolutions = committee ? committee.resolutions : {};
    const resolution = (resolutions || {})[resolutionID];

    return this.renderResolution(resolution);
  }
}
