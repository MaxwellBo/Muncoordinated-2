import {MemberData, MemberID, MemberOption, membersToOptions, membersToPresentOptions, Rank} from '../modules/member';
import {logCreateMember} from '../modules/analytics';
import _ from 'lodash';
import {CaucusData, CaucusID, DEFAULT_CAUCUS} from "./caucus";
import { DEFAULT_CAUCUS_TIME_SECONDS } from './constants';
import firebase from "firebase/compat/app";
import {PostData, PostID} from "./post";
import {MotionData, MotionID} from "./motion";
import {DEFAULT_TIMER, TimerData} from "./time";
import {ResolutionData, ResolutionID} from "./resolution";
import {DEFAULT_SETTINGS, SettingsData} from "./settings";
import {StrawpollData, StrawpollID} from "./strawpoll";

export function recoverMemberOptions(committee?: CommitteeData): MemberOption[] {
  if (committee) {
    return membersToOptions(committee.members);
  } else {
    return [];
  }
}

export function recoverPresentMemberOptions(committee?: CommitteeData): MemberOption[] {
  if (committee) {
    return membersToPresentOptions(committee.members);
  } else {
    return [];
  }
}

export function recoverMembers(committee?: CommitteeData): Record<MemberID, MemberData> | undefined {
  return committee ? (committee.members || {} as Record<MemberID, MemberData>) : undefined;
}

export function recoverSettings(committee?: CommitteeData): Required<SettingsData> {
  let timersInSeparateColumns: boolean =
    committee?.settings.timersInSeparateColumns
    ?? DEFAULT_SETTINGS.timersInSeparateColumns;

  const moveQueueUp: boolean =
    committee?.settings.moveQueueUp
    ?? DEFAULT_SETTINGS.moveQueueUp;

  const autoNextSpeaker: boolean =
    committee?.settings.autoNextSpeaker
    ?? DEFAULT_SETTINGS.autoNextSpeaker;

  const motionVotes: boolean =
    committee?.settings.motionVotes
    ?? DEFAULT_SETTINGS.motionVotes;

  const motionsArePublic: boolean =
    committee?.settings.motionsArePublic
    ?? DEFAULT_SETTINGS.motionsArePublic;

  return {
    timersInSeparateColumns,
    moveQueueUp,
    autoNextSpeaker,
    motionVotes,
    motionsArePublic
  };
}

export function recoverCaucus(committee: CommitteeData | undefined, caucusID: CaucusID): CaucusData | undefined {
  const caucuses = committee ? committee.caucuses : {};

  return (caucuses || {})[caucusID];
}

export function recoverResolution(committee: CommitteeData | undefined, resolutionID: ResolutionID): ResolutionData | undefined {
  const resolutions = committee ? committee.resolutions : {};

  return (resolutions || {})[resolutionID];
}

export type CommitteeID = string;

export enum Template {
  AfricanUnion = 'African Union',
  ASEAN = 'Association of Southeast Asian Nations',
  BRICS = 'BRICS',
  EU = 'European Union',
  G20 = 'G20',
  NATO = 'North Atlantic Treaty Organization',
  SecurityCouncil = 'UN Security Council',
  // TODO: Support these templates against at some point
  // UNHRC = 'UN Human Rights Council',
  // UNICEF = 'UN Children\'s Fund',
  // WHOHealthBoard = 'WHO Health Board',
}

export interface CommitteeData {
  name: string;
  chair: string;
  topic: string;
  conference?: string; // TODO: Migrate
  template?: Template;
  creatorUid: firebase.UserInfo['uid'];
  members?: Record<MemberID, MemberData>;
  caucuses?: Record<CaucusID, CaucusData>;
  resolutions?: Record<ResolutionID, ResolutionData>;
  strawpolls?: Record<StrawpollID, StrawpollData>;
  motions?: Record<MotionID, MotionData>;
  files?: Record<PostID, PostData>;
  timer: TimerData;
  notes: string;
  settings: SettingsData;
}

