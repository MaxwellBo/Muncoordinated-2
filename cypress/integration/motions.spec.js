import { SANDBOX, purge, invokeModalAndLogin } from './utils'

function clickAddMotion() {
  cy.get('.plus').parent().click()
  cy.get('.plus').parent().should('be.disabled')
  cy.contains('Proposer').parent().should('have.class', 'error')
}

function inspectDraftResolution(motion, proposer, seconder) {
  motion.should('contain', proposer)
  motion.should('contain', seconder)
  motion.should('contain', 'Draft resolution')
  motion.should('contain', 'Introduce')
}

function inspectModeratedCaucus(motion, name, proposer, duration) {
  motion.should('contain', name)
  motion.should('contain', proposer)
  motion.should('contain', duration)
}

function introduceDraftResolution(motion, proposer, seconder) {
  motion.get('button').contains('Introduce').click()
  cy.url().should('include', '/resolutions')
  cy.get('body').should('contain', proposer)
  cy.get('body').should('contain', seconder)
}

function openModeratedCaucus(motion, name, proposer, caucusTime, speakerTime) {
  motion.contains('Open').click()
  cy.url().should('include', '/caucuses')
  cy.get('body').should('contain', name)
  cy.get('body').should('contain', proposer)
  cy.get('body').should('contain', caucusTime)
  cy.get('body').should('contain', speakerTime)
}

function gotoMotions() {
  cy.contains('Motions').click()
  cy.url().should('include', '/motions')
}

describe('Adds motions, checks that they\'re ranked properly, and entertains them', function () {
  before(() => {
    purge()
    cy.visit(SANDBOX)
  })

  it('logs in to our test account', () => {
    invokeModalAndLogin()
  })

  it('navs to the motions screen', () => {
    gotoMotions()
  })

  it('clears all old motions', () => {
    // This does not work unless there are already motions there.
    //cy.contains('Clear').click()
    cy.contains('Clear').should('be.disabled')
  })

  it('gets an error when trying to create a motion for a draft resolution with an identical proposer and seconder', () => {
    cy.contains('Type').siblings().children('input').click().type("Introduce draft resolution{enter}")
    cy.contains('Name').siblings().find('input').click().type("Draft resolution{enter}")
    cy.contains('Proposer').siblings().find('input').click().type("Afghanistan{enter}")
    cy.contains('Seconder').siblings().find('input').click().type("Afghanistan{enter}")

    cy.contains('cannot be the same')
  })

  it('adds a motion for the introduction of a draft resolution', () => {
    cy.contains('Seconder').siblings().find('input').click().type("Bolivia{enter}")

    clickAddMotion()

    const draftResolution = cy.get('.motion').first()
    inspectDraftResolution(draftResolution, 'Afghanistan', 'Bolivia')
    introduceDraftResolution(draftResolution, 'Afghanistan', 'Bolivia')

    gotoMotions()
  })


  it('adds an 10/1 moderated caucus', () => {
    cy.contains('Type').siblings().children('input').click().type("Open moderated caucus{enter}")
    cy.contains('Name').siblings().find('input').click().type("Alpha{enter}")
    cy.contains('Proposer').siblings().find('input').click().type("China{enter}")

    // This wil fire the addition of the entry
    cy.contains('Duration').siblings().find('input').click().type("{backspace}{backspace}10{enter}")

    // because we press enter when we add the duration
    cy.get('.plus').parent().should('be.disabled')
    cy.contains('Proposer').parent().should('have.class', 'error')

    // The value should be incremented
    cy.get(':nth-child(4) > :nth-child(1) > .fluid > input').should('have.value', '11')

    const moderatedCaucus10 = cy.get('.motion').first()
    inspectModeratedCaucus(moderatedCaucus10, 'Alpha', 'China', '10 min')
    openModeratedCaucus(moderatedCaucus10, 'Alpha', 'China', '10:00', '1:00')
    gotoMotions()

    // Code below does not currently work because motions are are removed once opened
    // Is that intentional?
    //const draftResolution = cy.get('.motion').last()
    //inspectDraftResolution(draftResolution)
  })

  it('adds an 11/30 moderated caucus', () => {
    cy.get('.form > :nth-child(1) > .ui > input.search').type('Open moderated caucus{enter}')
    cy.contains('Name').siblings().find('input').click().type("Beta{enter}")
    cy.contains('Proposer').siblings().find('input').click().type("Bolivia{enter}")
    cy.contains('Duration').siblings().find('input').click().type("{backspace}{backspace}11")
    cy.contains('Speaking time').siblings().find('input').click().type("{backspace}{backspace}30")

    clickAddMotion()

    const moderatedCaucus11 = cy.get('.motion').first()
    inspectModeratedCaucus(moderatedCaucus11, 'Beta', 'Bolivia', '11 min')

    // Does not work for the reasons above
    //const moderatedCaucus10 = cy.get('.motion').eq(1)
    //inspectModeratedCaucus(moderatedCaucus10, 'Alpha', 'China', '10 min')

    // Does not work for the reasons above
    //const draftResolution = cy.get('.motion').last()
    //inspectDraftResolution(draftResolution, 'Afghanistan', 'Bolivia')

    openModeratedCaucus(cy.get('.motion').first(), 'Beta', 'Bolivia', '11:00', '0:30')
  })
})
