import { SANDBOX, purge, invokeModalAndLogin } from './utils'
import 'cypress-real-events/support'

const UPLOAD_FILENAME = 'upload-test.txt'

describe('Uploads a file to committee posts', function () {
  before(function () {
    purge()
    cy.visit(SANDBOX)
  })

  it('logs in to our test account', () => {
    invokeModalAndLogin()
  })

  it('navs to the posts screen', () => {
    cy.contains('Posts').click()
    cy.url().should('include', '/posts')
  })

  it('uploads a file as Afghanistan', () => {
    cy.contains('.item', 'File').click()

    cy.get('input[type="file"]').selectFile('cypress/fixtures/upload-test.txt', {
      force: true,
    })

    cy.contains('Uploader').siblings().find('input').click().type('Afghanistan{enter}')

    cy.contains('button', 'Upload').should('not.be.disabled').click()

    cy.contains('.feed', 'Afghanistan', { timeout: 15000 }).should('contain', 'uploaded a file')
    cy.contains('.feed a', UPLOAD_FILENAME).should('be.visible')
  })
})
