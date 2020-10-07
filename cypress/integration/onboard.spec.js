import { purge, enterUsernameAndPassword } from './utils'

const CHAIRPERSON = 'Test chairperson'
const TOPIC = 'Test topic'
const COMMITTEE = 'Test committee'
const CONFERENCE = 'Test conference'

describe('Run through creating a new committee', function () {
  before(function() {
    purge()
    cy.visit("/")
  })

  it('visits the homepage and navigates to the onboarding screen', function () {
    cy.contains("Create a committee").click()
    cy.url().should('include', '/onboard')
  })

  it('attempts to create an account that is already in use, and then logs in', function () {
    cy.get('button').contains('Login').then(() => {
      enterUsernameAndPassword()

      cy.contains('Create account').click()
      cy.contains('in use by another account')

      cy.get('button').contains('Login').click()
    })
  })

  it('creates a new committee', function () {
    cy.get('input[placeholder="Committee name"')
      .type(COMMITTEE)
      .should('have.value', COMMITTEE)

    cy.get('input[placeholder="Committee topic"')
      .type(TOPIC)
      .should('have.value', TOPIC)

    cy.get('input[placeholder="Name(s) of chairperson or chairpeople"')
      .type(CHAIRPERSON)
      .should('have.value', CHAIRPERSON)

    cy.get('input[placeholder="Conference name"')
      .type(CONFERENCE)
      .should('have.value', CONFERENCE)


    const createButton = cy.get('button').contains('Create committee')

    createButton.should('not.be.disabled')
    createButton.click()

    cy.url().should('include', '/committees')

    cy.get('input[placeholder="Committee name"')
      .should('have.value', COMMITTEE)

    cy.get('input[placeholder="Committee topic"')
      .should('have.value', TOPIC)

    cy.get('input[placeholder="Name(s) of chairperson or chairpeople"')
      .should('have.value', CHAIRPERSON)

    cy.get('input[placeholder="Conference name"')
      .should('have.value', CONFERENCE)
  })
})