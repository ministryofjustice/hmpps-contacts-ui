import { v4 as uuidv4 } from 'uuid'
import Page, { PageElement } from '../pages/page'
import SearchPrisonerPage from '../pages/searchPrisoner'
import TestData from '../../server/routes/testutils/testData'
import ListContactsPage from '../pages/listContacts'

const journeyId: string = uuidv4()
const { prisonerNumber } = TestData.prisoner()

const firstName = (): PageElement => cy.get('#firstName')
const lastName = (): PageElement => cy.get('#lastName')
const middleName = (): PageElement => cy.get('#middleName')
const day = (): PageElement => cy.get('#day')
const month = (): PageElement => cy.get('#month')
const year = (): PageElement => cy.get('#year')
const searchButton = (): PageElement => cy.get('[data-qa="search-button"]')

const errorSummaryMessageClassElement = '.govuk-error-summary__body > .govuk-list > '
const firstNameError = '#firstName-error'
const middleNameError = '#middleName-error'
const lastNameError = '#lastName-error'
const formSpanGovukErrorMessage = 'form > span.govuk-error-message'

const ENER_THE_CONTACTS_LAST_NAME = `Enter the contact's last name`
const CONTACTS_LAST_NAME_MUST_NOT_CONTAIN_SPECIAL_CHARACTERS = `Contact's last name must not contain special characters`
const CONTACTS_MIDDLE_NAME_MUST_NOT_CONTAIN_SPECIAL_CHARACTERS = `Contact's middle name must not contain special characters`
const CONTACTS_FIRST_NAME_MUST_NOT_CONTAIN_SPECIAL_CHARACTERS = `Contact's first name must not contain special characters`
const ENTER_A_VALID_DAY_OF_THE_MONTH = `Enter a valid day of the month (1-31)`
const ENTER_A_VALID_MONTH = `Enter a valid month (1-12)`
const ENTER_A_VALID_YEAR = `Enter a valid year. Must be at least 1900`
const THE_DATE_OF_BIRTH_MUST_NOT_BE_IN_THE_FUTURE = `The date of birth must not be in the future`

