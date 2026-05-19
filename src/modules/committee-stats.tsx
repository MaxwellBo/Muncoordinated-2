import * as React from 'react';
import * as Utils from '../utils';
import { canVote, MemberData, MemberID, nonNGO } from './member';
import { Table } from 'semantic-ui-react';
import {CommitteeData} from "../models/committee";

export function makeCommitteeStats(data?: CommitteeData) {
  const defaultMap = {} as Record<MemberID, MemberData>;
  const membersMap: Record<MemberID, MemberData> = data ? (data.members || defaultMap) : defaultMap;
  const members: MemberData[] = Utils.objectToList(membersMap);
  const present = members.filter(x => x.present);

  const delegatesNo: number     = members.length;
  const presentNo: number       = present.length;
  const absCanVote: number      = members.filter(canVote).length;
  const canVoteNo: number       = present.filter(canVote).length;
  const nonNGONo: number        = present.filter(nonNGO).length;

  const simpleMajority: number = Math.ceil(canVoteNo * 0.5);
  const twoThirdsMajority: number = Math.ceil(canVoteNo * (2 / 3));

  const quorum: number          = Math.ceil(absCanVote * 0.25);
  const procedural: number      = Math.ceil(nonNGONo * 0.5 + 1);
  const operative: number       = Math.ceil(canVoteNo * 0.5);
  const hasQuorum: boolean      = presentNo >= quorum;
  const draftResolution: number = Math.ceil(canVoteNo * 0.25);
  const amendment: number       = Math.ceil(canVoteNo * 0.1);

  return { delegatesNo, presentNo, absCanVote, canVoteNo, nonNGONo, quorum, 
    procedural, operative, hasQuorum, draftResolution, amendment, twoThirdsMajority, simpleMajority };
}

export function CommitteeStatsTable(props: { data?: CommitteeData, verbose?: boolean }) {
  const { data, verbose } = props;

  // TODO: Fill this table out with all fields.
  const  { delegatesNo, presentNo, canVoteNo, quorum, 
    procedural, operative, hasQuorum, draftResolution, amendment, twoThirdsMajority } = makeCommitteeStats(data);

  return (
    <Table definition>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell />
          <Table.HeaderCell>Số lượng</Table.HeaderCell>
          <Table.HeaderCell>Miêu tả</Table.HeaderCell>
          {verbose && <Table.HeaderCell>Hạn mức</Table.HeaderCell>}
        </Table.Row>
      </Table.Header>

      <Table.Body>
        <Table.Row>
          <Table.Cell>Tổng</Table.Cell>
          <Table.Cell>{delegatesNo.toString()}</Table.Cell>
          <Table.Cell>Số lượng đại biểu trong hội đồng</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Có mặt</Table.Cell>
          <Table.Cell>{presentNo.toString()}</Table.Cell>
          <Table.Cell>Số lượng đại biểu có mặt</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Có quyền biểu quyết</Table.Cell>
          <Table.Cell>{canVoteNo.toString()}</Table.Cell>
          <Table.Cell>Số lượng đại biểu có mặt và có quyền biểu quyết

          </Table.Cell>
        </Table.Row>
        {verbose && <Table.Row>
          <Table.Cell error={!hasQuorum}>Bắt đầu</Table.Cell>
          <Table.Cell error={!hasQuorum}>{quorum.toString()}</Table.Cell>
          <Table.Cell error={!hasQuorum}>Số lượng đại biểu cần để có thể bắt đầu phiên họp</Table.Cell>
          <Table.Cell error={!hasQuorum}>25% thành viên có quyền biểu quyết</Table.Cell>
        </Table.Row>}
        {verbose && <Table.Row>
          <Table.Cell>Đa số quá bán</Table.Cell>
          <Table.Cell>{procedural.toString()}</Table.Cell>
          <Table.Cell>Số phiếu cần thiết để thông qua một vấn đề nghị trình</Table.Cell>
          <Table.Cell>50% số đại biểu có mặt (không bao gồm NGO)</Table.Cell>
        </Table.Row>}
        <Table.Row>
          <Table.Cell>Đa số 2/3</Table.Cell>
          <Table.Cell>{twoThirdsMajority.toString()}</Table.Cell>
          <Table.Cell>Số phiếu cần thiết để thông qua một vấn đề nội dung</Table.Cell>
          {verbose && <Table.Cell>2/3 số đại biểu có quyền biểu quyết</Table.Cell>}
        </Table.Row>
        {verbose && <Table.Row>
          <Table.Cell>Nghị quyết</Table.Cell>
          <Table.Cell>{draftResolution.toString()}</Table.Cell>
          <Table.Cell>Số lượng đại biểu cần thiết để bỏ nghị quyết</Table.Cell>
          <Table.Cell>25% số đại biểu có quyền biểu quyết</Table.Cell>
        </Table.Row>}
        {verbose && <Table.Row>
          <Table.Cell>Chỉnh sửa</Table.Cell>
          <Table.Cell>{amendment.toString()}</Table.Cell>
          <Table.Cell>Số lượng đại biểu cần thiết để bỏ đề xuất chỉnh sửa</Table.Cell>
          <Table.Cell>10% số đại biểu có quyền biểu quyết</Table.Cell>
        </Table.Row>}
      </Table.Body>
    </Table>
  );
}