const GENERAL_SPEAKERS_LIST: CaucusData = {
  ...DEFAULT_CAUCUS, name: 'General Speakers\' List'
};
export const DEFAULT_COMMITTEE: CommitteeData = {
  name: '',
  chair: '',
  topic: '',
  conference: '',
  creatorUid: '',
  members: {} as Record<MemberID, MemberData>,
  caucuses: {
    'gsl': GENERAL_SPEAKERS_LIST
  } as Record<string, CaucusData>,
  resolutions: {} as Record<ResolutionID, ResolutionData>,
  files: {} as Record<PostID, PostData>,
  strawpolls: {} as Record<StrawpollID, StrawpollData>,
  motions: {} as Record<MotionID, MotionData>,
  timer: {...DEFAULT_TIMER, remaining: DEFAULT_CAUCUS_TIME_SECONDS},
  notes: '',
  settings: DEFAULT_SETTINGS
};
export const putCommittee =
  (committeeID: CommitteeID, committeeData: CommitteeData): firebase.database.Reference => {
    const ref = firebase.database()
      .ref('committees')
      .child(committeeID)

    ref.set(committeeData);

    return ref;
  };

// tslint:disable-next-line
export const putUnmodTimer = (committeeID: CommitteeID, timerData: TimerData): Promise<any> => {
  const ref = firebase.database()
    .ref('committees')
    .child(committeeID)
    .child('timer')
    .set(timerData);

  return ref;
};

// tslint:disable-next-line
const extendTimer = (ref: firebase.database.Reference, seconds: number): Promise<any> => {
  return ref.transaction((timerData: TimerData) => {
    if (timerData) {

      let newRemaining;

      // This is correct, if not a little unclear
      if (timerData.remaining <= 0) {
        newRemaining = seconds;
      } else if (!timerData.ticking) {
        newRemaining = timerData.remaining + seconds;
      } else {
        newRemaining = seconds;
      }

      return {...DEFAULT_TIMER, remaining: newRemaining};

    } else {
      return timerData;
    }
  });
};

// tslint:disable-next-line
export const extendModTimer = (committeeID: CommitteeID, caucusID: CaucusID, seconds: number): Promise<any> => {
  const ref = firebase.database()
    .ref('committees')
    .child(committeeID)
    .child('caucuses')
    .child(caucusID)
    .child('caucusTimer');

  return extendTimer(ref, seconds);
};

// tslint:disable-next-line
export const extendUnmodTimer = (committeeID: CommitteeID, seconds: number): Promise<any> => {
  const ref = firebase.database()
    .ref('committees')
    .child(committeeID)
    .child('timer');

  return extendTimer(ref, seconds);
};

export const pushMember = (committeeID: CommitteeID, member: MemberData) => {
  const ref = firebase.database()
    .ref('committees')
    .child(committeeID);


  ref.child('members').push().set(member);

  logCreateMember(member.name)
}

