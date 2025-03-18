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
        [Page.CREATE_CONTACT_NAME_PAGE, `/prisoner/A1234BC/contacts/search/${journeyId}`, undefined, 'Back'],
        [Page.CREATE_CONTACT_DOB_PAGE, `/prisoner/A1234BC/contacts/create/enter-name/${journeyId}`, undefined, 'Back'],
        [Page.SELECT_RELATIONSHIP_TYPE, `/prisoner/A1234BC/contacts/create/enter-dob/${journeyId}`, undefined, 'Back'],
        [
          Page.SELECT_CONTACT_RELATIONSHIP,
          `/prisoner/A1234BC/contacts/create/select-relationship-type/${journeyId}`,
          undefined,
          'Back',
        ],
        [
          Page.SELECT_EMERGENCY_CONTACT,
          `/prisoner/A1234BC/contacts/create/select-relationship-to-prisoner/${journeyId}`,
          undefined,
          'Back',
        ],
        [
          Page.SELECT_NEXT_OF_KIN,
          `/prisoner/A1234BC/contacts/create/select-emergency-contact/${journeyId}`,
          undefined,
          'Back',
        ],
        [
          Page.ENTER_RELATIONSHIP_COMMENTS,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
          undefined,
          'Back',
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
          'Back',
        ],
        [
          Page.ADD_CONTACT_ADD_PHONE_PAGE,
          `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`,
          undefined,
          'Back',
        ],
        [
          Page.ADD_CONTACT_DELETE_PHONE_PAGE,
          `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`,
          `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`,
          'Back',
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
        [Page.CREATE_CONTACT_NAME_PAGE, undefined],
        [Page.CREATE_CONTACT_DOB_PAGE, undefined],
        [Page.SELECT_RELATIONSHIP_TYPE, undefined],
        [Page.SELECT_CONTACT_RELATIONSHIP, undefined],
        [Page.SELECT_EMERGENCY_CONTACT, undefined],
        [Page.SELECT_NEXT_OF_KIN, undefined],
        [Page.ENTER_RELATIONSHIP_COMMENTS, undefined],
        [Page.ADD_CONTACT_CANCEL_PAGE, undefined],
        [Page.ADD_CONTACT_ADD_PHONE_PAGE, undefined],
        [Page.ADD_CONTACT_DELETE_PHONE_PAGE, `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`],
      ])('Should go back to check answers from %s', (page: Page, cancelButton) => {
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
          backLinkLabel: 'Back',
          breadcrumbs: undefined,
          cancelButton,
        }

        const nav = navigationForAddContactJourney(page, journey)

        expect(nav).toStrictEqual(expected)
      })
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
        [Page.SELECT_CONTACT_RELATIONSHIP, `/prisoner/A1234BC/contacts/create/select-emergency-contact/${journeyId}`],
        [Page.SELECT_EMERGENCY_CONTACT, `/prisoner/A1234BC/contacts/create/select-next-of-kin/${journeyId}`],
        [Page.SELECT_NEXT_OF_KIN, `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`],
        [Page.ENTER_RELATIONSHIP_COMMENTS, `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`],
        [Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE, `/prisoner/A1234BC/contact/NEW/123456/654321/success`],
        [Page.ADD_CONTACT_ADD_PHONE_PAGE, `/prisoner/A1234BC/contacts/add/enter-additional-info/${journeyId}`],
        [Page.ADD_CONTACT_DELETE_PHONE_PAGE, `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`],
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
        [Page.SELECT_EMERGENCY_CONTACT],
        [Page.SELECT_NEXT_OF_KIN],
        [Page.CREATE_CONTACT_DOB_PAGE],
        [Page.ENTER_RELATIONSHIP_COMMENTS],
        [Page.ADD_CONTACT_ADD_PHONE_PAGE],
        [Page.ADD_CONTACT_DELETE_PHONE_PAGE],
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
        [Page.CONTACT_CONFIRMATION_PAGE, `/prisoner/A1234BC/contacts/search/${journeyId}`, undefined],
        [Page.SELECT_RELATIONSHIP_TYPE, `/prisoner/A1234BC/contacts/add/confirmation/${journeyId}`, undefined],
        [
          Page.SELECT_CONTACT_RELATIONSHIP,
          `/prisoner/A1234BC/contacts/create/select-relationship-type/${journeyId}`,
          undefined,
        ],
        [
          Page.SELECT_EMERGENCY_CONTACT,
          `/prisoner/A1234BC/contacts/create/select-relationship-to-prisoner/${journeyId}`,
          undefined,
        ],
        [Page.SELECT_NEXT_OF_KIN, `/prisoner/A1234BC/contacts/create/select-emergency-contact/${journeyId}`, undefined],
        [
          Page.ENTER_RELATIONSHIP_COMMENTS,
          `/prisoner/A1234BC/contacts/create/select-next-of-kin/${journeyId}`,
          undefined,
        ],
        [
          Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE,
          `/prisoner/A1234BC/contacts/create/enter-relationship-comments/${journeyId}`,
          `/prisoner/A1234BC/contacts/add/cancel/${journeyId}`,
        ],
        [Page.ADD_CONTACT_CANCEL_PAGE, `/prisoner/A1234BC/contacts/create/check-answers/${journeyId}`, undefined],
      ])(
        'Should go back to previous page: from %s to %s',
        (page: Page, expectedBackUrl?: string, expectedCancelButton?: string) => {
          const journey: AddContactJourney = {
            id: journeyId,
            lastTouched: new Date().toISOString(),
            prisonerNumber: 'A1234BC',
            returnPoint: {
              url: '/foo',
            },
            mode: 'EXISTING',
            isCheckingAnswers: false,
          }
          const expected: Navigation = {
            backLink: expectedBackUrl,
            backLinkLabel: 'Back',
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
        [Page.SELECT_EMERGENCY_CONTACT],
        [Page.SELECT_NEXT_OF_KIN],
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
          backLinkLabel: 'Back',
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
        [Page.ADD_CONTACT_MODE_PAGE, `/prisoner/A1234BC/contacts/add/confirmation/${journeyId}`],
        [Page.CONTACT_CONFIRMATION_PAGE, `/prisoner/A1234BC/contacts/create/select-relationship-type/${journeyId}`],
        [
          Page.SELECT_RELATIONSHIP_TYPE,
          `/prisoner/A1234BC/contacts/create/select-relationship-to-prisoner/${journeyId}`,
        ],
        [Page.SELECT_CONTACT_RELATIONSHIP, `/prisoner/A1234BC/contacts/create/select-emergency-contact/${journeyId}`],
        [Page.SELECT_EMERGENCY_CONTACT, `/prisoner/A1234BC/contacts/create/select-next-of-kin/${journeyId}`],
        [Page.SELECT_NEXT_OF_KIN, `/prisoner/A1234BC/contacts/create/enter-relationship-comments/${journeyId}`],
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
        [Page.SELECT_EMERGENCY_CONTACT],
        [Page.SELECT_NEXT_OF_KIN],
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
      [Page.CREATE_CONTACT_START_PAGE, undefined],
      [Page.CONTACT_SEARCH_PAGE, ['DPS_HOME', 'DPS_PROFILE', 'PRISONER_CONTACTS']],
    ])('Should have no back for initial pages', (page: Page, breadcrumbs) => {
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
        backLink: undefined,
        backLinkLabel: undefined,
        breadcrumbs: breadcrumbs as BreadcrumbType[] | undefined,
        cancelButton: undefined,
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
          url: '/foo',
        },
        isCheckingAnswers: false,
      }

      const nav = nextPageForAddContactJourney(page, journey)

      expect(nav).toStrictEqual(expectedNextUrl)
    })
  })
})
