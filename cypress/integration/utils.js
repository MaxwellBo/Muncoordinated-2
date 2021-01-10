export const AUTH_MODAL_TRIGGER = '.nav__auth-status'
export const SANDBOX = '/committees/-LQCVY1042m3UW3y6ojd'

export function purge() {
  indexedDB.deleteDatabase('firebaseLocalStorageDb')
  cy.clearLocalStorage()
}

export function enterUsername() {
  cy.get('input[autocomplete=email]')
    .type('fake@email.com')
    .should('have.value', 'fake@email.com')
}

export function enterCurrentPassword() {
  cy.get('input[autocomplete=current-password]')
    .type('fakepassword')
    .should('have.value', 'fakepassword')
}

export function enterNewPassword() {
  cy.get('input[autocomplete=new-password]')
    .type('fakepassword')
    .should('have.value', 'fakepassword')
}

export function invokeModalAndLogin() {
  cy.get('button').contains('Login').click()
  enterUsername()
  enterCurrentPassword()
  cy.get('.modal').find('button').contains('Log in').click()
  cy.get('body').type('{esc}')
  cy.wait(2000)
}