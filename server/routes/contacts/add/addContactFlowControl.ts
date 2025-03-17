import AddContactJourney = journeys.AddContactJourney
import { Page } from '../../../services/auditService'
import { BreadcrumbType, Navigation } from '../common/navigation'

type PreModePages = Page.CREATE_CONTACT_START_PAGE | Page.CONTACT_SEARCH_PAGE
type CreateContactPages =
  | Page.CREATE_CONTACT_START_PAGE
  | Page.CONTACT_SEARCH_PAGE
  | Page.ADD_CONTACT_MODE_PAGE
  | Page.CREATE_CONTACT_NAME_PAGE
  | Page.SELECT_RELATIONSHIP_TYPE
  | Page.SELECT_CONTACT_RELATIONSHIP
  | Page.SELECT_EMERGENCY_CONTACT
  | Page.SELECT_NEXT_OF_KIN
  | Page.CREATE_CONTACT_DOB_PAGE
  | Page.ENTER_RELATIONSHIP_COMMENTS
  | Page.ENTER_ADDITIONAL_INFORMATION_PAGE
  | Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE
  | Page.SUCCESSFULLY_ADDED_CONTACT_PAGE
  | Page.ADD_CONTACT_CANCEL_PAGE
type ExistingContactPages =
  | Page.CREATE_CONTACT_START_PAGE
  | Page.CONTACT_SEARCH_PAGE
  | Page.ADD_CONTACT_MODE_PAGE
  | Page.CONTACT_CONFIRMATION_PAGE
  | Page.SELECT_RELATIONSHIP_TYPE
  | Page.SELECT_CONTACT_RELATIONSHIP
  | Page.SELECT_EMERGENCY_CONTACT
  | Page.SELECT_NEXT_OF_KIN
  | Page.ENTER_RELATIONSHIP_COMMENTS
  | Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE
  | Page.SUCCESSFULLY_ADDED_CONTACT_PAGE
  | Page.ADD_CONTACT_CANCEL_PAGE
type AllAddContactPages = PreModePages | CreateContactPages | ExistingContactPages
type JourneyUrlProvider = (journey: journeys.AddContactJourney) => string | undefined
type Spec = {
  previousUrl: JourneyUrlProvider
  previousUrlLabel?: JourneyUrlProvider
  nextUrl: JourneyUrlProvider
  cancelUrl?: JourneyUrlProvider
}
type PageConfig = { url: JourneyUrlProvider; pageName?: string; breadcrumbs?: BreadcrumbType[] }

const PAGES: Record<AllAddContactPages, PageConfig> = {
  [Page.CREATE_CONTACT_START_PAGE]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/create/start`,
  },
  [Page.CONTACT_SEARCH_PAGE]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/search/${journey.id}`,
    breadcrumbs: ['DPS_HOME', 'DPS_PROFILE', 'PRISONER_CONTACTS'],
  },
  [Page.ADD_CONTACT_MODE_PAGE]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/mode/${journey.mode}/${journey.id}`,
  },
  [Page.CREATE_CONTACT_NAME_PAGE]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/create/enter-name/${journey.id}`,
  },
  [Page.SELECT_RELATIONSHIP_TYPE]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/create/select-relationship-type/${journey.id}`,
  },
  [Page.SELECT_CONTACT_RELATIONSHIP]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/create/select-relationship-to-prisoner/${journey.id}`,
  },
  [Page.SELECT_EMERGENCY_CONTACT]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/create/select-emergency-contact/${journey.id}`,
  },
  [Page.SELECT_NEXT_OF_KIN]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/create/select-next-of-kin/${journey.id}`,
  },
  [Page.CREATE_CONTACT_DOB_PAGE]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/create/enter-dob/${journey.id}`,
  },
  [Page.ENTER_RELATIONSHIP_COMMENTS]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/create/enter-relationship-comments/${journey.id}`,
  },
  [Page.ENTER_ADDITIONAL_INFORMATION_PAGE]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/add/enter-additional-info/${journey.id}`,
    pageName: 'additional information options',
  },
  [Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/create/check-answers/${journey.id}`,
  },
  [Page.CONTACT_CONFIRMATION_PAGE]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/add/confirmation/${journey.id}`,
  },
  [Page.SUCCESSFULLY_ADDED_CONTACT_PAGE]: {
    url: journey =>
      `/prisoner/${journey.prisonerNumber}/contact/${journey.mode}/${journey.contactId}/${journey.prisonerContactId}/success`,
    breadcrumbs: ['DPS_HOME', 'DPS_PROFILE', 'PRISONER_CONTACTS'],
  },
  [Page.ADD_CONTACT_CANCEL_PAGE]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/add/cancel/${journey.id}`,
  },
}

