import { v4 as uuidv4 } from 'uuid'
import { navigationForAddContactJourney, nextPageForAddContactJourney } from './addContactFlowControl'
import { Page } from '../../../services/auditService'
import { BreadcrumbType, Navigation } from '../common/navigation'
import AddContactJourney = journeys.AddContactJourney

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
        ],
        [
          Page.CREATE_CONTACT_DOB_PAGE,
          `/prisoner/A1234BC/contacts/create/enter-name/${journeyId}`,
          undefined,
          undefined,
        ],
        [
          Page.SELECT_RELATIONSHIP_TYPE,
          `/prisoner/A1234BC/contacts/create/enter-dob/${journeyId}`,
          undefined,
          undefined,
        ],
        [
          Page.SELECT_CONTACT_RELATIONSHIP,
          `/prisoner/A1234BC/contacts/create/select-relationship-type/${journeyId}`,
          undefined,
          undefined,
        ],
        [
          Page.SELECT_EMERGENCY_CONTACT_OR_NEXT_OF_KIN,
          `/prisoner/A1234BC/contacts/create/select-relationship-to-prisoner/${journeyId}`,
          undefined,
          undefined,
        ],
        [
          Page.ADD_CONTACT_APPROVED_TO_VISIT_PAGE,
          `/prisoner/A1234BC/contacts/create/emergency-contact-or-next-of-kin/${journeyId}`,
          undefined,
          undefined,
        ],
        [
          Page.ENTER_ADDITIONAL_INFORMATION_PAGE,
          `/prisoner/A1234BC/contacts/create/approved-to-visit/${journeyId}`,
          undefined,
          `Back to visits approval`,
        ],
        [
          Page.ENTER_RELATIONSHIP_COMMENTS,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
          undefined,
          undefined,
        ],
        [
          Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
          `/prisoner/A1234BC/contacts/add/cancel/${journeyId}`,
          'Back to additional information options',
        ],
        [
          Page.ADD_CONTACT_CANCEL_PAGE,
          `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`,
          undefined,
          undefined,
        ],
        [
          Page.ADD_CONTACT_ADD_PHONE_PAGE,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
          undefined,
          undefined,
        ],
        [
          Page.ADD_CONTACT_DELETE_PHONE_PAGE,
          `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`,
          `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`,
          undefined,
        ],
        [
          Page.ADD_CONTACT_ENTER_GENDER_PAGE,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
          undefined,
          undefined,
        ],
        [
          Page.ADD_CONTACT_IS_STAFF_PAGE,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
          undefined,
          undefined,
        ],
        [
          Page.ADD_CONTACT_LANGUAGE_INTERPRETER_PAGE,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
          undefined,
          undefined,
        ],
        [
          Page.ADD_CONTACT_DOMESTIC_STATUS_PAGE,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
          undefined,
          undefined,
        ],
        [
          Page.ADD_EMPLOYMENTS,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
          undefined,
          'Back to additional information options',
        ],
        [
          Page.ADD_ADDRESSES,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
          undefined,
          'Back to additional information options',
        ],
      ])(
        'Should go back to previous page: from %s to %s',
        (page: Page, expectedBackUrl?: string, expectedCancelButton?: string, expectedBackLabel?: string) => {
          const journey: AddContactJourney = {
            id: journeyId,
            lastTouched: new Date().toISOString(),
            prisonerNumber: 'A1234BC',
            returnPoint: {
              url: '/foo',
            },
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

          const nav = navigationForAddContactJourney(page, journey)

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
            returnPoint: {
              url: '/foo',
            },
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

          const nav = navigationForAddContactJourney(page, journey)

          expect(nav).toStrictEqual(expected)
        },
      )
    })

    describe('getNextPageForAddContactJourney', () => {
      const journeyId = uuidv4()

      it.each([
        [Page.CREATE_CONTACT_START_PAGE, `/prisoner/A1234BC/contacts/search/${journeyId}`],
        [Page.ADD_CONTACT_MODE_PAGE, `/prisoner/A1234BC/contacts/create/enter-name/${journeyId}`],
        [Page.CREATE_CONTACT_NAME_PAGE, `/prisoner/A1234BC/contacts/create/enter-dob/${journeyId}`],
        [Page.CREATE_CONTACT_DOB_PAGE, `/prisoner/A1234BC/contacts/create/select-relationship-type/${journeyId}`],
        [
          Page.SELECT_RELATIONSHIP_TYPE,
          `/prisoner/A1234BC/contacts/create/select-relationship-to-prisoner/${journeyId}`,
        ],
        [
          Page.SELECT_CONTACT_RELATIONSHIP,
          `/prisoner/A1234BC/contacts/create/emergency-contact-or-next-of-kin/${journeyId}`,
        ],
        [
          Page.SELECT_EMERGENCY_CONTACT_OR_NEXT_OF_KIN,
          `/prisoner/A1234BC/contacts/create/approved-to-visit/${journeyId}`,
        ],
        [Page.ADD_CONTACT_APPROVED_TO_VISIT_PAGE, `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`],
        [Page.ENTER_RELATIONSHIP_COMMENTS, `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`],
        [Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE, `/prisoner/A1234BC/contact/NEW/123456/654321/success`],
        [Page.ADD_CONTACT_ADD_PHONE_PAGE, `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`],
        [Page.ADD_CONTACT_DELETE_PHONE_PAGE, `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`],
        [Page.ADD_CONTACT_ENTER_GENDER_PAGE, `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`],
        [Page.ADD_CONTACT_IS_STAFF_PAGE, `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`],
        [
          Page.ADD_CONTACT_LANGUAGE_INTERPRETER_PAGE,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
        ],
        [Page.ADD_CONTACT_DOMESTIC_STATUS_PAGE, `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`],
      ])('Should go to next page if not checking answers: from %s to %s', (page: Page, expectedNextUrl?: string) => {
        const journey: AddContactJourney = {
          id: journeyId,
          lastTouched: new Date().toISOString(),
          prisonerNumber: 'A1234BC',
          returnPoint: {
            url: '/foo',
          },
          isCheckingAnswers: false,
          dateOfBirth: {
            isKnown: 'NO',
          },
          mode: 'NEW',
          contactId: 123456,
          prisonerContactId: 654321,
        }

        const nav = nextPageForAddContactJourney(page, journey)

        expect(nav).toStrictEqual(expectedNextUrl)
      })

      it.each([
        [Page.CREATE_CONTACT_NAME_PAGE],
        [Page.SELECT_RELATIONSHIP_TYPE],
        [Page.SELECT_CONTACT_RELATIONSHIP],
        [Page.SELECT_EMERGENCY_CONTACT_OR_NEXT_OF_KIN],
        [Page.ADD_CONTACT_APPROVED_TO_VISIT_PAGE],
        [Page.CREATE_CONTACT_DOB_PAGE],
        [Page.ENTER_RELATIONSHIP_COMMENTS],
        [Page.ADD_CONTACT_ADD_PHONE_PAGE],
        [Page.ADD_CONTACT_DELETE_PHONE_PAGE],
        [Page.ADD_CONTACT_ENTER_GENDER_PAGE],
        [Page.ADD_CONTACT_IS_STAFF_PAGE],
        [Page.ADD_CONTACT_LANGUAGE_INTERPRETER_PAGE],
        [Page.ADD_CONTACT_DOMESTIC_STATUS_PAGE],
      ])('Should go back to checking answer page: from %s', (page: Page) => {
        const journey: AddContactJourney = {
          id: journeyId,
          lastTouched: new Date().toISOString(),
          prisonerNumber: 'A1234BC',
          returnPoint: {
            url: '/foo',
          },
          dateOfBirth: {
            isKnown: 'YES',
          },
          relationship: {
            pendingNewRelationshipType: 'S',
            relationshipType: 'S',
            relationshipToPrisoner: 'MOT',
          },
          isCheckingAnswers: true,
          previousAnswers: {
            relationship: {
              relationshipType: 'S',
              relationshipToPrisoner: 'MOT',
            },
          },
          mode: 'NEW',
        }
        const expected = `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`

        const nav = nextPageForAddContactJourney(page, journey)

        expect(nav).toStrictEqual(expected)
      })
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
            returnPoint: {
              url: '/foo',
            },
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

          const nav = nextPageForAddContactJourney(Page.SELECT_RELATIONSHIP_TYPE, journey)

          expect(nav).toStrictEqual(expected)
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
        ],
        [
          Page.SELECT_RELATIONSHIP_TYPE,
          `/prisoner/A1234BC/contacts/add/match/12346789/${journeyId}`,
          undefined,
          undefined,
        ],
        [
          Page.SELECT_CONTACT_RELATIONSHIP,
          `/prisoner/A1234BC/contacts/create/select-relationship-type/${journeyId}`,
          undefined,
          undefined,
        ],
        [
          Page.SELECT_EMERGENCY_CONTACT_OR_NEXT_OF_KIN,
          `/prisoner/A1234BC/contacts/create/select-relationship-to-prisoner/${journeyId}`,
          undefined,
          undefined,
        ],
        [
          Page.ADD_CONTACT_APPROVED_TO_VISIT_PAGE,
          `/prisoner/A1234BC/contacts/create/emergency-contact-or-next-of-kin/${journeyId}`,
          undefined,
          undefined,
        ],
        [
          Page.ENTER_RELATIONSHIP_COMMENTS,
          `/prisoner/A1234BC/contacts/create/approved-to-visit/${journeyId}`,
          undefined,
          undefined,
        ],
        [
          Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE,
          `/prisoner/A1234BC/contacts/create/enter-relationship-comments/${journeyId}`,
          `/prisoner/A1234BC/contacts/add/cancel/${journeyId}`,
          undefined,
        ],
        [
          Page.ADD_CONTACT_CANCEL_PAGE,
          `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`,
          undefined,
          undefined,
        ],
      ])(
        'Should go back to previous page: from %s to %s',
        (page: Page, expectedBackUrl?: string, expectedCancelButton?: string, expectedBackLinkLabel?: string) => {
          const journey: AddContactJourney = {
            id: journeyId,
            lastTouched: new Date().toISOString(),
            prisonerNumber: 'A1234BC',
            returnPoint: {
              url: '/foo',
            },
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

          const nav = navigationForAddContactJourney(page, journey)

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
      ])('Should go back to check answers when checking answers from page %s', (page: Page) => {
        const journey: AddContactJourney = {
          id: journeyId,
          lastTouched: new Date().toISOString(),
          prisonerNumber: 'A1234BC',
          returnPoint: {
            url: '/foo',
          },
          mode: 'EXISTING',
          isCheckingAnswers: true,
        }
        const expected: Navigation = {
          backLink: `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`,
          backLinkLabel: undefined,
          breadcrumbs: undefined,
          cancelButton: undefined,
        }

        const nav = navigationForAddContactJourney(page, journey)

        expect(nav).toStrictEqual(expected)
      })
    })

    describe('getNextPageForAddContactJourney', () => {
      const journeyId = uuidv4()
      it.each([
        [Page.CREATE_CONTACT_START_PAGE, `/prisoner/A1234BC/contacts/search/${journeyId}`],
        [Page.CONTACT_MATCH_PAGE, `/prisoner/A1234BC/contacts/add/mode/EXISTING/${journeyId}`],
        [Page.ADD_CONTACT_MODE_PAGE, `/prisoner/A1234BC/contacts/create/select-relationship-type/${journeyId}`],
        [
          Page.SELECT_RELATIONSHIP_TYPE,
          `/prisoner/A1234BC/contacts/create/select-relationship-to-prisoner/${journeyId}`,
        ],
        [
          Page.SELECT_CONTACT_RELATIONSHIP,
          `/prisoner/A1234BC/contacts/create/emergency-contact-or-next-of-kin/${journeyId}`,
        ],
        [
          Page.SELECT_EMERGENCY_CONTACT_OR_NEXT_OF_KIN,
          `/prisoner/A1234BC/contacts/create/approved-to-visit/${journeyId}`,
        ],
        [
          Page.ADD_CONTACT_APPROVED_TO_VISIT_PAGE,
          `/prisoner/A1234BC/contacts/create/enter-relationship-comments/${journeyId}`,
        ],
        [Page.ENTER_RELATIONSHIP_COMMENTS, `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`],
        [Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE, `/prisoner/A1234BC/contact/EXISTING/123456/654321/success`],
      ])('Should go to next page if not checking answers: from %s to %s', (page: Page, expectedNextUrl?: string) => {
        const journey: AddContactJourney = {
          id: journeyId,
          lastTouched: new Date().toISOString(),
          prisonerNumber: 'A1234BC',
          returnPoint: {
            url: '/foo',
          },
          mode: 'EXISTING',
          isCheckingAnswers: false,
          contactId: 123456,
          prisonerContactId: 654321,
        }

        const nav = nextPageForAddContactJourney(page, journey)

        expect(nav).toStrictEqual(expectedNextUrl)
      })

      it.each([
        [Page.SELECT_RELATIONSHIP_TYPE],
        [Page.SELECT_CONTACT_RELATIONSHIP],
        [Page.SELECT_EMERGENCY_CONTACT_OR_NEXT_OF_KIN],
        [Page.ADD_CONTACT_APPROVED_TO_VISIT_PAGE],
        [Page.ENTER_RELATIONSHIP_COMMENTS],
      ])('Should go back to checking answer page: from %s', (page: Page) => {
        const journey: AddContactJourney = {
          id: journeyId,
          lastTouched: new Date().toISOString(),
          prisonerNumber: 'A1234BC',
          returnPoint: {
            url: '/foo',
          },
          mode: 'EXISTING',
          relationship: {
            relationshipType: 'S',
            pendingNewRelationshipType: 'S',
            relationshipToPrisoner: 'MOT',
          },
          isCheckingAnswers: true,
          previousAnswers: {
            relationship: {
              relationshipType: 'S',
              relationshipToPrisoner: 'MOT',
            },
          },
        }
        const expected = `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`

        const nav = nextPageForAddContactJourney(page, journey)

        expect(nav).toStrictEqual(expected)
      })

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
            returnPoint: {
              url: '/foo',
            },
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

          const nav = nextPageForAddContactJourney(Page.SELECT_RELATIONSHIP_TYPE, journey)

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
    ])('Should have no back for initial pages', (page: Page, breadcrumbs, backLink, backLinkLabel) => {
      const journey: AddContactJourney = {
        id: journeyId,
        lastTouched: new Date().toISOString(),
        prisonerNumber: 'A1234BC',
        returnPoint: {
          url: '/foo',
        },
        isCheckingAnswers: false,
      }
      const expected: Navigation = {
        backLink,
        backLinkLabel,
        breadcrumbs: breadcrumbs as BreadcrumbType[] | undefined,
        cancelButton: undefined,
      }

      const nav = navigationForAddContactJourney(page, journey)

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
        returnPoint: {
          url: '/foo',
        },
        isCheckingAnswers: false,
      }
      if (mode) journey.mode = mode as 'NEW' | 'EXISTING'

      const nav = nextPageForAddContactJourney(page, journey)

      expect(nav).toStrictEqual(expectedNextUrl)
    })
  })
})