export const TEMPLATE_TO_MEMBERS: Record<Template, {
  name: MemberData['name']
  rank?: Rank // not allowed to use members due to import order
}[]> = {
  'African Union': [
    {name: 'Algeria'},
    {name: 'Angola'},
    {name: 'Benin'},
    {name: 'Botswana'},
    {name: 'Burkina Faso'},
    {name: 'Burundi'},
    {name: 'Cameroon'},
    {name: 'Cape Verde'},
    {name: 'Central African Republic'},
    {name: 'Chad'},
    {name: 'Comoros'},
    {name: 'Congo'},
    {name: 'Cote Divoire'},
    {name: 'Djibouti'},
    {name: 'Egypt'},
    {name: 'Equatorial Guinea'},
    {name: 'Eritrea'},
    {name: 'Ethiopia'},
    {name: 'Gabon'},
    {name: 'Ghana'},
    {name: 'Guinea-Bissau'},
    {name: 'Guinea'},
    {name: 'Kenya'},
    {name: 'Lesotho'},
    {name: 'Liberia'},
    {name: 'Libya'},
    {name: 'Madagascar'},
    {name: 'Malawi'},
    {name: 'Mali'},
    {name: 'Mauritania'},
    {name: 'Mauritius'},
    {name: 'Morocco'},
    {name: 'Mozambique'},
    {name: 'Namibia'},
    {name: 'Niger'},
    {name: 'Nigeria'},
    {name: 'Rwanda'},
    {name: 'Sao Tome'},
    {name: 'Senegal'},
    {name: 'Sierra Leone'},
    {name: 'Sudan'},
    {name: 'Tanzania'},
    {name: 'Togo'},
    {name: 'Tunisia'},
    {name: 'Uganda'},
    {name: 'Zambia'},
    {name: 'Zimbabwe'}
  ],
  'Association of Southeast Asian Nations': [
    {name: 'Brunei'},
    {name: 'Cambodia'},
    {name: 'Indonesia'},
    {name: 'Laos'},
    {name: 'Malaysia'},
    {name: 'Myanmar'},
    {name: 'Philippines'},
    {name: 'Singapore'},
    {name: 'Thailand'},
    {name: 'Vietnam'}
  ],
  'BRICS': [
    {name: 'Brazil'},
    {name: 'China'},
    {name: 'India'},
    {name: 'Russia'},
    {name: 'South Africa'}
  ],
  'European Union': [
    {name: 'Austria'},
    {name: 'Belgium'},
    {name: 'Bulgaria'},
    {name: 'Croatia'},
    {name: 'Cyprus'},
    {name: 'Czechia'},
    {name: 'Denmark'},
    {name: 'Estonia'},
    {name: 'Finland'},
    {name: 'France'},
    {name: 'Germany'},
    {name: 'Greece'},
    {name: 'Hungary'},
    {name: 'Ireland'},
    {name: 'Italy'},
    {name: 'Latvia'},
    {name: 'Lithuania'},
    {name: 'Luxembourg'},
    {name: 'Malta'},
    {name: 'Netherlands'},
    {name: 'Poland'},
    {name: 'Portugal'},
    {name: 'Romania'},
    {name: 'Slovakia'},
    {name: 'Slovenia'},
    {name: 'Spain'},
    {name: 'Sweden'},
  ],
  'G20': [
    {name: 'Argentina'},
    {name: 'Australia'},
    {name: 'Brazil'},
    {name: 'Canada'},
    {name: 'China'},
    {name: 'European Union'},
    {name: 'France'},
    {name: 'Germany'},
    {name: 'India'},
    {name: 'Indonesia'},
    {name: 'Italy'},
    {name: 'Japan'},
    {name: 'Mexico'},
    {name: 'Russia'},
    {name: 'Saudi Arabia'},
    {name: 'South Africa'},
    {name: 'South Korea'},
    {name: 'Turkey'},
    {name: 'United Kingdom'},
    {name: 'United States'},
  ],
  'North Atlantic Treaty Organization': [
    {name: 'Albania'},
    {name: 'Belgium'},
    {name: 'Bulgaria'},
    {name: 'Canada'},
    {name: 'Croatia'},
    {name: 'Czechia'},
    {name: 'Denmark'},
    {name: 'United Kingdom'},
    {name: 'Estonia'},
    {name: 'Finland'}, // since 2023
    {name: 'France'},
    {name: 'Germany'},
    {name: 'Greece'},
    {name: 'Hungary'},
    {name: 'Iceland'},
    {name: 'Italy'},
    {name: 'Latvia'},
    {name: 'Lithuania'},
    {name: 'Luxembourg'},
    {name: 'North Macedonia'},
    {name: 'Montenegro'},
    {name: 'Netherlands Antilles'},
    {name: 'Netherlands'},
    {name: 'Norway'},
    {name: 'Poland'},
    {name: 'Portugal'},
    {name: 'Romania'},
    {name: 'Slovakia'},
    {name: 'Slovenia'},
    {name: 'Spain'},
    {name: 'Sweden'}, // since 2024
    {name: 'Turkey'},
    {name: 'United Arab Emirates'},
    {name: 'United States'},
  ],
  'UN Security Council': [
    {name: 'Algeria'},
    {name: 'China', rank: Rank.Veto},
    {name: 'Denmark'},
    {name: 'France', rank: Rank.Veto},
    {name: 'Greece'},
    {name: 'Guyana'},
    {name: 'Pakistan'},
    {name: 'Panama'},
    {name: 'Russia', rank: Rank.Veto},
    {name: 'Sierra Leone'},
    {name: 'Slovenia'},
    {name: 'Somalia'},
    {name: 'South Korea'},
    {name: 'United Kingdom', rank: Rank.Veto},
    {name: 'United States', rank: Rank.Veto},
  ],
}
export const pushTemplateMembers = (committeeID: CommitteeID, template: Template) => {
  const ref = firebase.database()
    .ref('committees')
    .child(committeeID);

  ref.child('members').once('value', (snapshot) => {
    const members: Record<MemberID, MemberData> = snapshot.val() || {};
    const memberNames = Object.keys(members).map(id =>
      members[id].name
    );

    [...TEMPLATE_TO_MEMBERS[template]]
      // Don't try and readd members that already exist
      .filter(member => !_.includes(memberNames, member.name))
      .forEach(
        member =>
          pushMember(committeeID, {
            name: member.name,
            rank: member.rank ?? Rank.Standard,
            present: true,
            voting: false
          })
      );
  });
}