const PRE_MODE_SPEC: Record<PreModePages, Spec> = {
  [Page.CREATE_CONTACT_START_PAGE]: { previousUrl: _ => undefined, nextUrl: PAGES.CONTACT_SEARCH_PAGE.url },
  [Page.CONTACT_SEARCH_PAGE]: { previousUrl: _ => undefined, nextUrl: PAGES.CONTACT_SEARCH_PAGE.url },
}

const CREATE_CONTACT_SPEC: Record<CreateContactPages, Spec> = {
  [Page.CREATE_CONTACT_START_PAGE]: { previousUrl: _ => undefined, nextUrl: PAGES.CONTACT_SEARCH_PAGE.url },
  [Page.CONTACT_SEARCH_PAGE]: { previousUrl: _ => undefined, nextUrl: PAGES.CONTACT_SEARCH_PAGE.url },
  [Page.ADD_CONTACT_MODE_PAGE]: { previousUrl: _ => undefined, nextUrl: PAGES.CREATE_CONTACT_NAME_PAGE.url },
  [Page.CREATE_CONTACT_NAME_PAGE]: {
    ...backTo({ page: PAGES.CONTACT_SEARCH_PAGE }),
    nextUrl: checkAnswersOr(PAGES.CREATE_CONTACT_DOB_PAGE.url),
  },
  [Page.CREATE_CONTACT_DOB_PAGE]: {
    ...backTo({ page: PAGES.CREATE_CONTACT_NAME_PAGE }),
    nextUrl: checkAnswersOr(PAGES.SELECT_RELATIONSHIP_TYPE.url),
  },
  [Page.SELECT_RELATIONSHIP_TYPE]: {
    ...backTo({ page: PAGES.CREATE_CONTACT_DOB_PAGE }),
    nextUrl: forwardToRelationshipToPrisonerOrCheckAnswers(),
  },
  [Page.SELECT_CONTACT_RELATIONSHIP]: {
    ...backToRelationshipTypeOrCheckAnswers(),
    nextUrl: checkAnswersOr(PAGES.SELECT_EMERGENCY_CONTACT.url),
  },
  [Page.SELECT_EMERGENCY_CONTACT]: {
    ...backTo({ page: PAGES.SELECT_CONTACT_RELATIONSHIP }),
    nextUrl: checkAnswersOr(PAGES.SELECT_NEXT_OF_KIN.url),
  },
  [Page.SELECT_NEXT_OF_KIN]: {
    ...backTo({ page: PAGES.SELECT_EMERGENCY_CONTACT }),
    nextUrl: checkAnswersOr(PAGES.ENTER_ADDITIONAL_INFORMATION_PAGE.url),
  },
  [Page.ENTER_ADDITIONAL_INFORMATION_PAGE]: {
    ...backTo({ page: PAGES.SELECT_NEXT_OF_KIN }),
    nextUrl: PAGES.CREATE_CONTACT_CHECK_ANSWERS_PAGE.url,
  },
  [Page.ENTER_RELATIONSHIP_COMMENTS]: {
    ...backTo({ page: PAGES.ENTER_ADDITIONAL_INFORMATION_PAGE }),
    previousUrlLabel: _ => 'Back',
    nextUrl: checkAnswersOr(PAGES.ENTER_ADDITIONAL_INFORMATION_PAGE.url),
  },
  [Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE]: {
    ...backTo({ page: PAGES.ENTER_ADDITIONAL_INFORMATION_PAGE, canSkipToCheckAnswer: false }),
    nextUrl: PAGES.SUCCESSFULLY_ADDED_CONTACT_PAGE.url,
    cancelUrl: PAGES.ADD_CONTACT_CANCEL_PAGE.url,
  },
  [Page.SUCCESSFULLY_ADDED_CONTACT_PAGE]: {
    previousUrl: _ => undefined,
    nextUrl: _ => undefined,
  },
  [Page.ADD_CONTACT_CANCEL_PAGE]: {
    ...backTo({ page: PAGES.CREATE_CONTACT_CHECK_ANSWERS_PAGE, canSkipToCheckAnswer: false }),
    nextUrl: _ => undefined,
  },
}

