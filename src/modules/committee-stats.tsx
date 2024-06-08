import React from 'react';
import * as Utils from '../utils';
import { canVote, MemberData, MemberID, nonNGO } from './member';
import { Table } from 'semantic-ui-react';
import { CommitteeData } from '../models/committee';

export function makeCommitteeStats(data?: CommitteeData) {
  const defaultMap = {} as Record<MemberID, MemberData>;
  const membersMap: Record<MemberID, MemberData> = data ? data.members || defaultMap : defaultMap;
  const members: MemberData[] = Utils.objectToList(membersMap);
  const present = members.filter((x) => x.present);

  const delegatesNo: number = members.length;
  const presentNo: number = present.length;
  const absCanVote: number = members.filter(canVote).length;
  const canVoteNo: number = present.filter(canVote).length;
  const nonNGONo: number = present.filter(nonNGO).length;

  const simpleMajority: number = Math.ceil(canVoteNo * 0.5);
  const twoThirdsMajority: number = Math.ceil(canVoteNo * (2 / 3));

  const quorum: number = Math.ceil(absCanVote * 0.25);
  const procedural: number = Math.ceil(nonNGONo * 0.5);
  const operative: number = Math.ceil(canVoteNo * 0.5);
  const hasQuorum: boolean = presentNo >= quorum;
  const draftResolution: number = Math.ceil(canVoteNo * 0.25);
  const amendment: number = Math.ceil(canVoteNo * 0.1);

  return {
    delegatesNo,
    presentNo,
    absCanVote,
    canVoteNo,
    nonNGONo,
    quorum,
    procedural,
    operative,
    hasQuorum,
    draftResolution,
    amendment,
    twoThirdsMajority,
    simpleMajority,
  };
}

export function CommitteeStatsTable(props: { data?: CommitteeData; verbose?: boolean }) {
  const { data, verbose } = props;

  // TODO: Fill this table out with all fields.
  const {
    delegatesNo,
    presentNo,
    canVoteNo,
    quorum,
    procedural,
    operative,
    hasQuorum,
    draftResolution,
    amendment,
    twoThirdsMajority,
  } = makeCommitteeStats(data);

  return (
    <Table definition>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell />
          <Table.HeaderCell>Number</Table.HeaderCell>
          <Table.HeaderCell>Description</Table.HeaderCell>
          {verbose && <Table.HeaderCell>Threshold</Table.HeaderCell>}
        </Table.Row>
      </Table.Header>

      <Table.Body>
        <Table.Row>
          <Table.Cell>Total</Table.Cell>
          <Table.Cell>{delegatesNo.toString()}</Table.Cell>
          <Table.Cell>Delegates in committee</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Present</Table.Cell>
          <Table.Cell>{presentNo.toString()}</Table.Cell>
          <Table.Cell>Delegates in attendance</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Have voting rights</Table.Cell>
          <Table.Cell>{canVoteNo.toString()}</Table.Cell>
          <Table.Cell>Present delegates with voting rights</Table.Cell>
        </Table.Row>
        {verbose && (
          <Table.Row>
            <Table.Cell error={!hasQuorum}>Debate</Table.Cell>
            <Table.Cell error={!hasQuorum}>{quorum.toString()}</Table.Cell>
            <Table.Cell error={!hasQuorum}>Delegates needed for debate</Table.Cell>
            <Table.Cell error={!hasQuorum}>25% of of members with voting rights</Table.Cell>
          </Table.Row>
        )}
        {verbose && (
          <Table.Row>
            <Table.Cell>Procedural threshold</Table.Cell>
            <Table.Cell>{procedural.toString()}</Table.Cell>
            <Table.Cell>Required votes for procedural matters</Table.Cell>
            <Table.Cell>50% of present non-NGO delegates</Table.Cell>
          </Table.Row>
        )}
        <Table.Row>
          <Table.Cell>Operative threshold</Table.Cell>
          <Table.Cell>{operative.toString()}</Table.Cell>
          <Table.Cell>Required votes for operative matters, such as amendments</Table.Cell>
          {verbose && <Table.Cell>50% of present delegates with voting rights</Table.Cell>}
        </Table.Row>
        <Table.Row>
          <Table.Cell>Two-thirds majority</Table.Cell>
          <Table.Cell>{twoThirdsMajority.toString()}</Table.Cell>
          <Table.Cell>Required votes for passing resolutions</Table.Cell>
          {verbose && <Table.Cell>2/3 of present delegates with voting rights</Table.Cell>}
        </Table.Row>
        {verbose && (
          <Table.Row>
            <Table.Cell>Draft resolution</Table.Cell>
            <Table.Cell>{draftResolution.toString()}</Table.Cell>
            <Table.Cell>Delegates needed to table a draft resolution</Table.Cell>
            <Table.Cell>25% of present delegates with voting rights</Table.Cell>
          </Table.Row>
        )}
        {verbose && (
          <Table.Row>
            <Table.Cell>Amendment</Table.Cell>
            <Table.Cell>{amendment.toString()}</Table.Cell>
            <Table.Cell>Delegates needed to table an amendment</Table.Cell>
            <Table.Cell>10% of present delegates with voting rights</Table.Cell>
          </Table.Row>
        )}
      </Table.Body>
    </Table>
  );
}