context('Search contact', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubComponentsMeta')
    cy.signIn()
    cy.visit(`/prisoner/A1234BC/contacts/search/${journeyId}`)

    cy.task('stubComponentsMeta')
    cy.task('stubPrisoners', {
      results: {
        totalPages: 1,
        totalElements: 1,
        content: [TestData.prisoner()],
      },
      prisonId: 'HEI',
      term: prisonerNumber,
    })
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubContactList', 'A1234BC')

    const searchPrisonerPage = Page.verifyOnPage(SearchPrisonerPage)
    searchPrisonerPage.prisonerSearchFormField().clear().type(prisonerNumber)
    searchPrisonerPage.prisonerSearchSearchButton().click()
    Page.verifyOnPage(SearchPrisonerPage)
    searchPrisonerPage.clickPrisonerLink()
    Page.verifyOnPage(ListContactsPage)
    searchPrisonerPage.clickAddContactButton()
  })

  it(`should not pass validation when last name is not entered`, () => {
    firstName().clear().type('Firstname')
    middleName().clear().type('Middlename')
    searchButton().click()
    cy.get(`${errorSummaryMessageClassElement} li > a`)
      .should('be.visible')
      .should('contain.text', ENER_THE_CONTACTS_LAST_NAME)
    cy.get(lastNameError).should('be.visible').should('be.visible').should('contain.text', ENER_THE_CONTACTS_LAST_NAME)
  })

  it(`should not pass validation when special characters are entered`, () => {
    firstName().clear().type('^%&*(££')
    middleName().clear().type('^%&*(££')
    lastName().clear().type('^%&*(££')
    day().clear().type('^%&*(££')
    month().clear().type('^%&*(££')
    year().clear().type('^%&*(££')
    searchButton().click()
    cy.get(`${errorSummaryMessageClassElement} :nth-child(1) > a`)
      .should('be.visible')
      .should('contain.text', CONTACTS_LAST_NAME_MUST_NOT_CONTAIN_SPECIAL_CHARACTERS)
    cy.get(`${errorSummaryMessageClassElement} :nth-child(2) > a`)
      .should('be.visible')
      .should('contain.text', CONTACTS_MIDDLE_NAME_MUST_NOT_CONTAIN_SPECIAL_CHARACTERS)
    cy.get(`${errorSummaryMessageClassElement} :nth-child(3) > a`)
      .should('be.visible')
      .should('contain.text', CONTACTS_FIRST_NAME_MUST_NOT_CONTAIN_SPECIAL_CHARACTERS)
    cy.get(`${errorSummaryMessageClassElement} :nth-child(4) > a`)
      .should('be.visible')
      .should('contain.text', ENTER_A_VALID_DAY_OF_THE_MONTH)
    cy.get(`${errorSummaryMessageClassElement} :nth-child(5) > a`)
      .should('be.visible')
      .should('contain.text', ENTER_A_VALID_MONTH)
    cy.get(`${errorSummaryMessageClassElement} :nth-child(6) > a`)
      .should('be.visible')
      .should('contain.text', ENTER_A_VALID_YEAR)

    cy.get(firstNameError)
      .should('be.visible')
      .should('contain.text', CONTACTS_FIRST_NAME_MUST_NOT_CONTAIN_SPECIAL_CHARACTERS)
    cy.get(middleNameError)
      .should('be.visible')
      .should('contain.text', CONTACTS_MIDDLE_NAME_MUST_NOT_CONTAIN_SPECIAL_CHARACTERS)
    cy.get(lastNameError)
      .should('be.visible')
      .should('contain.text', CONTACTS_LAST_NAME_MUST_NOT_CONTAIN_SPECIAL_CHARACTERS)
    cy.get(`${formSpanGovukErrorMessage}:eq(0)`)
      .should('be.visible')
      .should('contain.text', ENTER_A_VALID_DAY_OF_THE_MONTH)
    cy.get(`${formSpanGovukErrorMessage}:eq(1)`).should('be.visible').should('contain.text', ENTER_A_VALID_MONTH)
    cy.get(`${formSpanGovukErrorMessage}:eq(2)`).should('be.visible').should('contain.text', ENTER_A_VALID_YEAR)
  })

  it(`should not pass validation when lastname and day are entered`, () => {
    lastName().clear().type('Lastname')
    day().clear().type('10')
    searchButton().click()
    cy.get(`${errorSummaryMessageClassElement} :nth-child(1) > a`)
      .should('be.visible')
      .should('contain.text', ENTER_A_VALID_MONTH)
    cy.get(`${errorSummaryMessageClassElement} :nth-child(2) > a`)
      .should('be.visible')
      .should('contain.text', ENTER_A_VALID_YEAR)
    cy.get(`${formSpanGovukErrorMessage}:eq(1)`).should('be.visible').should('contain.text', ENTER_A_VALID_MONTH)
    cy.get(`${formSpanGovukErrorMessage}:eq(2)`).should('be.visible').should('contain.text', ENTER_A_VALID_YEAR)
  })

  it(`should not pass validation when lastname, day, and month are entered`, () => {
    lastName().clear().type('Lastname')
    day().clear().type('10')
    month().clear().type('02')
    searchButton().click()
    cy.get(`${errorSummaryMessageClassElement} :nth-child(1) > a`)
      .should('be.visible')
      .should('contain.text', ENTER_A_VALID_YEAR)
    cy.get(`${formSpanGovukErrorMessage}:eq(2)`).should('be.visible').should('contain.text', ENTER_A_VALID_YEAR)
  })

  it(`should not pass validation when year is invalid`, () => {
    lastName().clear().type('Lastname')
    day().clear().type('10')
    month().clear().type('02')
    year().clear().type('100')
    searchButton().click()
    cy.get(`${errorSummaryMessageClassElement} :nth-child(1) > a`)
      .should('be.visible')
      .should('contain.text', ENTER_A_VALID_YEAR)
    cy.get(`${formSpanGovukErrorMessage}:eq(2)`).should('be.visible').should('contain.text', ENTER_A_VALID_YEAR)
  })

  it(`should not pass validation when dob is in the future`, () => {
    lastName().clear().type('Lastname')
    day().clear().type('10')
    month().clear().type('02')
    year().clear().type('2090')
    searchButton().click()
    cy.get(`${errorSummaryMessageClassElement} :nth-child(1) > a`)
      .should('be.visible')
      .should('contain.text', THE_DATE_OF_BIRTH_MUST_NOT_BE_IN_THE_FUTURE)
    cy.get(`${formSpanGovukErrorMessage}:eq(3)`)
      .should('be.visible')
      .should('contain.text', THE_DATE_OF_BIRTH_MUST_NOT_BE_IN_THE_FUTURE)
  })

  it(`should pass validation when last name is entered`, () => {
    lastName().clear().type('Lastname')
    searchButton().click()
    cy.get(`${errorSummaryMessageClassElement} :nth-child(1) > a`).should('not.exist')
    cy.get(`${errorSummaryMessageClassElement} :nth-child(2) > a`).should('not.exist')
    cy.get(`${errorSummaryMessageClassElement} :nth-child(3) > a`).should('not.exist')
    cy.get(`${errorSummaryMessageClassElement} :nth-child(4) > a`).should('not.exist')
    cy.get(`${errorSummaryMessageClassElement} :nth-child(5) > a`).should('not.exist')
    cy.get(`${errorSummaryMessageClassElement} :nth-child(6) > a`).should('not.exist')

    cy.get(firstNameError).should('not.exist')
    cy.get(middleNameError).should('not.exist')
    cy.get(lastNameError).should('not.exist')
    cy.get(`${formSpanGovukErrorMessage}:eq(0)`).should('not.exist')
    cy.get(`${formSpanGovukErrorMessage}:eq(0)`).should('not.exist')
    cy.get(`${formSpanGovukErrorMessage}:eq(0)`).should('not.exist')
  })
})
