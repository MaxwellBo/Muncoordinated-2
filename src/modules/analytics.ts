import * as ReactGA from 'react-ga';
import * as Sentry from "@sentry/react";

/**
 * Homepage
 */

export function logClickCreateACommitteeButton() {
  send('clickCreateACommitteeHomepageButton', {
    action: 'click',
    category: 'CreateACommitteeHomepageButton'
  });
}

export function logClickLogInButton() {
  send('clickLoginHomepageButton', {
    action: 'click',
    category: 'LoginHomepageButton',
  });
}

export function logClickSignupButton() {
  send('clickSignupHomepageButton', {
    action: 'click',
    category: 'SignupHomepageButton',
  });
}

/**
 * Onboard
 */

export function logLogin(uid: string | undefined) {
  Sentry.setUser({ id: uid })

  send('loginAccount', {
    action: 'login',
    category: 'Account',
    label: uid
  });
}

export function logCreateAccount(uid: string | undefined) {
  Sentry.setUser({ id: uid })

  send('createAccount', {
    action: 'create',
    category: 'Account',
    label: uid
  });
}

export function logCreateCommittee(committeeID: string | undefined) {
  send('createCommittee', {
    action: 'create',
    category: 'Committee',
    label: committeeID
  });
}

/**
 * Committee
 */

export function logClickSetupCommittee() {
  send('clickSetupCommitteeCommitteeButton', {
    action: 'click',
    category: 'SetupCommitteeCommitteeButton',
    label: '[Setup committee ->] @ Committee'
  });
}

/**
 * Admin
 */

export function logCreateMember(name: string) {
  send('createMember', {
    action: 'create',
    category: 'Member',
    label: name
  });
}

export function logClickGeneralSpeakersList() {
  send('clickGeneralSpeakersListSetupButton', {
    action: 'click',
    category: 'GeneralSpeakersListSetupButton'
  });
}

/**
 * Utils
 */

export function send(id: string, event: ReactGA.EventArgs) {
  ReactGA.event(event);
}