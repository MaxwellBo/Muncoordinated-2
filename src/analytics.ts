import * as ReactGA from 'react-ga';

export function logCreateAccount(uid: string | undefined) {
  ReactGA.ga('send', {
    hitType: 'event',
    eventCategory: 'Account',
    eventAction: 'create',
    eventLabel: uid
  });
}

export function logCreateCommittee(committeeID: string | undefined) {
  ReactGA.ga('send', {
    hitType: 'event',
    eventCategory: 'Committee',
    eventAction: 'create',
    eventLabel: committeeID
  });
}