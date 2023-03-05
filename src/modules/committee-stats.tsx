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

  const delegatesNo: number     = members.length-2;
  const presentNo: number       = present.length;
  const absCanVote: number      = members.filter(canVote).length;
  const canVoteNo: number       = present.filter(canVote).length-1;
  const nonNGONo: number        = present.filter(nonNGO).length;

  const simpleMajority: number = Math.ceil(canVoteNo * 0.5)+1;
  const twoThirdsMajority: number = Math.ceil(canVoteNo * (2 / 3));

  const quorum: number          = Math.ceil(absCanVote * 0.25);
  const procedural: number      = Math.ceil(nonNGONo * 0.5);
  const operative: number       = Math.ceil(absCanVote * 0.66);
  const hasQuorum: boolean      = presentNo >= quorum + 1;
  const LiderBancada: number 	= 2;
  const amendment: number       = Math.ceil(absCanVote * 0.1);

  return { delegatesNo, presentNo, absCanVote, canVoteNo, nonNGONo, quorum, 
    procedural, operative, hasQuorum, LiderBancada, amendment, twoThirdsMajority, simpleMajority };
}

export function CommitteeStatsTable(props: { data?: CommitteeData, verbose?: boolean }) {
  const { data, verbose } = props;

  // TODO: Fill this table out with all fields.
  const  { delegatesNo, presentNo, canVoteNo, quorum, 
    procedural, operative, hasQuorum, LiderBancada, amendment, twoThirdsMajority } = makeCommitteeStats(data);

  return (
    <Table definition>
      <Table.Header>
        <Table.Row>
          <Table.HeaderCell />
          <Table.HeaderCell>Número de Conselheiros</Table.HeaderCell>
          <Table.HeaderCell>Descrição</Table.HeaderCell>
          {verbose && <Table.HeaderCell>Quorum</Table.HeaderCell>}
        </Table.Row>
      </Table.Header>

      <Table.Body>
        <Table.Row>
          <Table.Cell>Total</Table.Cell>
          <Table.Cell>{delegatesNo.toString()}</Table.Cell>
          <Table.Cell>Conselheiros Titulares</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Presentes</Table.Cell>
          <Table.Cell>{presentNo.toString()}</Table.Cell>
          <Table.Cell>Conselheiros Presentes</Table.Cell>
        </Table.Row>
        <Table.Row>
          <Table.Cell>Direito ao voto</Table.Cell>
          <Table.Cell>{canVoteNo.toString()}</Table.Cell>
          <Table.Cell>Conselheiros presentes com o direito ao voto</Table.Cell>
        </Table.Row>
        {verbose && <Table.Row>
          <Table.Cell error={!hasQuorum}>Quorum das Reuniões</Table.Cell>
          <Table.Cell error={!hasQuorum}>{quorum.toString()}</Table.Cell>
          <Table.Cell error={!hasQuorum}>Número de Conselheiros necessários para abrir a reunião</Table.Cell>
          <Table.Cell error={!hasQuorum}>1/3 dos Conselheiros</Table.Cell>
        </Table.Row>}
        {verbose && <Table.Row>
          <Table.Cell>Maioria Simples</Table.Cell>
          <Table.Cell>{procedural.toString()}</Table.Cell>
          <Table.Cell>Votos necessários para a Maioria Simples</Table.Cell>
          <Table.Cell>50% + 1 dos Conselheiros presentes com direito ao voto</Table.Cell>
        </Table.Row>}
        <Table.Row>
          <Table.Cell>Maioria Qualificada</Table.Cell>
          <Table.Cell>{operative.toString()}</Table.Cell>
          <Table.Cell>Votos necessários para a Maioria Qualificada</Table.Cell>
          {verbose && <Table.Cell>2/3 dos Conselheiros, Incluido o Presidente</Table.Cell>}
        </Table.Row>
        <Table.Row>
          <Table.Cell>Maioria Absoluta</Table.Cell>
          <Table.Cell>{twoThirdsMajority.toString()}</Table.Cell>
          <Table.Cell>Votos para a Maioria Absoluta</Table.Cell>
          {verbose && <Table.Cell>2/3 dos Conselheiros presentes com direito ao voto</Table.Cell>}
        </Table.Row>
        {verbose && <Table.Row>
          <Table.Cell>Direito à Liderança</Table.Cell>
          <Table.Cell>{LiderBancada.toString()}</Table.Cell>
          <Table.Cell>Quando uma bancada ganha direito de constituir uma Liderança</Table.Cell>
          <Table.Cell>2 Cadeiras de UFs diferentes</Table.Cell>
        </Table.Row>}
        {verbose && <Table.Row>
          <Table.Cell>Direito à Concorrer as Eleições</Table.Cell>
          <Table.Cell>{amendment.toString()}</Table.Cell>
          <Table.Cell>Quando a bancada pode lançar candidatos</Table.Cell>
          <Table.Cell>10% das Cadeiras do CONFED</Table.Cell>
        </Table.Row>}
      </Table.Body>
    </Table>
  );
}