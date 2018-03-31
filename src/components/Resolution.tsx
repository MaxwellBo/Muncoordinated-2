import * as React from 'react';
import * as firebase from 'firebase';
import { MemberID, parseCountryOption, MemberData } from './Member';
import { AmendmentID, AmendmentData, DEFAULT_AMENDMENT, AMENDMENT_STATUS_OPTIONS } from './Amendment';
import { Card, Button, Form, Dimmer, Dropdown, Segment, Input, TextArea } from 'semantic-ui-react';
import { CommitteeData } from './Committee';
import { CaucusID } from './Caucus';
import { RouteComponentProps } from 'react-router';
import { URLParameters } from '../types';
import { dropdownHandler, fieldHandler, textAreaHandler } from '../actions/handlers';
import { objectToList, makeDropdownOption } from '../utils';
import { CountryOption } from '../constants';
import { Loading } from './Loading';

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
  proposer: MemberID;
  seconder: MemberID;
  status: ResolutionStatus;
  caucus?: CaucusID;
  amendments?: Map<AmendmentID, AmendmentData>;
  votes: VotingResults;
}

export interface VotingResults {
  for: Map<string, MemberID>;
  abstaining: Map<string, MemberID>;
  against: Map<string, MemberID>;
}

export const DEFAULT_VOTES: VotingResults = {
  for: {} as Map<string, MemberID>,
  abstaining: {} as Map<string, MemberID>,
  against: {} as Map<string, MemberID>
};

export const DEFAULT_RESOLUTION = {
  proposer: '',
  seconder: '',
  status: ResolutionStatus.Ongoing,
  caucus: '',
  amendments: {} as Map<AmendmentID, AmendmentData>,
  votes: DEFAULT_VOTES
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

  recoverResolutionRef = () => {
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
        .map(x => parseCountryOption(x.name));
    }

    return [];
  }

  handlePushAmendment = (): void => {
    this.recoverResolutionRef().child('amendments').push().set(DEFAULT_AMENDMENT);
  }

  renderAmendment = (id: AmendmentID, amendmentData: AmendmentData, amendmentFref: firebase.database.Reference) => {
    const { recoverCountryOptions } = this;
    const { proposer, text, status } = amendmentData;

    const textArea = (
      <TextArea
        value={text}
        autoHeight
        onChange={textAreaHandler<AmendmentData>(amendmentFref, 'text')}
        fluid
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
          </Card.Header>
          <Form>
            {textArea}
          </Form>
          <Card.Meta>
            <Form.Dropdown
              value={proposer}
              search
              selection
              fluid
              onChange={dropdownHandler<AmendmentData>(amendmentFref, 'proposer')}
              options={recoverCountryOptions()}
              label="Proposer"
            />
          </Card.Meta>
        </Card.Content>
      </Card>
    );
  }

  renderHeader = (resolution?: ResolutionData) => {
    const resolutionFref = this.recoverResolutionRef();

    const statusDropdown = (
      <Dropdown 
        value={resolution ? resolution.status : ResolutionStatus.Ongoing} 
        options={RESOLUTION_STATUS_OPTIONS} 
        onChange={dropdownHandler<ResolutionData>(resolutionFref, 'status')} 
      /> 
    );

    return (
        <Segment loading={!resolution}>
          <Input
            label={statusDropdown}
            labelPosition="right"
            value={name}
            onChange={fieldHandler<ResolutionData>(resolutionFref, 'name')}
            attatched="top"
            size="massive"
            fluid
            placeholder="Resolution Name"
          />
        </Segment>
    );
  }

  renderAmendments = (amendments: Map<AmendmentID, AmendmentData>) => {
    const { renderAmendment, recoverResolutionRef } = this;

    const resolutionRef = recoverResolutionRef();

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

  renderResolution = (resolution?: ResolutionData) => {
    const { renderHeader, renderAmendmentsGroup  } = this;

    return (
      <div>
        {renderHeader(resolution)}
        {renderAmendmentsGroup(resolution)}
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
