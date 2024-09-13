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
  })

  it(`should not pass validation when last name is not entered`, () => {
    firstName().clear().type('Firstname')
    middleName().clear().type('Middlename')
    searchButton().click()
  })

  it(`should not pass validation when special characters are entered`, () => {
    firstName().clear().type('^%&*(££')
    middleName().clear().type('^%&*(££')
    lastName().clear().type('^%&*(££')
    day().clear().type('^%&*(££')
    month().clear().type('^%&*(££')
    year().clear().type('^%&*(££')
    searchButton().click()
  })

  it(`should not pass validation when lastname and day are entered`, () => {
    lastName().clear().type('Lastname')
    day().clear().type('10')
    searchButton().click()
  })

  it(`should not pass validation when lastname, day, and month are entered`, () => {
    lastName().clear().type('Lastname')
    day().clear().type('10')
    month().clear().type('02')
    searchButton().click()
  })

  it(`should not pass validation when year is invalid`, () => {
    lastName().clear().type('Lastname')
    day().clear().type('10')
    month().clear().type('02')
    year().clear().type('100')
    searchButton().click()
  })

  it(`should not pass validation when dob is in the future`, () => {
    lastName().clear().type('Lastname')
    day().clear().type('10')
    month().clear().type('02')
    year().clear().type('2090')
    searchButton().click()
  })

  it(`should pass validation when last name is entered`, () => {
    lastName().clear().type('Lastname')
    searchButton().click()
  })
})
