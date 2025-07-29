import { v4 as uuidv4 } from 'uuid'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from './addContactFlowControl'
import { Page } from '../../../services/auditService'
import { BreadcrumbType, Navigation } from '../common/navigation'
import { AddContactJourney } from '../../../@types/journeys'
import { adminUser, authorisingUser } from '../../testutils/appSetup'
import { HmppsUser } from '../../../interfaces/hmppsUser'
import { ContactSearchResultItem } from '../../../@types/contactsApiClient'
import TestData from '../../testutils/testData'

describe('addContactFlowControl', () => {
  describe('add new contact', () => {
    describe('getNavigationForAddContactJourney', () => {
      const journeyId = uuidv4()

      it.each([
        [
          Page.CREATE_CONTACT_NAME_PAGE,
          `/prisoner/A1234BC/contacts/search/${journeyId}`,
          undefined,
          'Back to contact search',
          adminUser,
        ],
        [
          Page.CREATE_CONTACT_DOB_PAGE,
          `/prisoner/A1234BC/contacts/create/select-relationship-to-prisoner/${journeyId}`,
          undefined,
          undefined,
          adminUser,
        ],
        [
          Page.SELECT_RELATIONSHIP_TYPE,
          `/prisoner/A1234BC/contacts/create/enter-name/${journeyId}`,
          undefined,
          undefined,
          adminUser,
        ],
        [
          Page.SELECT_CONTACT_RELATIONSHIP,
          `/prisoner/A1234BC/contacts/create/select-relationship-type/${journeyId}`,
          undefined,
          undefined,
          adminUser,
        ],
        [
          Page.SELECT_EMERGENCY_CONTACT_OR_NEXT_OF_KIN,
          `/prisoner/A1234BC/contacts/create/enter-dob/${journeyId}`,
          undefined,
          undefined,
          adminUser,
        ],
        [
          Page.ADD_CONTACT_APPROVED_TO_VISIT_PAGE,
          `/prisoner/A1234BC/contacts/create/emergency-contact-or-next-of-kin/${journeyId}`,
          undefined,
          undefined,
          adminUser,
        ],
        [
          Page.ENTER_ADDITIONAL_INFORMATION_PAGE,
          `/prisoner/A1234BC/contacts/create/emergency-contact-or-next-of-kin/${journeyId}`,
          undefined,
          `Back to emergency contact and next of kin`,
          adminUser,
        ],
        [
          Page.ENTER_ADDITIONAL_INFORMATION_PAGE,
          `/prisoner/A1234BC/contacts/create/approved-to-visit/${journeyId}`,
          undefined,
          `Back to visits approval`,
          authorisingUser,
        ],
        [
          Page.ENTER_RELATIONSHIP_COMMENTS,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
          undefined,
          undefined,
          adminUser,
        ],
        [
          Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
          `/prisoner/A1234BC/contacts/add/cancel/${journeyId}`,
          'Back to additional information options',
          adminUser,
        ],
        [
          Page.ADD_CONTACT_CANCEL_PAGE,
          `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`,
          undefined,
          undefined,
          adminUser,
        ],
        [
          Page.ADD_CONTACT_ADD_PHONE_PAGE,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
          undefined,
          undefined,
          adminUser,
        ],
        [
          Page.ADD_CONTACT_DELETE_PHONE_PAGE,
          `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`,
          `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`,
          undefined,
          adminUser,
        ],
        [
          Page.ADD_CONTACT_ENTER_GENDER_PAGE,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
          undefined,
          undefined,
          adminUser,
        ],
        [
          Page.ADD_CONTACT_IS_STAFF_PAGE,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
          undefined,
          undefined,
          adminUser,
        ],
        [
          Page.ADD_CONTACT_LANGUAGE_INTERPRETER_PAGE,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
          undefined,
          undefined,
          adminUser,
        ],
        [
          Page.ADD_CONTACT_DOMESTIC_STATUS_PAGE,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
          undefined,
          undefined,
          adminUser,
        ],
        [
          Page.ADD_EMPLOYMENTS,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
          undefined,
          'Back to additional information options',
          adminUser,
        ],
        [
          Page.ADD_ADDRESSES,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
          undefined,
          'Back to additional information options',
          adminUser,
        ],
        [
          Page.ADD_CONTACT_REVIEW_EXISTING_RELATIONSHIPS_PAGE,
          `/prisoner/A1234BC/contacts/search/${journeyId}`,
          undefined,
          'Back to contact search',
          adminUser,
        ],
      ])(
        'Should go back to previous page: from %s to %s',
        (
          page: Page,
          expectedBackUrl: string | undefined,
          expectedCancelButton: string | undefined,
          expectedBackLabel: string | undefined,
          user: HmppsUser,
        ) => {
          const journey: AddContactJourney = {
            id: journeyId,
            lastTouched: new Date().toISOString(),
            prisonerNumber: 'A1234BC',
            mode: 'NEW',
            isCheckingAnswers: false,
            dateOfBirth: {
              isKnown: 'NO',
            },
          }
          const expected: Navigation = {
            backLink: expectedBackUrl,
            backLinkLabel: expectedBackLabel,
            breadcrumbs: undefined,
            cancelButton: expectedCancelButton,
          }

          const nav = navigationForAddContactJourney(page, journey, user)

          expect(nav).toStrictEqual(expected)
        },
      )

      it.each([
        [Page.CREATE_CONTACT_NAME_PAGE, undefined, 'Back to contact search'],
        [Page.CREATE_CONTACT_DOB_PAGE, undefined, undefined],
        [Page.SELECT_RELATIONSHIP_TYPE, undefined, undefined],
        [Page.SELECT_CONTACT_RELATIONSHIP, undefined, undefined],
        [Page.SELECT_EMERGENCY_CONTACT_OR_NEXT_OF_KIN, undefined, undefined],
        [Page.ADD_CONTACT_APPROVED_TO_VISIT_PAGE, undefined, undefined],
        [Page.ENTER_RELATIONSHIP_COMMENTS, undefined, undefined],
        [Page.ADD_CONTACT_CANCEL_PAGE, undefined, undefined],
        [Page.ADD_CONTACT_ADD_PHONE_PAGE, undefined, undefined],
        [Page.ADD_CONTACT_DELETE_PHONE_PAGE, `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`, undefined],
        [Page.ADD_CONTACT_ENTER_GENDER_PAGE, undefined, undefined],
        [Page.ADD_CONTACT_IS_STAFF_PAGE, undefined, undefined],
        [Page.ADD_CONTACT_LANGUAGE_INTERPRETER_PAGE, undefined, undefined],
        [Page.ADD_CONTACT_DOMESTIC_STATUS_PAGE, undefined, undefined],
        [Page.ADD_ADDRESSES, undefined, 'Back'],
        [Page.ADD_EMPLOYMENTS, undefined, 'Back'],
      ])(
        'Should go back to check answers from %s',
        (page: Page, cancelButton?: string | undefined, backLinkLabel?: string | undefined) => {
          const journey: AddContactJourney = {
            id: journeyId,
            lastTouched: new Date().toISOString(),
            prisonerNumber: 'A1234BC',
            mode: 'NEW',
            isCheckingAnswers: true,
            dateOfBirth: {
              isKnown: 'NO',
            },
          }
          const expected: Navigation = {
            backLink: `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`,
            backLinkLabel,
            breadcrumbs: undefined,
            cancelButton,
          }

          const nav = navigationForAddContactJourney(page, journey, adminUser)

          expect(nav).toStrictEqual(expected)
        },
      )
    })

    describe('getNextPageForAddContactJourney', () => {
      const journeyId = uuidv4()

      it.each([
        [Page.CREATE_CONTACT_START_PAGE, `/prisoner/A1234BC/contacts/search/${journeyId}`, adminUser],
        [Page.ADD_CONTACT_MODE_PAGE, `/prisoner/A1234BC/contacts/create/enter-name/${journeyId}`, adminUser],
        [
          Page.CREATE_CONTACT_NAME_PAGE,
          `/prisoner/A1234BC/contacts/create/select-relationship-type/${journeyId}`,
          adminUser,
        ],
        [
          Page.CREATE_CONTACT_DOB_PAGE,
          `/prisoner/A1234BC/contacts/create/possible-existing-records/${journeyId}`,
          adminUser,
        ],
        [
          Page.ADD_CONTACT_POSSIBLE_EXISTING_RECORDS_PAGE,
          `/prisoner/A1234BC/contacts/create/emergency-contact-or-next-of-kin/${journeyId}`,
          adminUser,
        ],
        [
          Page.SELECT_RELATIONSHIP_TYPE,
          `/prisoner/A1234BC/contacts/create/select-relationship-to-prisoner/${journeyId}`,
          adminUser,
        ],
        [Page.SELECT_CONTACT_RELATIONSHIP, `/prisoner/A1234BC/contacts/create/enter-dob/${journeyId}`, adminUser],
        [
          Page.SELECT_EMERGENCY_CONTACT_OR_NEXT_OF_KIN,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
          adminUser,
        ],
        [
          Page.SELECT_EMERGENCY_CONTACT_OR_NEXT_OF_KIN,
          `/prisoner/A1234BC/contacts/create/approved-to-visit/${journeyId}`,
          authorisingUser,
        ],
        [
          Page.ADD_CONTACT_APPROVED_TO_VISIT_PAGE,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
          adminUser,
        ],
        [
          Page.ENTER_RELATIONSHIP_COMMENTS,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
          adminUser,
        ],
        [Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE, `/prisoner/A1234BC/contact/NEW/123456/654321/success`, adminUser],
        [
          Page.ADD_CONTACT_ADD_PHONE_PAGE,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
          adminUser,
        ],
        [Page.ADD_CONTACT_DELETE_PHONE_PAGE, `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`, adminUser],
        [
          Page.ADD_CONTACT_ENTER_GENDER_PAGE,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
          adminUser,
        ],
        [
          Page.ADD_CONTACT_IS_STAFF_PAGE,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
          adminUser,
        ],
        [
          Page.ADD_CONTACT_LANGUAGE_INTERPRETER_PAGE,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
          adminUser,
        ],
        [
          Page.ADD_CONTACT_DOMESTIC_STATUS_PAGE,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
          adminUser,
        ],
      ])(
        'Should go to next page if not checking answers: from %s to %s',
        (page: Page, expectedNextUrl: string | undefined, user: HmppsUser) => {
          const journey: AddContactJourney = {
            id: journeyId,
            lastTouched: new Date().toISOString(),
            prisonerNumber: 'A1234BC',
            isCheckingAnswers: false,
            dateOfBirth: {
              isKnown: 'NO',
            },
            mode: 'NEW',
            contactId: 123456,
            prisonerContactId: 654321,
          }

          const nav = nextPageForAddContactJourney(page, journey, user)

          expect(nav).toStrictEqual(expectedNextUrl)
        },
      )

      it.each([
        ['S', 'O', `/prisoner/A1234BC/contacts/create/select-relationship-to-prisoner/${journeyId}`],
        ['O', 'S', `/prisoner/A1234BC/contacts/create/select-relationship-to-prisoner/${journeyId}`],
        ['S', 'S', `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`],
        ['O', 'O', `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`],
      ])(
        'Should go back to relationship to prisoner page if relationship type changed (from %s to %s should redirect to %s)',
        (before: string, after: string, expected: string) => {
          const journey: AddContactJourney = {
            id: journeyId,
            lastTouched: new Date().toISOString(),
            prisonerNumber: 'A1234BC',
            mode: 'NEW',
            relationship: {
              relationshipType: before,
              pendingNewRelationshipType: after,
              relationshipToPrisoner: 'MOT',
            },
            isCheckingAnswers: true,
            previousAnswers: {
              relationship: {
                relationshipType: before,
                relationshipToPrisoner: 'MOT',
              },
            },
          }

          const nav = nextPageForAddContactJourney(Page.SELECT_RELATIONSHIP_TYPE, journey, adminUser)

          expect(nav).toStrictEqual(expected)
        },
      )

      it.each([
        [undefined, false, `/prisoner/A1234BC/contacts/create/enter-dob/${journeyId}`],
        [[], false, `/prisoner/A1234BC/contacts/create/enter-dob/${journeyId}`],
        [
          [TestData.contactSearchResultItem()],
          false,
          `/prisoner/A1234BC/contacts/create/possible-existing-records/${journeyId}`,
        ],
        [undefined, true, `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`],
        [[], true, `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`],
        [[TestData.contactSearchResultItem()], true, `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`],
      ])(
        'should go back to possible existing records or dob depending on if there were matches or even a search done but CYA always returns to CYA',
        (
          possibleExistingRecords: undefined | ContactSearchResultItem[],
          isCheckingAnswers: boolean,
          expected: string,
        ) => {
          const journey: AddContactJourney = {
            id: journeyId,
            lastTouched: new Date().toISOString(),
            prisonerNumber: 'A1234BC',
            mode: 'NEW',
            isCheckingAnswers,
            possibleExistingRecords,
          }

          const nav = navigationForAddContactJourney(Page.SELECT_EMERGENCY_CONTACT_OR_NEXT_OF_KIN, journey, adminUser)

          expect(nav.backLink).toStrictEqual(expected)
        },
      )

      it.each([
        [undefined, false, `/prisoner/A1234BC/contacts/create/select-relationship-to-prisoner/${journeyId}`],
        [[], false, `/prisoner/A1234BC/contacts/create/select-relationship-to-prisoner/${journeyId}`],
        [
          [TestData.contactSearchResultItem()],
          false,
          `/prisoner/A1234BC/contacts/create/possible-existing-records/${journeyId}`,
        ],
        [undefined, true, `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`],
        [[], true, `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`],
        [[TestData.contactSearchResultItem()], true, `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`],
      ])(
        'should go back to possible existing records or select relationship depending on if there were matches or even a search done but CYA always returns to CYA',
        (
          possibleExistingRecords: undefined | ContactSearchResultItem[],
          isCheckingAnswers: boolean,
          expected: string,
        ) => {
          const journey: AddContactJourney = {
            id: journeyId,
            lastTouched: new Date().toISOString(),
            prisonerNumber: 'A1234BC',
            mode: 'NEW',
            isCheckingAnswers,
            possibleExistingRecords,
            relationship: {
              relationshipToPrisoner: 'CA',
            },
          }

          const nav = navigationForAddContactJourney(Page.SELECT_EMERGENCY_CONTACT_OR_NEXT_OF_KIN, journey, adminUser)

          expect(nav.backLink).toStrictEqual(expected)
        },
      )

      it.each([
        ['YES', `/prisoner/A1234BC/contacts/add/mode/EXISTING/${journeyId}`, 'EXISTING'],
        [
          'NO_GO_BACK_TO_POSSIBLE_EXISTING_RECORDS',
          `/prisoner/A1234BC/contacts/create/possible-existing-records/${journeyId}`,
          'NEW',
        ],
        [
          'NO_CONTINUE_ADDING_CONTACT',
          `/prisoner/A1234BC/contacts/create/emergency-contact-or-next-of-kin/${journeyId}`,
          'NEW',
        ],
      ])(
        'should redirect correctly based on option (%s) and toggle mode if necessary',
        (option: string, expectedUrl: string, expectedMode: string) => {
          const journey: AddContactJourney = {
            id: journeyId,
            lastTouched: new Date().toISOString(),
            prisonerNumber: 'A1234BC',
            mode: 'NEW',
            isCheckingAnswers: false,
            possibleExistingRecords: [],
            isPossibleExistingRecordMatched: option as
              | 'YES'
              | 'NO_GO_BACK_TO_POSSIBLE_EXISTING_RECORDS'
              | 'NO_CONTINUE_ADDING_CONTACT',
          }

          const page = nextPageForAddContactJourney(
            Page.ADD_CONTACT_POSSIBLE_EXISTING_RECORD_MATCH_PAGE,
            journey,
            adminUser,
          )

          expect(page).toStrictEqual(expectedUrl)
          expect(journey.mode).toStrictEqual(expectedMode)
        },
      )
    })
  })

  describe('add existing contact', () => {
    describe('getNavigationForAddContactJourney', () => {
      const journeyId = uuidv4()
      it.each([
        [
          Page.CONTACT_MATCH_PAGE,
          `/prisoner/A1234BC/contacts/search/${journeyId}`,
          undefined,
          'Back to contact search',
          adminUser,
        ],
        [
          Page.SELECT_RELATIONSHIP_TYPE,
          `/prisoner/A1234BC/contacts/add/match/12346789/${journeyId}`,
          undefined,
          undefined,
          adminUser,
        ],
        [
          Page.SELECT_CONTACT_RELATIONSHIP,
          `/prisoner/A1234BC/contacts/create/select-relationship-type/${journeyId}`,
          undefined,
          undefined,
          adminUser,
        ],
        [
          Page.SELECT_EMERGENCY_CONTACT_OR_NEXT_OF_KIN,
          `/prisoner/A1234BC/contacts/create/select-relationship-to-prisoner/${journeyId}`,
          undefined,
          undefined,
          adminUser,
        ],
        [
          Page.ADD_CONTACT_APPROVED_TO_VISIT_PAGE,
          `/prisoner/A1234BC/contacts/create/emergency-contact-or-next-of-kin/${journeyId}`,
          undefined,
          undefined,
          adminUser,
        ],
        [
          Page.ENTER_RELATIONSHIP_COMMENTS,
          `/prisoner/A1234BC/contacts/create/emergency-contact-or-next-of-kin/${journeyId}`,
          undefined,
          undefined,
          adminUser,
        ],
        [
          Page.ENTER_RELATIONSHIP_COMMENTS,
          `/prisoner/A1234BC/contacts/create/approved-to-visit/${journeyId}`,
          undefined,
          undefined,
          authorisingUser,
        ],
        [
          Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE,
          `/prisoner/A1234BC/contacts/create/enter-relationship-comments/${journeyId}`,
          `/prisoner/A1234BC/contacts/add/cancel/${journeyId}`,
          'Back to relationship comments',
          adminUser,
        ],
        [
          Page.ADD_CONTACT_CANCEL_PAGE,
          `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`,
          undefined,
          undefined,
          adminUser,
        ],
        [
          Page.ADD_CONTACT_HANDLE_DUPLICATE_PAGE,
          `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`,
          undefined,
          undefined,
          adminUser,
        ],
        [
          Page.ADD_CONTACT_REVIEW_EXISTING_RELATIONSHIPS_PAGE,
          `/prisoner/A1234BC/contacts/search/${journeyId}`,
          undefined,
          'Back to contact search',
          adminUser,
        ],
      ])(
        'Should go back to previous page: from %s to %s',
        (
          page: Page,
          expectedBackUrl: string | undefined,
          expectedCancelButton: string | undefined,
          expectedBackLinkLabel: string | undefined,
          user: HmppsUser,
        ) => {
          const journey: AddContactJourney = {
            id: journeyId,
            lastTouched: new Date().toISOString(),
            prisonerNumber: 'A1234BC',
            mode: 'EXISTING',
            matchingContactId: 12346789,
            isCheckingAnswers: false,
          }
          const expected: Navigation = {
            backLink: expectedBackUrl,
            backLinkLabel: expectedBackLinkLabel,
            breadcrumbs: undefined,
            cancelButton: expectedCancelButton,
          }

          const nav = navigationForAddContactJourney(page, journey, user)

          expect(nav).toStrictEqual(expected)
        },
      )
      it.each([
        [Page.SELECT_RELATIONSHIP_TYPE],
        [Page.SELECT_CONTACT_RELATIONSHIP],
        [Page.SELECT_EMERGENCY_CONTACT_OR_NEXT_OF_KIN],
        [Page.ADD_CONTACT_APPROVED_TO_VISIT_PAGE],
        [Page.ENTER_RELATIONSHIP_COMMENTS],
        [Page.ADD_CONTACT_CANCEL_PAGE],
        [Page.ADD_CONTACT_HANDLE_DUPLICATE_PAGE],
      ])('Should go back to check answers when checking answers from page %s', (page: Page) => {
        const journey: AddContactJourney = {
          id: journeyId,
          lastTouched: new Date().toISOString(),
          prisonerNumber: 'A1234BC',
          mode: 'EXISTING',
          isCheckingAnswers: true,
        }
        const expected: Navigation = {
          backLink: `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`,
          backLinkLabel: undefined,
          breadcrumbs: undefined,
          cancelButton: undefined,
        }

        const nav = navigationForAddContactJourney(page, journey, adminUser)

        expect(nav).toStrictEqual(expected)
      })
    })

    describe('getNextPageForAddContactJourney', () => {
      const journeyId = uuidv4()
      it.each([
        [Page.CREATE_CONTACT_START_PAGE, `/prisoner/A1234BC/contacts/search/${journeyId}`, adminUser],
        [Page.CONTACT_MATCH_PAGE, `/prisoner/A1234BC/contacts/add/mode/EXISTING/${journeyId}`, adminUser],
        [
          Page.ADD_CONTACT_MODE_PAGE,
          `/prisoner/A1234BC/contacts/create/select-relationship-type/${journeyId}`,
          adminUser,
        ],
        [
          Page.SELECT_RELATIONSHIP_TYPE,
          `/prisoner/A1234BC/contacts/create/select-relationship-to-prisoner/${journeyId}`,
          adminUser,
        ],
        [
          Page.SELECT_CONTACT_RELATIONSHIP,
          `/prisoner/A1234BC/contacts/create/emergency-contact-or-next-of-kin/${journeyId}`,
          adminUser,
        ],
        [
          Page.SELECT_EMERGENCY_CONTACT_OR_NEXT_OF_KIN,
          `/prisoner/A1234BC/contacts/create/approved-to-visit/${journeyId}`,
          authorisingUser,
        ],
        [
          Page.SELECT_EMERGENCY_CONTACT_OR_NEXT_OF_KIN,
          `/prisoner/A1234BC/contacts/create/enter-relationship-comments/${journeyId}`,
          adminUser,
        ],
        [
          Page.ADD_CONTACT_APPROVED_TO_VISIT_PAGE,
          `/prisoner/A1234BC/contacts/create/enter-relationship-comments/${journeyId}`,
          adminUser,
        ],
        [Page.ENTER_RELATIONSHIP_COMMENTS, `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`, adminUser],
        [Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE, `/prisoner/A1234BC/contact/EXISTING/123456/654321/success`, adminUser],
      ])(
        'Should go to next page if not checking answers: from %s to %s',
        (page: Page, expectedNextUrl: string, user: HmppsUser) => {
          const journey: AddContactJourney = {
            id: journeyId,
            lastTouched: new Date().toISOString(),
            prisonerNumber: 'A1234BC',
            mode: 'EXISTING',
            isCheckingAnswers: false,
            contactId: 123456,
            prisonerContactId: 654321,
          }

          const nav = nextPageForAddContactJourney(page, journey, user)

          expect(nav).toStrictEqual(expectedNextUrl)
        },
      )

      it.each([
        ['S', 'O', `/prisoner/A1234BC/contacts/create/select-relationship-to-prisoner/${journeyId}`],
        ['O', 'S', `/prisoner/A1234BC/contacts/create/select-relationship-to-prisoner/${journeyId}`],
        ['S', 'S', `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`],
        ['O', 'O', `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`],
      ])(
        'Should go back to relationship to prisoner page if relationship type changed (from %s to %s should redirect to %s)',
        (before: string, after: string, expected: string) => {
          const journey: AddContactJourney = {
            id: journeyId,
            lastTouched: new Date().toISOString(),
            prisonerNumber: 'A1234BC',
            mode: 'EXISTING',
            relationship: {
              relationshipType: before,
              pendingNewRelationshipType: after,
              relationshipToPrisoner: 'MOT',
            },
            isCheckingAnswers: true,
            previousAnswers: {
              relationship: {
                relationshipType: before,
                relationshipToPrisoner: 'MOT',
              },
            },
          }

          const nav = nextPageForAddContactJourney(Page.SELECT_RELATIONSHIP_TYPE, journey, adminUser)

          expect(nav).toStrictEqual(expected)
        },
      )
    })
  })

  describe('should work correctly before mode set', () => {
    const journeyId = uuidv4()
    it.each([
      [Page.CREATE_CONTACT_START_PAGE, undefined, undefined, undefined],
      [Page.CONTACT_SEARCH_PAGE, undefined, '/prisoner/A1234BC/contacts/list', 'Back to prisoner’s contact list'],
      [Page.CONTACT_MATCH_PAGE, undefined, `/prisoner/A1234BC/contacts/search/${journeyId}`, 'Back to contact search'],
      [
        Page.ADD_CONTACT_REVIEW_EXISTING_RELATIONSHIPS_PAGE,
        undefined,
        `/prisoner/A1234BC/contacts/search/${journeyId}`,
        'Back to contact search',
      ],
    ])('Should have no back for initial pages', (page: Page, breadcrumbs, backLink, backLinkLabel) => {
      const journey: AddContactJourney = {
        id: journeyId,
        lastTouched: new Date().toISOString(),
        prisonerNumber: 'A1234BC',
        isCheckingAnswers: false,
      }
      const expected: Navigation = {
        backLink,
        backLinkLabel,
        breadcrumbs: breadcrumbs as BreadcrumbType[] | undefined,
        cancelButton: undefined,
      }

      const nav = navigationForAddContactJourney(page, journey, adminUser)

      expect(nav).toStrictEqual(expected)
    })

    it.each([
      [Page.CREATE_CONTACT_START_PAGE, `/prisoner/A1234BC/contacts/search/${journeyId}`, undefined],
      [Page.CONTACT_SEARCH_PAGE, `/prisoner/A1234BC/contacts/search/${journeyId}`, undefined],
      [Page.CONTACT_MATCH_PAGE, `/prisoner/A1234BC/contacts/add/mode/NEW/${journeyId}`, 'NEW'],
      [Page.CONTACT_MATCH_PAGE, `/prisoner/A1234BC/contacts/add/mode/EXISTING/${journeyId}`, 'EXISTING'],
    ])('Should go to next page if mode not set: from %s to %s', (page: Page, expectedNextUrl: string, mode) => {
      const journey: AddContactJourney = {
        id: journeyId,
        lastTouched: new Date().toISOString(),
        prisonerNumber: 'A1234BC',
        isCheckingAnswers: false,
      }
      if (mode) journey.mode = mode as 'NEW' | 'EXISTING'

      const nav = nextPageForAddContactJourney(page, journey, adminUser)

      expect(nav).toStrictEqual(expectedNextUrl)
    })
  })
})
