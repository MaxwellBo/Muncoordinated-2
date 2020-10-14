import * as ReactGA from 'react-ga';
import * as Sentry from "@sentry/react";

/**
 * Homepage
 */

export function logClickCreateACommitteeButton() {
  send('clickButton', {
    action: 'click',
    category: 'Button',
    label: '[Create a committee ->] @ Homepage',
  });
}

export function logClickLogInButton() {
  send('clickButton', {
    action: 'click',
    category: 'Button',
    label: '[Log in] @ Homepage',
  });
}

export function logClickSignupButton() {
  send('clickButton', {
    action: 'click',
    category: 'Button',
    label: '[Sign Up] @ Homepage',
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
    category: 'Committee',
    action: 'create',
    label: committeeID
  });
}

/**
 * Committee
 */

export function logClickSetupCommittee() {
  send('clickButton', {
    category: 'Button',
    action: 'click',
    label: '[Setup committee ->] @ Committee'
  });
}

/**
 * Admin
 */

export function logCreateMember(name: string) {
  send('createMember', {
    category: 'Member',
    action: 'create',
    label: name
  });
}

export function logClickGeneralSpeakersList() {
  send('clickButton', {
    category: 'Button',
    action: 'click',
    label: '[General Speaker\'s List ->] @ Setup'
  });
}

/**
 * Utils
 */

export function send(id: string, event: ReactGA.EventArgs) {
  ReactGA.event(event);
}