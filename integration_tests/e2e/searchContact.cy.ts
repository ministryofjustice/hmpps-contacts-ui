import Page from '../pages/page'
import SearchPrisonerPage from '../pages/searchPrisoner'
import TestData from '../../server/routes/testutils/testData'
import SearchContactPage from '../pages/searchContactPage'
import ListContactsPage from '../pages/listContacts'
import IndexPage from '../pages'

const { prisonerNumber } = TestData.prisoner()

context('Search contact', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['PRISON'] })
    cy.task('stubComponentsMeta')
    cy.task('stubPrisonerById', TestData.prisoner())
    cy.task('stubContactList', TestData.prisoner().prisonerNumber)
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
    cy.task('stubContactSearch', {
      results: {
        page: {
          totalPages: 1,
          totalElements: 1,
        },
        content: [TestData.contactSearchResultItem()],
      },
      lastName: 'Mason',
      firstName: '',
      middleNames: '',
      dateOfBirth: '',
    })

    cy.signIn()
    cy.visit(`/`)
    Page.verifyOnPage(IndexPage).manageContactsCard().click()

    const searchPrisonerPage = Page.verifyOnPage(SearchPrisonerPage)
    searchPrisonerPage.prisonerSearchFormField().clear().type(prisonerNumber)
    searchPrisonerPage.prisonerSearchSearchButton().click()

    Page.verifyOnPage(SearchPrisonerPage).clickPrisonerLink('A1234BC')

    Page.verifyOnPage(ListContactsPage, 'John Smith').clickAddNewContactButton()

    Page.verifyOnPage(SearchContactPage)
  })

  it(`should not search when last name is not entered`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterFirstName('Firstname')
    searchContactPage.enterMiddleNames('Middlename')
    searchContactPage.clickSearchButton()

    cy.verifyAPIWasCalled(
      {
        method: 'GET',
        urlPattern: '/contact/search.+',
      },
      0,
    )
  })

  it(`should not pass validation when lastname and dob is incomplete`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterLastName('Lastname')
    searchContactPage.clickSearchButton()

    searchContactPage.enterDay('10')
    searchContactPage.clickFilterButton()

    searchContactPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain('Date of birth must include a month and a year')
    })
  })

  it(`should not pass validation when year is invalid`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterLastName('Lastname')
    searchContactPage.clickSearchButton()

    searchContactPage.enterDay('10')
    searchContactPage.enterMonth('02')
    searchContactPage.enterYear('99')
    searchContactPage.clickFilterButton()

    searchContactPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain('Year must include 4 numbers')
    })
  })

  it(`should not pass validation when dob is in the future`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterLastName('Lastname')
    searchContactPage.clickSearchButton()

    searchContactPage.enterDay('10')
    searchContactPage.enterMonth('02')
    searchContactPage.enterYear('2090')
    searchContactPage.clickFilterButton()

    searchContactPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain('Date of birth must be in the past')
    })
  })

  it(`should not pass validation when dob is not valid`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterLastName('Lastname')
    searchContactPage.clickSearchButton()

    searchContactPage.enterDay('29')
    searchContactPage.enterMonth('02')
    searchContactPage.enterYear('1990')
    searchContactPage.clickFilterButton()

    searchContactPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain('Date of birth must be a real date')
    })
  })

  it(`should pass validation when only last name is entered`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterLastName('Mason')
    searchContactPage.clickSearchButton()
    searchContactPage.checkOnPage()

    cy.verifyAPIWasCalled(
      {
        method: 'GET',
        urlPattern: '/contact/search.+',
      },
      1,
    )

    searchContactPage.verifyShowsNameAs('Mason')
    searchContactPage.verifyShowsDobAs('14/1/1990')
    searchContactPage.verifyShowsAddressAs(
      '32<br>Acacia Avenue<br>Bunting<br>Sheffield<br>South Yorkshire<br>S2 3LK<br>England',
    )
  })

  it(`should pass validation when all the fields are entered`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterFirstName('Jones')
    searchContactPage.enterLastName('Mason')
    searchContactPage.enterMiddleNames('middle')
    searchContactPage.clickSearchButton()

    searchContactPage.enterDay('14')
    searchContactPage.enterMonth('1')
    searchContactPage.enterYear('1990')
    searchContactPage.clickFilterButton()
    searchContactPage.checkOnPage()

    cy.verifyAPIWasCalled(
      {
        method: 'GET',
        urlPattern: '/contact/search.+',
      },
      2,
    )

    searchContactPage.verifyShowsNameAs('Mason')
    searchContactPage.verifyShowsDobAs('14/1/1990')
    searchContactPage.verifyShowsAddressAs(
      '32<br>Acacia Avenue<br>Bunting<br>Sheffield<br>South Yorkshire<br>S2 3LK<br>England',
    )
  })

  it(`should pass validation when day and month starts with 0`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterFirstName('Jones')
    searchContactPage.enterLastName('Mason')
    searchContactPage.enterMiddleNames('middle')
    searchContactPage.clickSearchButton()

    searchContactPage.enterDay('01')
    searchContactPage.enterMonth('01')
    searchContactPage.enterYear('1990')
    searchContactPage.clickFilterButton()
    searchContactPage.checkOnPage()
  })
})
