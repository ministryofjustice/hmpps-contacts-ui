import Page from '../pages/page'
import TestData from '../../server/routes/testutils/testData'
import DirectSearchContactsPage from '../pages/directSearchContactsPage'

const { prisonerNumber } = TestData.prisoner()

context('Direct Search contacts', () => {
  beforeEach(() => {
    cy.task('reset')
    cy.task('stubSignIn', { roles: ['PRISON', 'CONTACTS_ADMINISTRATOR'] })
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
    cy.task('stubContactSearchV2', {
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

    cy.signIn({ startUrl: `/start` })

    Page.verifyOnPage(DirectSearchContactsPage)
  })

  it(`should search with first and middle name are entered`, () => {
    const searchContactPage = Page.verifyOnPage(DirectSearchContactsPage)
    searchContactPage.enterFirstName('Firstname')
    searchContactPage.enterMiddleNames('Middlename')
    searchContactPage.clickSearchButton()

    cy.verifyAPIWasCalled(
      {
        method: 'GET',
        urlPattern: '/contact/searchV2.+',
      },
      1,
    )
  })

  it(`should not pass validation when dob is incomplete`, () => {
    const searchContactPage = Page.verifyOnPage(DirectSearchContactsPage)
    searchContactPage.enterLastName('Lastname')
    searchContactPage.showAdvancedOption()

    searchContactPage.enterDay('10')
    searchContactPage.clickSearchButton()

    searchContactPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain('Date of birth must include a month and a year')
    })
  })

  it(`should not pass validation when year is invalid`, () => {
    const searchContactPage = Page.verifyOnPage(DirectSearchContactsPage)
    searchContactPage.enterLastName('Lastname')
    searchContactPage.showAdvancedOption()

    searchContactPage.enterDay('10')
    searchContactPage.enterMonth('02')
    searchContactPage.enterYear('99')
    searchContactPage.clickSearchButton()

    searchContactPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain('Year must include 4 numbers')
    })
  })

  it(`should not pass validation when dob is in the future`, () => {
    const searchContactPage = Page.verifyOnPage(DirectSearchContactsPage)
    searchContactPage.enterLastName('Lastname')
    searchContactPage.showAdvancedOption()

    searchContactPage.enterDay('10')
    searchContactPage.enterMonth('02')
    searchContactPage.enterYear('2090')
    searchContactPage.clickSearchButton()

    searchContactPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain('Date of birth must be in the past')
    })
  })

  it(`should not pass validation when dob is not valid`, () => {
    const searchContactPage = Page.verifyOnPage(DirectSearchContactsPage)
    searchContactPage.enterLastName('Lastname')
    searchContactPage.showAdvancedOption()

    searchContactPage.enterDay('29')
    searchContactPage.enterMonth('02')
    searchContactPage.enterYear('1990')
    searchContactPage.clickSearchButton()

    searchContactPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain('Date of birth must be a real date')
    })
  })

  it(`should pass validation when only last name is entered`, () => {
    const searchContactPage = Page.verifyOnPage(DirectSearchContactsPage)
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
    const searchContactPage = Page.verifyOnPage(DirectSearchContactsPage)
    searchContactPage.enterFirstName('Jones')
    searchContactPage.enterLastName('Mason')
    searchContactPage.enterMiddleNames('middle')
    searchContactPage.showAdvancedOption()

    searchContactPage.enterDay('14')
    searchContactPage.enterMonth('1')
    searchContactPage.enterYear('1990')
    searchContactPage.clickSearchButton()
    searchContactPage.checkOnPage()

    cy.verifyAPIWasCalled(
      {
        method: 'GET',
        urlPattern: '/contact/searchV2.+',
      },
      1,
    )

    searchContactPage.verifyShowsNameAs('Mason')
    searchContactPage.verifyShowsDobAs('14/1/1990')
    searchContactPage.verifyShowsAddressAs(
      '32<br>Acacia Avenue<br>Bunting<br>Sheffield<br>South Yorkshire<br>S2 3LK<br>England',
    )
  })

  it(`should pass validation when day and month starts with 0`, () => {
    const searchContactPage = Page.verifyOnPage(DirectSearchContactsPage)
    searchContactPage.enterFirstName('Jones')
    searchContactPage.enterLastName('Mason')
    searchContactPage.enterMiddleNames('middle')
    searchContactPage.showAdvancedOption()

    searchContactPage.enterDay('01')
    searchContactPage.enterMonth('01')
    searchContactPage.enterYear('1990')
    searchContactPage.clickSearchButton()
    searchContactPage.checkOnPage()
  })

  it(`should pass validation when only contact id is entered`, () => {
    const searchContactPage = Page.verifyOnPage(DirectSearchContactsPage)
    searchContactPage.showAdvancedOption()
    searchContactPage.enterContactId('123456')
    searchContactPage.clickSearchButton()
    searchContactPage.checkOnPage()

    cy.verifyAPIWasCalled(
      {
        method: 'GET',
        urlPattern: '/contact/searchV2.+',
      },
      1,
    )
  })
})
