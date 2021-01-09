export const AUTH_MODAL_TRIGGER = '.nav__auth-status'
export const SANDBOX = '/committees/-LQCVY1042m3UW3y6ojd'

export function purge() {
  indexedDB.deleteDatabase('firebaseLocalStorageDb')
  cy.clearLocalStorage()
}

export function enterUsernameAndPassword() {
  cy.get('input[autocomplete=email]')
    .type('fake@email.com')
    .should('have.value', 'fake@email.com')

  cy.get('input[autocomplete=current-password]')
    .type('fakepassword')
    .should('have.value', 'fakepassword')
}

export function enterUsernameAndPasswordAndHitsEnter() {
  cy.get('input[autocomplete=email]')
    .type('fake@email.com')
    .should('have.value', 'fake@email.com')

  cy.get('input[autocomplete=current-password]')
    .type('fakepassword{enter}')
    .should('have.value', 'fakepassword')
}

export function invokeModalAndLogin() {
  cy.get('button').contains('Log in').click()
  enterUsernameAndPassword()
  cy.get('.modal').find('button').contains('Login').click()
  cy.get('body').type('{esc}')
  cy.wait(2000)
}