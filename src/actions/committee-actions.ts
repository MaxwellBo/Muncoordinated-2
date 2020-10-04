import * as firebase from 'firebase/app';
import { CommitteeData, CommitteeID } from '../components/Committee';
import { TimerData, DEFAULT_TIMER } from '../components/Timer';
import { CaucusData, CaucusID } from '../components/Caucus';
import { MemberOption } from '../constants'
import { MemberID, nameToMemberOption, MemberData } from '../components/Member';
import { objectToList } from '../utils';
import { ResolutionID, ResolutionData } from '../components/Resolution';
import { SettingsData, DEFAULT_SETTINGS } from '../components/Settings';
import { Dictionary } from '../types';
import _ from 'lodash';

export function presentMembersToOptions(members: Dictionary<MemberID, MemberData> | undefined): MemberOption[] {
  const options = objectToList(members || {})
    .filter(x => x.present)
    .map(x => nameToMemberOption(x.name));

  return _.sortBy(options, (option: MemberOption) => option.text);
}


export function recoverPresentMemberOptions(committee?: CommitteeData): MemberOption[] {
  if (committee) {
    return presentMembersToOptions(committee.members);
  } else {
    return [];
  }
}

export function recoverPresentMembers(committee?: CommitteeData): Dictionary<MemberID, MemberData> | undefined {
  return committee ? (committee.members || {} as Dictionary<MemberID, MemberData>) : undefined;
}

export function recoverSettings(committee?: CommitteeData): SettingsData {
  let timersInSeparateColumns: boolean = DEFAULT_SETTINGS.timersInSeparateColumns;
  let moveQueueUp: boolean = DEFAULT_SETTINGS.moveQueueUp;
  let autoNextSpeaker: boolean = DEFAULT_SETTINGS.autoNextSpeaker;

  if (committee) {
    if (committee.settings.timersInSeparateColumns !== undefined) {
      timersInSeparateColumns = committee.settings.timersInSeparateColumns;
    }

    if (committee.settings.moveQueueUp !== undefined) {
      moveQueueUp = committee.settings.moveQueueUp;
    }

    if (committee.settings.autoNextSpeaker !== undefined) {
      autoNextSpeaker = committee.settings.autoNextSpeaker;
    }
  }

  return {
    timersInSeparateColumns, moveQueueUp, autoNextSpeaker
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

        return { ...DEFAULT_TIMER, remaining: newRemaining };

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