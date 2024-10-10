import Page from '../pages/page'
import SearchPrisonerPage from '../pages/searchPrisoner'
import TestData from '../../server/routes/testutils/testData'
import SearchContactPage from '../pages/searchContactPage'
import ListContactsPage from '../pages/listContacts'
import IndexPage from '../pages'

const { prisonerNumber } = TestData.prisoner()

const ENTER_THE_CONTACTS_LAST_NAME = `Enter the contact's last name`
const CONTACTS_LAST_NAME_MUST_NOT_CONTAIN_SPECIAL_CHARACTERS = `Contact's last name must not contain special characters`
const CONTACTS_MIDDLE_NAME_MUST_NOT_CONTAIN_SPECIAL_CHARACTERS = `Contact's middle names must not contain special characters`
const CONTACTS_FIRST_NAME_MUST_NOT_CONTAIN_SPECIAL_CHARACTERS = `Contact's first name must not contain special characters`
const ENTER_A_VALID_DAY_OF_THE_MONTH = `Enter a valid day of the month (1-31)`
const ENTER_A_VALID_MONTH = `Enter a valid month (1-12)`
const ENTER_A_VALID_YEAR = `Enter a valid year. Must be at least 1900`
const THE_DATE_OF_BIRTH_MUST_NOT_BE_IN_THE_FUTURE = `The date of birth must not be in the future`
const DOB_IS_INVALID = 'The date of birth is invalid'

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
        totalPages: 1,
        totalElements: 1,
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

    Page.verifyOnPage(SearchPrisonerPage)
    searchPrisonerPage.clickPrisonerLink()

    Page.verifyOnPage(ListContactsPage) //
      .clickAddNewContactButton()

    Page.verifyOnPage(SearchContactPage)
  })

  it(`should not pass validation when last name is not entered`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterFirstName('Firstname')
    searchContactPage.enterMiddleNames('Middlename')
    searchContactPage.clickSearchButton()

    searchContactPage.hasFieldInError('lastName', ENTER_THE_CONTACTS_LAST_NAME)
  })

  it(`should not pass validation when special characters are entered`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterFirstName('^%&*(££')
    searchContactPage.enterMiddleNames('^%&*(££')
    searchContactPage.enterLastName('^%&*(££')
    searchContactPage.enterDay('^%&*(££')
    searchContactPage.enterMonth('^%&*(££')
    searchContactPage.enterYear('^%&*(££')
    searchContactPage.clickSearchButton()

    searchContactPage.hasFieldInError('lastName', CONTACTS_LAST_NAME_MUST_NOT_CONTAIN_SPECIAL_CHARACTERS)
    searchContactPage.hasFieldInError('firstName', CONTACTS_FIRST_NAME_MUST_NOT_CONTAIN_SPECIAL_CHARACTERS)
    searchContactPage.hasFieldInError('middleNames', CONTACTS_MIDDLE_NAME_MUST_NOT_CONTAIN_SPECIAL_CHARACTERS)
    searchContactPage.hasFieldInError('dob', ENTER_A_VALID_DAY_OF_THE_MONTH)
    searchContactPage.hasFieldInError('dob', ENTER_A_VALID_MONTH)
    searchContactPage.hasFieldInError('dob', ENTER_A_VALID_YEAR)
  })

  it(`should not pass validation when lastname and day are entered`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterLastName('Lastname')
    searchContactPage.enterDay('10')
    searchContactPage.clickSearchButton()

    searchContactPage.hasFieldInError('dob', ENTER_A_VALID_MONTH)
    searchContactPage.hasFieldInError('dob', ENTER_A_VALID_YEAR)

    searchContactPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(2)
      expect($lis[0]).to.contain(ENTER_A_VALID_MONTH)
      expect($lis[1]).to.contain(ENTER_A_VALID_YEAR)
    })
  })

  it(`should not pass validation when lastname, day, and month are entered`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterLastName('Lastname')
    searchContactPage.enterDay('10')
    searchContactPage.enterMonth('02')
    searchContactPage.clickSearchButton()

    searchContactPage.hasFieldInError('dob', ENTER_A_VALID_YEAR)

    searchContactPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain(ENTER_A_VALID_YEAR)
    })
  })

  it(`should not pass validation when year is invalid`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterLastName('Lastname')
    searchContactPage.enterDay('10')
    searchContactPage.enterMonth('02')
    searchContactPage.enterYear('100')
    searchContactPage.clickSearchButton()

    searchContactPage.hasFieldInError('dob', ENTER_A_VALID_YEAR)

    searchContactPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain(ENTER_A_VALID_YEAR)
    })
  })

  it(`should not pass validation when dob is in the future`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterLastName('Lastname')
    searchContactPage.enterDay('10')
    searchContactPage.enterMonth('02')
    searchContactPage.enterYear('2090')
    searchContactPage.clickSearchButton()

    searchContactPage.hasFieldInError('dob', THE_DATE_OF_BIRTH_MUST_NOT_BE_IN_THE_FUTURE)

    searchContactPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain(THE_DATE_OF_BIRTH_MUST_NOT_BE_IN_THE_FUTURE)
    })
  })

  it(`should not pass validation when dob is not valid`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterLastName('Lastname')
    searchContactPage.enterDay('29')
    searchContactPage.enterMonth('02')
    searchContactPage.enterYear('1990')
    searchContactPage.clickSearchButton()

    searchContactPage.hasFieldInError('dob', DOB_IS_INVALID)

    searchContactPage.errorSummaryItems.spread((...$lis) => {
      expect($lis).to.have.lengthOf(1)
      expect($lis[0]).to.contain(DOB_IS_INVALID)
    })
  })

  it(`should pass validation when only last name is entered`, () => {
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterLastName('Mason')
    searchContactPage.clickSearchButton()
    searchContactPage.checkOnPage()

    searchContactPage.verifyShowsNameAs('Mason')
    searchContactPage.verifyShowsDobAs('14/01/1990')
    searchContactPage.verifyShowsAddressAs('Flat 32, Acacia Avenue')
    searchContactPage.verifyShowsAddressAs('Bunting')
    searchContactPage.verifyShowsAddressAs('Sheffield')
    searchContactPage.verifyShowsAddressAs('South Yorkshire')
    searchContactPage.verifyShowsAddressAs('S2 3LK')
    searchContactPage.verifyShowsAddressAs('England')
  })

  it(`should pass validation when all the fields are entered`, () => {
    cy.task('stubContactSearch', {
      results: {
        totalPages: 1,
        totalElements: 1,
        content: [TestData.contactSearchResultItem()],
      },
      lastName: 'Mason',
      firstName: 'Jones',
      middleNames: 'middle',
      dateOfBirth: '1990-01-14',
    })
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterFirstName('Jones')
    searchContactPage.enterLastName('Mason')
    searchContactPage.enterMiddleNames('middle')
    searchContactPage.enterDay('14')
    searchContactPage.enterMonth('1')
    searchContactPage.enterYear('1990')
    searchContactPage.clickSearchButton()
    searchContactPage.checkOnPage()

    searchContactPage.verifyShowsNameAs('Mason')
    searchContactPage.verifyShowsDobAs('14/01/1990')
    searchContactPage.verifyShowsAddressAs('Flat 32, Acacia Avenue')
    searchContactPage.verifyShowsAddressAs('Bunting')
    searchContactPage.verifyShowsAddressAs('Sheffield')
    searchContactPage.verifyShowsAddressAs('South Yorkshire')
    searchContactPage.verifyShowsAddressAs('S2 3LK')
    searchContactPage.verifyShowsAddressAs('England')
    searchContactPage.verifyShowsTheContactIsNotListedAs('The contact is not listed')
  })

  it(`should pass validation when day and month starts with 0`, () => {
    cy.task('stubContactSearch', {
      results: {
        totalPages: 1,
        totalElements: 1,
        content: [TestData.contactSearchResultItem()],
      },
      lastName: 'Mason',
      firstName: 'Jones',
      middleNames: 'middle',
      dateOfBirth: '1990-01-01',
    })
    const searchContactPage = Page.verifyOnPage(SearchContactPage)
    searchContactPage.enterFirstName('Jones')
    searchContactPage.enterLastName('Mason')
    searchContactPage.enterMiddleNames('middle')
    searchContactPage.enterDay('01')
    searchContactPage.enterMonth('01')
    searchContactPage.enterYear('1990')
    searchContactPage.clickSearchButton()
    searchContactPage.checkOnPage()
  })
})