const EXISTING_CONTACT_SPEC: Record<ExistingContactPages, Spec> = {
  [Page.CREATE_CONTACT_START_PAGE]: { previousUrl: _ => undefined, nextUrl: PAGES.CONTACT_SEARCH_PAGE.url },
  [Page.CONTACT_SEARCH_PAGE]: { previousUrl: _ => undefined, nextUrl: PAGES.CONTACT_SEARCH_PAGE.url },
  [Page.ADD_CONTACT_MODE_PAGE]: {
    previousUrl: _ => undefined,
    nextUrl: checkAnswersOr(PAGES.CONTACT_CONFIRMATION_PAGE.url),
  },
  [Page.CONTACT_CONFIRMATION_PAGE]: {
    ...backTo({ page: PAGES.CONTACT_SEARCH_PAGE, canSkipToCheckAnswer: false }),
    nextUrl: checkAnswersOr(PAGES.SELECT_RELATIONSHIP_TYPE.url),
  },
  [Page.SELECT_RELATIONSHIP_TYPE]: {
    ...backTo({ page: PAGES.CONTACT_CONFIRMATION_PAGE }),
    nextUrl: forwardToRelationshipToPrisonerOrCheckAnswers(),
  },
  [Page.SELECT_CONTACT_RELATIONSHIP]: {
    ...backToRelationshipTypeOrCheckAnswers(),
    nextUrl: checkAnswersOr(PAGES.SELECT_EMERGENCY_CONTACT.url),
  },
  [Page.SELECT_EMERGENCY_CONTACT]: {
    ...backTo({ page: PAGES.SELECT_CONTACT_RELATIONSHIP }),
    nextUrl: checkAnswersOr(PAGES.SELECT_NEXT_OF_KIN.url),
  },
  [Page.SELECT_NEXT_OF_KIN]: {
    ...backTo({ page: PAGES.SELECT_EMERGENCY_CONTACT }),
    nextUrl: checkAnswersOr(PAGES.ENTER_RELATIONSHIP_COMMENTS.url),
  },
  [Page.ENTER_RELATIONSHIP_COMMENTS]: {
    ...backTo({ page: PAGES.SELECT_NEXT_OF_KIN }),
    nextUrl: checkAnswersOr(PAGES.CREATE_CONTACT_CHECK_ANSWERS_PAGE.url),
  },
  [Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE]: {
    ...backTo({ page: PAGES.ENTER_RELATIONSHIP_COMMENTS, canSkipToCheckAnswer: false }),
    nextUrl: PAGES.SUCCESSFULLY_ADDED_CONTACT_PAGE.url,
    cancelUrl: PAGES.ADD_CONTACT_CANCEL_PAGE.url,
  },
  [Page.SUCCESSFULLY_ADDED_CONTACT_PAGE]: {
    previousUrl: _ => undefined,
    nextUrl: _ => undefined,
  },
  [Page.ADD_CONTACT_CANCEL_PAGE]: {
    ...backTo({ page: PAGES.CREATE_CONTACT_CHECK_ANSWERS_PAGE, canSkipToCheckAnswer: false }),
    nextUrl: _ => undefined,
  },
}

