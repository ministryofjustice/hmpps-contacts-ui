import { v4 as uuidv4 } from 'uuid'
import {
  AddContactNavigation,
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
        [Page.CREATE_CONTACT_NAME_PAGE, undefined, undefined],
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
            isCheckingAnswers: false,
            dateOfBirth,
          }
          const expected: AddContactNavigation = {
            backLink: expectedBackUrl,
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
        [Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE],
      ])('Should go back to checking answer page: from %s', (page: Page) => {
        const journey: AddContactJourney = {
          id: journeyId,
          lastTouched: new Date().toISOString(),
          prisonerNumber: 'A1234BC',
          returnPoint: {
            type: 'PRISONER_CONTACTS',
            url: '/foo',
          },
          isCheckingAnswers: true,
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
        }
        const expected = `/prisoner/A1234BC/contacts/create/enter-estimated-dob/${journeyId}`

        const nav = nextPageForAddContactJourney(Page.CREATE_CONTACT_DOB_PAGE, journey)

        expect(nav).toStrictEqual(expected)
      })

      it('Should go to enter-name if selecting mode NEW', () => {
        const journey: AddContactJourney = {
          id: journeyId,
          lastTouched: new Date().toISOString(),
          prisonerNumber: 'A1234BC',
          returnPoint: {
            type: 'PRISONER_CONTACTS',
            url: '/foo',
          },
          isCheckingAnswers: false,
          mode: 'NEW',
        }
        const expected = `/prisoner/A1234BC/contacts/create/enter-name/${journeyId}`

        const nav = nextPageForAddContactJourney(Page.ADD_CONTACT_MODE_PAGE, journey)

        expect(nav).toStrictEqual(expected)
      })
    })
  })
})
