import * as firebase from 'firebase/app';
import { CommitteeData, CommitteeID } from '../pages/Committee';
import { TimerData, DEFAULT_TIMER } from '../components/timer/Timer';
import { CaucusID } from '../pages/Caucus';
import { MemberData, MemberID, Rank } from '../modules/member';
import { logCreateMember } from '../modules/analytics';
import { Template, TEMPLATE_TO_MEMBERS } from '../modules/template';
import _ from 'lodash';

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

export const pushMember = (committeeID: CommitteeID, member: MemberData) =>{
  const ref = firebase.database()
    .ref('committees')
    .child(committeeID);


  ref.child('members').push().set(member);

  logCreateMember(member.name)
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