function backTo({ page, canSkipToCheckAnswer = true }: { page: PageConfig; canSkipToCheckAnswer?: boolean }) {
  const previousUrlLabel: JourneyUrlProvider = journey => {
    const pageName =
      canSkipToCheckAnswer && journey.isCheckingAnswers
        ? PAGES.CREATE_CONTACT_CHECK_ANSWERS_PAGE.pageName
        : page.pageName
    return pageName ? `Back to ${pageName}` : 'Back'
  }

  return {
    previousUrl: canSkipToCheckAnswer ? checkAnswersOr(page.url) : page.url,
    previousUrlLabel,
  }
}

function checkAnswersOr(other: JourneyUrlProvider): JourneyUrlProvider {
  return journey => (journey.isCheckingAnswers ? PAGES.CREATE_CONTACT_CHECK_ANSWERS_PAGE.url(journey) : other(journey))
}

function forwardToRelationshipToPrisonerOrCheckAnswers(): JourneyUrlProvider {
  return journey => {
    const relationshipTypeIsTheSame =
      journey.relationship?.pendingNewRelationshipType === journey.previousAnswers?.relationship?.relationshipType
    return journey.isCheckingAnswers && relationshipTypeIsTheSame
      ? PAGES.CREATE_CONTACT_CHECK_ANSWERS_PAGE.url(journey)
      : PAGES.SELECT_CONTACT_RELATIONSHIP.url(journey)
  }
}

function backToRelationshipTypeOrCheckAnswers() {
  const getPreviousPage = (journey: journeys.AddContactJourney) => {
    const relationshipType = journey.relationship?.pendingNewRelationshipType ?? journey.relationship?.relationshipType
    const relationshipTypeIsTheSame = relationshipType === journey.previousAnswers?.relationship?.relationshipType
    return (journey.isCheckingAnswers && !relationshipTypeIsTheSame) || !journey.isCheckingAnswers
      ? PAGES.SELECT_RELATIONSHIP_TYPE
      : PAGES.CREATE_CONTACT_CHECK_ANSWERS_PAGE
  }
  const previousUrl: JourneyUrlProvider = journey => getPreviousPage(journey).url(journey)
  const previousUrlLabel: JourneyUrlProvider = journey => {
    const { pageName } = getPreviousPage(journey)
    return pageName ? `Back to ${pageName}` : 'Back'
  }
  return {
    previousUrl,
    previousUrlLabel,
  }
}

function navigationForAddContactJourney(currentPage: Page, journey: journeys.AddContactJourney): Navigation {
  const spec = findSpec(journey, currentPage)
  if (spec) {
    return {
      backLinkLabel: spec.previousUrlLabel ? spec.previousUrlLabel(journey) : undefined,
      backLink: spec.previousUrl(journey),
      breadcrumbs: PAGES[currentPage as AllAddContactPages].breadcrumbs,
      cancelButton: spec.cancelUrl?.(journey),
    }
  }
  throw new Error(`Couldn't determine navigation for page (${currentPage}) and journey (${JSON.stringify(journey)})`)
}

function nextPageForAddContactJourney(currentPage: Page, journey: AddContactJourney): string {
  const spec = findSpec(journey, currentPage)
  const nextPage = spec?.nextUrl(journey)
  if (nextPage) {
    return nextPage
  }
  throw new Error(`Couldn't determine next page from (${currentPage}) and journey (${JSON.stringify(journey)})`)
}

function findSpec(journey: journeys.AddContactJourney, currentPage: Page) {
  let spec: Spec | undefined
  if (!journey.mode) {
    spec = PRE_MODE_SPEC[`${currentPage}` as PreModePages]
  } else if (journey.mode === 'NEW') {
    spec = CREATE_CONTACT_SPEC[currentPage as CreateContactPages]
  } else if (journey.mode === 'EXISTING') {
    spec = EXISTING_CONTACT_SPEC[currentPage as ExistingContactPages]
  }
  if (!spec) {
    throw Error('Unidentified journey spec')
  }
  return spec
}

export { navigationForAddContactJourney, nextPageForAddContactJourney }
