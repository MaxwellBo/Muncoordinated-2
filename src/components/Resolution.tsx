import * as React from 'react';
import * as firebase from 'firebase';
import * as _ from 'lodash';
import { MemberID, nameToCountryOption, MemberData, Rank } from './Member';
import { AmendmentID, AmendmentData, DEFAULT_AMENDMENT, AMENDMENT_STATUS_OPTIONS } from './Amendment';
import { Card, Button, Form, Dimmer, Dropdown, Segment, Input, TextArea, 
  List, Label, SemanticICONS, Icon, ListContent, Tab, Grid, SemanticCOLORS } from 'semantic-ui-react';
import { CommitteeData } from './Committee';
import { CaucusID, DEFAULT_CAUCUS, Stance, CaucusData } from './Caucus';
import { RouteComponentProps } from 'react-router';
import { URLParameters } from '../types';
import { dropdownHandler, fieldHandler, textAreaHandler, countryDropdownHandler } from '../actions/handlers';
import { objectToList, makeDropdownOption } from '../utils';
import { CountryOption, COUNTRY_OPTIONS } from '../constants';
import { Loading } from './Loading';
import { canVote } from './CommitteeAdmin';
import { voteOnResolution } from '../actions/resolutionActions';
import { postCaucus } from '../actions/caucusActions';

interface Props extends RouteComponentProps<URLParameters> {
}

interface State {
  committeeFref: firebase.database.Reference;
  committee?: CommitteeData;
}

export enum ResolutionStatus {
  Passed = 'Passed',
  Ongoing = 'Ongoing',
  Failed = 'Failed'
}

const RESOLUTION_STATUS_OPTIONS = [
  ResolutionStatus.Ongoing,
  ResolutionStatus.Passed,
  ResolutionStatus.Failed
].map(makeDropdownOption);

export type ResolutionID = string;

export interface ResolutionData {
  name: string;
  link: string;
  proposer: MemberID;
  seconder: MemberID;
  status: ResolutionStatus;
  caucus: CaucusID;
  amendments?: Map<AmendmentID, AmendmentData>;
  votes?: Votes;
}

export enum Vote {
  For = 'For',
  Abstaining = 'Abstaining',
  Against = 'Against'
}

type Votes = Map<string, Vote>;

export const DEFAULT_RESOLUTION: ResolutionData = {
  name: '',
  link: '',
  proposer: '',
  seconder: '',
  status: ResolutionStatus.Ongoing,
  caucus: '',
  amendments: {} as Map<AmendmentID, AmendmentData>,
  votes: {} as Votes
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

  // DUPE
  recoverCountryOptions = (): CountryOption[] => {
    const { committee } = this.state;

    if (committee) {
      return objectToList(committee.members || {} as Map<MemberID, MemberData>)
        .map(x => nameToCountryOption(x.name));
    }

    return [];
  }

  handlePushAmendment = (): void => {
    this.recoverResolutionFref().child('amendments').push().set(DEFAULT_AMENDMENT);
  }

  handleProvisionAmendment = (amendmentData: AmendmentData) => {
    const { committeeID } = this.props.match.params;
    const { proposer, text} = amendmentData;

    const newCaucus: CaucusData = {
      ...DEFAULT_CAUCUS,
      name: 'Amendment',
      topic: text,
      speaking: {
        duration: DEFAULT_CAUCUS.speakerTimer.remaining,
        who: proposer,
        stance: Stance.For,
      }
    };

    const ref = postCaucus(committeeID, newCaucus);

    this.props.history
      .push(`/committees/${committeeID}/caucuses/${ref.key}`);
  }

  handleProvisionResolution = (resolutionData: ResolutionData) => {
    const { committeeID } = this.props.match.params;
    const { proposer, seconder, name } = resolutionData;

    const newCaucus: CaucusData = {
      ...DEFAULT_CAUCUS,
      name: name,
      speaking: {
        duration: DEFAULT_CAUCUS.speakerTimer.remaining,
        who: proposer,
        stance: Stance.For,
      }
    };

    const ref = postCaucus(committeeID, newCaucus);

    ref.child('queue').push().set({
      duration: DEFAULT_CAUCUS.speakerTimer.remaining,
      who: seconder,
      stance: Stance.For,
    });

    this.props.history
      .push(`/committees/${committeeID}/caucuses/${ref.key}`);
  }

  renderAmendment = (id: AmendmentID, amendmentData: AmendmentData, amendmentFref: firebase.database.Reference) => {
    const { recoverCountryOptions, handleProvisionAmendment } = this;
    const { proposer, text, status } = amendmentData;

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

    const countryOptions = recoverCountryOptions();

    const proposerDropdown = (
      <Form.Dropdown
        key="proposer"
        value={nameToCountryOption(proposer).key}
        search
        selection
        fluid
        placeholder="Proposer"
        onChange={countryDropdownHandler<AmendmentData>(amendmentFref, 'proposer', countryOptions)}
        options={countryOptions}
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
            <Button
              floated="right"
              basic
              positive
              content="Provision Caucus"
              onClick={() => handleProvisionAmendment(amendmentData)}
            />
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
    
    voteOnResolution(committeeID, resolutionID, memberID, newVote)
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
      .sortBy(key => [members[key].name])
      .map(key => renderVotingMember(key, members[key], votes[key]))
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
      <Segment inverted>
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
    const { recoverCountryOptions } = this;

    const statusDropdown = (
      <Dropdown 
        value={resolution ? resolution.status : ResolutionStatus.Ongoing} 
        options={RESOLUTION_STATUS_OPTIONS} 
        onChange={dropdownHandler<ResolutionData>(resolutionFref, 'status')} 
      /> 
    );

    const countryOptions = recoverCountryOptions();

    const proposerTree = (
      <Form.Dropdown
        key="proposer"
        value={nameToCountryOption(resolution ? resolution.proposer : '').key}
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
        value={nameToCountryOption(resolution ? resolution.seconder : '').key}
        search
        selection
        fluid
        onChange={countryDropdownHandler<ResolutionData>(resolutionFref, 'seconder', countryOptions)}
        options={countryOptions}
        label="Seconder"
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
        <Form>
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

    const adder = (
      <Card>
        <Card.Content>
          <Button
            icon="plus"
            primary
            fluid
            basic
            onClick={handlePushAmendment}
          />
        </Card.Content>
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

  renderOptions = (resolution?: ResolutionData) => {
    const { recoverResolutionFref, handleProvisionResolution } = this;
    return (
      <Segment>
        <Button.Group fluid>
          <Button
            negative
            content="Delete"
            basic
            onClick={() => recoverResolutionFref().remove()}
          />
          <Button
            basic
            disabled={!resolution}
            positive
            content="Provision Caucus"
            onClick={() => handleProvisionResolution(resolution!)}
          />
        </Button.Group>
      </Segment>
    );
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
        render: () => <Tab.Pane>{renderOptions(resolution)}</Tab.Pane>
      }
    ];

    return (
      <div>
        {renderHeader(resolution)}
        <Tab panes={panes} />
      </div>
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
