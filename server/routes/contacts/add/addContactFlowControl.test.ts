import { v4 as uuidv4 } from 'uuid'
import {
  AddContactNavigation,
  BreadcrumbType,
  navigationForAddContactJourney,
  nextPageForAddContactJourney,
} from './addContactFlowControl'
import { Page } from '../../../services/auditService'
import AddContactJourney = journeys.AddContactJourney
import DateOfBirth = journeys.DateOfBirth

describe('addContactFlowControl', () => {
  describe('add new contact', () => {
    describe('getNavigationForAddContactJourney', () => {
      const journeyId = uuidv4()
      const knownDob: DateOfBirth = {
        isKnown: 'YES',
      }
      const unknownDob: DateOfBirth = {
        isKnown: 'NO',
      }

      it.each([
        [Page.CREATE_CONTACT_NAME_PAGE, undefined, `/prisoner/A1234BC/contacts/search/${journeyId}`],
        [Page.SELECT_CONTACT_RELATIONSHIP, undefined, `/prisoner/A1234BC/contacts/create/enter-name/${journeyId}`],
        [
          Page.SELECT_EMERGENCY_CONTACT,
          undefined,
          `/prisoner/A1234BC/contacts/create/select-relationship/${journeyId}`,
        ],
        [Page.SELECT_NEXT_OF_KIN, undefined, `/prisoner/A1234BC/contacts/create/select-emergency-contact/${journeyId}`],
        [Page.CREATE_CONTACT_DOB_PAGE, undefined, `/prisoner/A1234BC/contacts/create/select-next-of-kin/${journeyId}`],
        [Page.CREATE_CONTACT_ESTIMATED_DOB_PAGE, knownDob, `/prisoner/A1234BC/contacts/create/enter-dob/${journeyId}`],
        [
          Page.CREATE_CONTACT_ESTIMATED_DOB_PAGE,
          unknownDob,
          `/prisoner/A1234BC/contacts/create/enter-dob/${journeyId}`,
        ],
        [Page.ENTER_RELATIONSHIP_COMMENTS, knownDob, `/prisoner/A1234BC/contacts/create/enter-dob/${journeyId}`],
        [
          Page.ENTER_RELATIONSHIP_COMMENTS,
          unknownDob,
          `/prisoner/A1234BC/contacts/create/enter-estimated-dob/${journeyId}`,
        ],
        [
          Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE,
          knownDob,
          `/prisoner/A1234BC/contacts/create/enter-relationship-comments/${journeyId}`,
        ],
        [
          Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE,
          unknownDob,
          `/prisoner/A1234BC/contacts/create/enter-relationship-comments/${journeyId}`,
        ],
      ])(
        'Should go back to previous page: from %s with dob %s to %s',
        (page: Page, dateOfBirth?: DateOfBirth, expectedBackUrl?: string) => {
          const journey: AddContactJourney = {
            id: journeyId,
            lastTouched: new Date().toISOString(),
            prisonerNumber: 'A1234BC',
            returnPoint: {
              type: 'PRISONER_CONTACTS',
              url: '/foo',
            },
            mode: 'NEW',
            isCheckingAnswers: false,
            dateOfBirth,
          }
          const expected: AddContactNavigation = {
            backLink: expectedBackUrl,
            breadcrumbs: undefined,
          }

          const nav = navigationForAddContactJourney(page, journey)

          expect(nav).toStrictEqual(expected)
        },
      )
    })

    describe('getNextPageForAddContactJourney', () => {
      const journeyId = uuidv4()
      const knownDob: DateOfBirth = {
        isKnown: 'YES',
      }
      const unknownDob: DateOfBirth = {
        isKnown: 'NO',
      }

      it.each([
        [Page.CREATE_CONTACT_START_PAGE, undefined, `/prisoner/A1234BC/contacts/search/${journeyId}`],
        [Page.ADD_CONTACT_MODE_PAGE, undefined, `/prisoner/A1234BC/contacts/create/enter-name/${journeyId}`],
        [
          Page.CREATE_CONTACT_NAME_PAGE,
          undefined,
          `/prisoner/A1234BC/contacts/create/select-relationship/${journeyId}`,
        ],
        [
          Page.SELECT_CONTACT_RELATIONSHIP,
          undefined,
          `/prisoner/A1234BC/contacts/create/select-emergency-contact/${journeyId}`,
        ],
        [Page.SELECT_EMERGENCY_CONTACT, undefined, `/prisoner/A1234BC/contacts/create/select-next-of-kin/${journeyId}`],
        [Page.SELECT_NEXT_OF_KIN, undefined, `/prisoner/A1234BC/contacts/create/enter-dob/${journeyId}`],
        [
          Page.CREATE_CONTACT_DOB_PAGE,
          knownDob,
          `/prisoner/A1234BC/contacts/create/enter-relationship-comments/${journeyId}`,
        ],
        [
          Page.CREATE_CONTACT_DOB_PAGE,
          unknownDob,
          `/prisoner/A1234BC/contacts/create/enter-estimated-dob/${journeyId}`,
        ],
        [
          Page.CREATE_CONTACT_ESTIMATED_DOB_PAGE,
          unknownDob,
          `/prisoner/A1234BC/contacts/create/enter-relationship-comments/${journeyId}`,
        ],
        [Page.ENTER_RELATIONSHIP_COMMENTS, knownDob, `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`],
        [Page.ENTER_RELATIONSHIP_COMMENTS, unknownDob, `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`],
      ])(
        'Should go to next page if not checking answers: from %s with dob %s to %s',
        (page: Page, dateOfBirth?: DateOfBirth, expectedNextUrl?: string) => {
          const journey: AddContactJourney = {
            id: journeyId,
            lastTouched: new Date().toISOString(),
            prisonerNumber: 'A1234BC',
            returnPoint: {
              type: 'PRISONER_CONTACTS',
              url: '/foo',
            },
            isCheckingAnswers: false,
            dateOfBirth,
            mode: 'NEW',
          }

          const nav = nextPageForAddContactJourney(page, journey)

          expect(nav).toStrictEqual(expectedNextUrl)
        },
      )

      it.each([
        [Page.CREATE_CONTACT_NAME_PAGE],
        [Page.SELECT_CONTACT_RELATIONSHIP],
        [Page.SELECT_EMERGENCY_CONTACT],
        [Page.SELECT_NEXT_OF_KIN],
        [Page.CREATE_CONTACT_DOB_PAGE],
        [Page.CREATE_CONTACT_ESTIMATED_DOB_PAGE],
        [Page.ENTER_RELATIONSHIP_COMMENTS],
      ])('Should go back to checking answer page: from %s', (page: Page) => {
        const journey: AddContactJourney = {
          id: journeyId,
          lastTouched: new Date().toISOString(),
          prisonerNumber: 'A1234BC',
          returnPoint: {
            type: 'PRISONER_CONTACTS',
            url: '/foo',
          },
          dateOfBirth: {
            isKnown: 'YES',
          },
          isCheckingAnswers: true,
          mode: 'NEW',
        }
        const expected = `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`

        const nav = nextPageForAddContactJourney(page, journey)

        expect(nav).toStrictEqual(expected)
      })

      it('Should go to estimated DOB if checking answers but selected NO for DOB', () => {
        const journey: AddContactJourney = {
          id: journeyId,
          lastTouched: new Date().toISOString(),
          prisonerNumber: 'A1234BC',
          returnPoint: {
            type: 'PRISONER_CONTACTS',
            url: '/foo',
          },
          isCheckingAnswers: true,
          dateOfBirth: {
            isKnown: 'NO',
          },
          mode: 'NEW',
        }
        const expected = `/prisoner/A1234BC/contacts/create/enter-estimated-dob/${journeyId}`

        const nav = nextPageForAddContactJourney(Page.CREATE_CONTACT_DOB_PAGE, journey)

        expect(nav).toStrictEqual(expected)
      })
    })
  })

  describe('add existing contact', () => {
    describe('getNavigationForAddContactJourney', () => {
      const journeyId = uuidv4()
      it.each([
        [Page.CONTACT_CONFIRMATION_PAGE, `/prisoner/A1234BC/contacts/search/${journeyId}`],
        [Page.SELECT_CONTACT_RELATIONSHIP, `/prisoner/A1234BC/contacts/search/${journeyId}`],
        [Page.SELECT_EMERGENCY_CONTACT, `/prisoner/A1234BC/contacts/create/select-relationship/${journeyId}`],
        [Page.SELECT_NEXT_OF_KIN, `/prisoner/A1234BC/contacts/create/select-emergency-contact/${journeyId}`],
        [Page.ENTER_RELATIONSHIP_COMMENTS, `/prisoner/A1234BC/contacts/create/select-next-of-kin/${journeyId}`],
        [
          Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE,
          `/prisoner/A1234BC/contacts/create/enter-relationship-comments/${journeyId}`,
        ],
      ])('Should go back to previous page: from %s to %s', (page: Page, expectedBackUrl?: string) => {
        const journey: AddContactJourney = {
          id: journeyId,
          lastTouched: new Date().toISOString(),
          prisonerNumber: 'A1234BC',
          returnPoint: {
            type: 'PRISONER_CONTACTS',
            url: '/foo',
          },
          mode: 'EXISTING',
          isCheckingAnswers: false,
        }
        const expected: AddContactNavigation = {
          backLink: expectedBackUrl,
          breadcrumbs: undefined,
        }

        const nav = navigationForAddContactJourney(page, journey)

        expect(nav).toStrictEqual(expected)
      })
    })

    describe('getNextPageForAddContactJourney', () => {
      const journeyId = uuidv4()
      it.each([
        [Page.CREATE_CONTACT_START_PAGE, `/prisoner/A1234BC/contacts/search/${journeyId}`],
        [Page.ADD_CONTACT_MODE_PAGE, `/prisoner/A1234BC/contacts/create/select-relationship/${journeyId}`],
        [Page.SELECT_CONTACT_RELATIONSHIP, `/prisoner/A1234BC/contacts/create/select-emergency-contact/${journeyId}`],
        [Page.SELECT_EMERGENCY_CONTACT, `/prisoner/A1234BC/contacts/create/select-next-of-kin/${journeyId}`],
        [Page.SELECT_NEXT_OF_KIN, `/prisoner/A1234BC/contacts/create/enter-relationship-comments/${journeyId}`],
        [Page.ENTER_RELATIONSHIP_COMMENTS, `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`],
      ])('Should go to next page if not checking answers: from %s to %s', (page: Page, expectedNextUrl?: string) => {
        const journey: AddContactJourney = {
          id: journeyId,
          lastTouched: new Date().toISOString(),
          prisonerNumber: 'A1234BC',
          returnPoint: {
            type: 'PRISONER_CONTACTS',
            url: '/foo',
          },
          mode: 'EXISTING',
          isCheckingAnswers: false,
        }

        const nav = nextPageForAddContactJourney(page, journey)

        expect(nav).toStrictEqual(expectedNextUrl)
      })

      it.each([
        [Page.SELECT_CONTACT_RELATIONSHIP],
        [Page.SELECT_EMERGENCY_CONTACT],
        [Page.SELECT_NEXT_OF_KIN],
        [Page.ENTER_RELATIONSHIP_COMMENTS],
      ])('Should go back to checking answer page: from %s', (page: Page) => {
        const journey: AddContactJourney = {
          id: journeyId,
          lastTouched: new Date().toISOString(),
          prisonerNumber: 'A1234BC',
          returnPoint: {
            type: 'PRISONER_CONTACTS',
            url: '/foo',
          },
          mode: 'EXISTING',
          isCheckingAnswers: true,
        }
        const expected = `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`

        const nav = nextPageForAddContactJourney(page, journey)

        expect(nav).toStrictEqual(expected)
      })
    })
  })
  describe('should work correctly before mode set', () => {
    const journeyId = uuidv4()
    it.each([
      [Page.CREATE_CONTACT_START_PAGE, undefined],
      [Page.CONTACT_SEARCH_PAGE, ['DPS_HOME', 'DPS_PROFILE', 'PRISONER_CONTACTS']],
    ])('Should have no back for initial pages', (page: Page, breadcrumbs?: BreadcrumbType[]) => {
      const journey: AddContactJourney = {
        id: journeyId,
        lastTouched: new Date().toISOString(),
        prisonerNumber: 'A1234BC',
        returnPoint: {
          type: 'PRISONER_CONTACTS',
          url: '/foo',
        },
        mode: undefined,
        isCheckingAnswers: false,
      }
      const expected: AddContactNavigation = {
        backLink: undefined,
        breadcrumbs,
      }

      const nav = navigationForAddContactJourney(page, journey)

      expect(nav).toStrictEqual(expected)
    })

    it.each([
      [Page.CREATE_CONTACT_START_PAGE, `/prisoner/A1234BC/contacts/search/${journeyId}`],
      [Page.CONTACT_SEARCH_PAGE, `/prisoner/A1234BC/contacts/search/${journeyId}`],
    ])('Should go to next page if mode not set: from %s to %s', (page: Page, expectedNextUrl?: string) => {
      const journey: AddContactJourney = {
        id: journeyId,
        lastTouched: new Date().toISOString(),
        prisonerNumber: 'A1234BC',
        returnPoint: {
          type: 'PRISONER_CONTACTS',
          url: '/foo',
        },
        mode: undefined,
        isCheckingAnswers: false,
      }

      const nav = nextPageForAddContactJourney(page, journey)

      expect(nav).toStrictEqual(expectedNextUrl)
    })
  })
})
