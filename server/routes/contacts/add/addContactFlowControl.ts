import AddContactJourney = journeys.AddContactJourney
import { Page } from '../../../services/auditService'
import { BreadcrumbType, Navigation } from '../common/navigation'

type PreModePages = Page.CREATE_CONTACT_START_PAGE | Page.CONTACT_SEARCH_PAGE | Page.CONTACT_MATCH_PAGE
type CreateContactPages =
  | Page.CREATE_CONTACT_START_PAGE
  | Page.CONTACT_SEARCH_PAGE
  | Page.CONTACT_MATCH_PAGE
  | Page.ADD_CONTACT_MODE_PAGE
  | Page.CREATE_CONTACT_NAME_PAGE
  | Page.SELECT_RELATIONSHIP_TYPE
  | Page.SELECT_CONTACT_RELATIONSHIP
  | Page.SELECT_EMERGENCY_CONTACT_OR_NEXT_OF_KIN
  | Page.ADD_CONTACT_APPROVED_TO_VISIT_PAGE
  | Page.CREATE_CONTACT_DOB_PAGE
  | Page.ENTER_RELATIONSHIP_COMMENTS
  | Page.ENTER_ADDITIONAL_INFORMATION_PAGE
  | Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE
  | Page.SUCCESSFULLY_ADDED_CONTACT_PAGE
  | Page.ADD_CONTACT_CANCEL_PAGE
  | Page.ADD_EMPLOYMENTS
  | Page.ADD_ADDRESSES
  | Page.ADD_CONTACT_ADD_PHONE_PAGE
  | Page.ADD_CONTACT_DELETE_PHONE_PAGE
  | Page.ADD_CONTACT_ENTER_GENDER_PAGE
  | Page.ADD_CONTACT_IS_STAFF_PAGE
  | Page.ADD_CONTACT_LANGUAGE_INTERPRETER_PAGE
  | Page.ADD_CONTACT_ADD_IDENTITY_PAGE
  | Page.ADD_CONTACT_DELETE_IDENTITY_PAGE
  | Page.ADD_CONTACT_DOMESTIC_STATUS_PAGE
  | Page.ADD_CONTACT_ADD_EMAIL_PAGE
  | Page.ADD_CONTACT_DELETE_EMAIL_PAGE
type ExistingContactPages =
  | Page.CREATE_CONTACT_START_PAGE
  | Page.CONTACT_SEARCH_PAGE
  | Page.CONTACT_MATCH_PAGE
  | Page.ADD_CONTACT_MODE_PAGE
  | Page.SELECT_RELATIONSHIP_TYPE
  | Page.SELECT_CONTACT_RELATIONSHIP
  | Page.SELECT_EMERGENCY_CONTACT_OR_NEXT_OF_KIN
  | Page.ADD_CONTACT_APPROVED_TO_VISIT_PAGE
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
  },
  [Page.ADD_CONTACT_MODE_PAGE]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/add/mode/${journey.mode}/${journey.id}`,
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
  [Page.SELECT_EMERGENCY_CONTACT_OR_NEXT_OF_KIN]: {
    url: journey =>
      `/prisoner/${journey.prisonerNumber}/contacts/create/emergency-contact-or-next-of-kin/${journey.id}`,
  },
  [Page.ADD_CONTACT_APPROVED_TO_VISIT_PAGE]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/create/approved-to-visit/${journey.id}`,
  },
  [Page.CREATE_CONTACT_DOB_PAGE]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/create/enter-dob/${journey.id}`,
  },
  [Page.ENTER_RELATIONSHIP_COMMENTS]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/create/enter-relationship-comments/${journey.id}`,
  },
  [Page.ENTER_ADDITIONAL_INFORMATION_PAGE]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/add/enter-additional-info/${journey.id}`,
  },
  [Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/create/check-answers/${journey.id}`,
  },
  [Page.CONTACT_MATCH_PAGE]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/add/match/${journey.matchingContactId}/${journey.id}`,
  },
  [Page.SUCCESSFULLY_ADDED_CONTACT_PAGE]: {
    url: journey =>
      `/prisoner/${journey.prisonerNumber}/contact/${journey.mode}/${journey.contactId}/${journey.prisonerContactId}/success`,
    breadcrumbs: ['DPS_HOME', 'DPS_PROFILE', 'PRISONER_CONTACTS'],
  },
  [Page.ADD_CONTACT_CANCEL_PAGE]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/add/cancel/${journey.id}`,
  },
  [Page.ADD_EMPLOYMENTS]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/create/employments/${journey.id}`,
  },
  [Page.ADD_ADDRESSES]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/create/addresses/${journey.id}`,
  },
  [Page.ADD_CONTACT_ADD_PHONE_PAGE]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/create/add-phone-numbers/${journey.id}`,
  },
  [Page.ADD_CONTACT_DELETE_PHONE_PAGE]: {
    // this page can only be accessed by check answers
    url: _ => '#',
  },
  [Page.ADD_CONTACT_ENTER_GENDER_PAGE]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/create/enter-gender/${journey.id}`,
  },
  [Page.ADD_CONTACT_IS_STAFF_PAGE]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/create/is-staff/${journey.id}`,
  },
  [Page.ADD_CONTACT_LANGUAGE_INTERPRETER_PAGE]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/create/language-and-interpreter/${journey.id}`,
  },
  [Page.ADD_CONTACT_ADD_IDENTITY_PAGE]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/create/identities/${journey.id}`,
  },
  [Page.ADD_CONTACT_DELETE_IDENTITY_PAGE]: {
    // this page can only be accessed by check answers
    url: _ => '#',
  },
  [Page.ADD_CONTACT_ADD_EMAIL_PAGE]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/create/emails/${journey.id}`,
  },
  [Page.ADD_CONTACT_DELETE_EMAIL_PAGE]: {
    // this page can only be accessed by check answers
    url: _ => '#',
  },
  [Page.ADD_CONTACT_DOMESTIC_STATUS_PAGE]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/create/domestic-status/${journey.id}`,
  },
}

const PRE_MODE_SPEC: Record<PreModePages, Spec> = {
  [Page.CREATE_CONTACT_START_PAGE]: { previousUrl: _ => undefined, nextUrl: PAGES.CONTACT_SEARCH_PAGE.url },
  [Page.CONTACT_SEARCH_PAGE]: {
    previousUrl: journey => `/prisoner/${journey.prisonerNumber}/contacts/list`,
    previousUrlLabel: _ => 'Back to prisoner’s contact list',
    nextUrl: PAGES.CONTACT_SEARCH_PAGE.url,
  },
  [Page.CONTACT_MATCH_PAGE]: {
    previousUrl: PAGES.CONTACT_SEARCH_PAGE.url,
    previousUrlLabel: _ => 'Back to contact search',
    nextUrl: journey => PAGES.ADD_CONTACT_MODE_PAGE.url(journey),
  },
}

const CREATE_CONTACT_SPEC: Record<CreateContactPages, Spec> = {
  [Page.CREATE_CONTACT_START_PAGE]: { previousUrl: _ => undefined, nextUrl: PAGES.CONTACT_SEARCH_PAGE.url },
  [Page.CONTACT_SEARCH_PAGE]: { previousUrl: _ => undefined, nextUrl: PAGES.CONTACT_SEARCH_PAGE.url },
  [Page.CONTACT_MATCH_PAGE]: {
    previousUrl: PAGES.CONTACT_SEARCH_PAGE.url,
    previousUrlLabel: _ => 'Back to contact search',
    nextUrl: journey => PAGES.ADD_CONTACT_MODE_PAGE.url(journey),
  },
  [Page.ADD_CONTACT_MODE_PAGE]: { previousUrl: _ => undefined, nextUrl: PAGES.CREATE_CONTACT_NAME_PAGE.url },
  [Page.CREATE_CONTACT_NAME_PAGE]: {
    previousUrl: checkAnswersOr(PAGES.CONTACT_SEARCH_PAGE.url),
    previousUrlLabel: _ => 'Back to contact search',
    nextUrl: checkAnswersOr(PAGES.CREATE_CONTACT_DOB_PAGE.url),
  },
  [Page.CREATE_CONTACT_DOB_PAGE]: {
    previousUrl: checkAnswersOr(PAGES.CREATE_CONTACT_NAME_PAGE.url),
    nextUrl: checkAnswersOr(PAGES.SELECT_RELATIONSHIP_TYPE.url),
  },
  [Page.SELECT_RELATIONSHIP_TYPE]: {
    previousUrl: checkAnswersOr(PAGES.CREATE_CONTACT_DOB_PAGE.url),
    nextUrl: forwardToRelationshipToPrisonerOrCheckAnswers(),
  },
  [Page.SELECT_CONTACT_RELATIONSHIP]: {
    previousUrl: journey => backToRelationshipTypeOrCheckAnswers(journey),
    nextUrl: checkAnswersOr(PAGES.SELECT_EMERGENCY_CONTACT_OR_NEXT_OF_KIN.url),
  },
  [Page.SELECT_EMERGENCY_CONTACT_OR_NEXT_OF_KIN]: {
    previousUrl: checkAnswersOr(PAGES.SELECT_CONTACT_RELATIONSHIP.url),
    nextUrl: checkAnswersOr(PAGES.ADD_CONTACT_APPROVED_TO_VISIT_PAGE.url),
  },
  [Page.ADD_CONTACT_APPROVED_TO_VISIT_PAGE]: {
    previousUrl: checkAnswersOr(PAGES.SELECT_EMERGENCY_CONTACT_OR_NEXT_OF_KIN.url),
    nextUrl: checkAnswersOr(PAGES.ENTER_ADDITIONAL_INFORMATION_PAGE.url),
  },
  [Page.ENTER_ADDITIONAL_INFORMATION_PAGE]: {
    previousUrl: checkAnswersOr(PAGES.ADD_CONTACT_APPROVED_TO_VISIT_PAGE.url),
    previousUrlLabel: _ => 'Back to visits approval',
    nextUrl: PAGES.CREATE_CONTACT_CHECK_ANSWERS_PAGE.url,
  },
  [Page.ENTER_RELATIONSHIP_COMMENTS]: {
    previousUrl: checkAnswersOr(PAGES.ENTER_ADDITIONAL_INFORMATION_PAGE.url),
    nextUrl: checkAnswersOr(PAGES.ENTER_ADDITIONAL_INFORMATION_PAGE.url),
  },
  [Page.ADD_CONTACT_ADD_PHONE_PAGE]: {
    previousUrl: checkAnswersOr(PAGES.ENTER_ADDITIONAL_INFORMATION_PAGE.url),
    nextUrl: checkAnswersOr(PAGES.ENTER_ADDITIONAL_INFORMATION_PAGE.url),
  },
  [Page.ADD_CONTACT_DELETE_PHONE_PAGE]: {
    previousUrl: checkAnswersOr(PAGES.CREATE_CONTACT_CHECK_ANSWERS_PAGE.url),
    nextUrl: checkAnswersOr(PAGES.CREATE_CONTACT_CHECK_ANSWERS_PAGE.url),
    cancelUrl: PAGES.CREATE_CONTACT_CHECK_ANSWERS_PAGE.url,
  },
  [Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE]: {
    previousUrl: PAGES.ENTER_ADDITIONAL_INFORMATION_PAGE.url,
    previousUrlLabel: _ => 'Back to additional information options',
    nextUrl: PAGES.SUCCESSFULLY_ADDED_CONTACT_PAGE.url,
    cancelUrl: PAGES.ADD_CONTACT_CANCEL_PAGE.url,
  },
  [Page.SUCCESSFULLY_ADDED_CONTACT_PAGE]: {
    previousUrl: _ => undefined,
    nextUrl: _ => undefined,
  },
  [Page.ADD_CONTACT_CANCEL_PAGE]: {
    previousUrl: PAGES.CREATE_CONTACT_CHECK_ANSWERS_PAGE.url,
    nextUrl: _ => undefined,
  },
  [Page.ADD_EMPLOYMENTS]: {
    previousUrl: checkAnswersOr(PAGES.ENTER_ADDITIONAL_INFORMATION_PAGE.url),
    previousUrlLabel: backIfCheckAnswersOr(_ => 'Back to additional information options'),
    nextUrl: checkAnswersOr(PAGES.ENTER_ADDITIONAL_INFORMATION_PAGE.url),
  },
  [Page.ADD_ADDRESSES]: {
    previousUrl: checkAnswersOr(PAGES.ENTER_ADDITIONAL_INFORMATION_PAGE.url),
    previousUrlLabel: backIfCheckAnswersOr(_ => 'Back to additional information options'),
    nextUrl: checkAnswersOr(PAGES.ENTER_ADDITIONAL_INFORMATION_PAGE.url),
  },
  [Page.ADD_CONTACT_ENTER_GENDER_PAGE]: {
    previousUrl: checkAnswersOr(PAGES.ENTER_ADDITIONAL_INFORMATION_PAGE.url),
    nextUrl: checkAnswersOr(PAGES.ENTER_ADDITIONAL_INFORMATION_PAGE.url),
  },
  [Page.ADD_CONTACT_IS_STAFF_PAGE]: {
    previousUrl: checkAnswersOr(PAGES.ENTER_ADDITIONAL_INFORMATION_PAGE.url),
    nextUrl: checkAnswersOr(PAGES.ENTER_ADDITIONAL_INFORMATION_PAGE.url),
  },
  [Page.ADD_CONTACT_LANGUAGE_INTERPRETER_PAGE]: {
    previousUrl: checkAnswersOr(PAGES.ENTER_ADDITIONAL_INFORMATION_PAGE.url),
    nextUrl: checkAnswersOr(PAGES.ENTER_ADDITIONAL_INFORMATION_PAGE.url),
  },
  [Page.ADD_CONTACT_ADD_IDENTITY_PAGE]: {
    previousUrl: checkAnswersOr(PAGES.ENTER_ADDITIONAL_INFORMATION_PAGE.url),
    nextUrl: checkAnswersOr(PAGES.ENTER_ADDITIONAL_INFORMATION_PAGE.url),
  },
  [Page.ADD_CONTACT_DELETE_IDENTITY_PAGE]: {
    previousUrl: checkAnswersOr(PAGES.CREATE_CONTACT_CHECK_ANSWERS_PAGE.url),
    nextUrl: checkAnswersOr(PAGES.CREATE_CONTACT_CHECK_ANSWERS_PAGE.url),
    cancelUrl: PAGES.CREATE_CONTACT_CHECK_ANSWERS_PAGE.url,
  },
  [Page.ADD_CONTACT_ADD_EMAIL_PAGE]: {
    previousUrl: checkAnswersOr(PAGES.ENTER_ADDITIONAL_INFORMATION_PAGE.url),
    nextUrl: checkAnswersOr(PAGES.ENTER_ADDITIONAL_INFORMATION_PAGE.url),
  },
  [Page.ADD_CONTACT_DELETE_EMAIL_PAGE]: {
    previousUrl: checkAnswersOr(PAGES.CREATE_CONTACT_CHECK_ANSWERS_PAGE.url),
    nextUrl: checkAnswersOr(PAGES.CREATE_CONTACT_CHECK_ANSWERS_PAGE.url),
    cancelUrl: PAGES.CREATE_CONTACT_CHECK_ANSWERS_PAGE.url,
  },
  [Page.ADD_CONTACT_DOMESTIC_STATUS_PAGE]: {
    previousUrl: checkAnswersOr(PAGES.ENTER_ADDITIONAL_INFORMATION_PAGE.url),
    nextUrl: checkAnswersOr(PAGES.ENTER_ADDITIONAL_INFORMATION_PAGE.url),
  },
}

const EXISTING_CONTACT_SPEC: Record<ExistingContactPages, Spec> = {
  [Page.CREATE_CONTACT_START_PAGE]: { previousUrl: _ => undefined, nextUrl: PAGES.CONTACT_SEARCH_PAGE.url },
  [Page.CONTACT_SEARCH_PAGE]: { previousUrl: _ => undefined, nextUrl: PAGES.CONTACT_SEARCH_PAGE.url },
  [Page.CONTACT_MATCH_PAGE]: {
    previousUrl: PAGES.CONTACT_SEARCH_PAGE.url,
    previousUrlLabel: _ => 'Back to contact search',
    nextUrl: PAGES.ADD_CONTACT_MODE_PAGE.url,
  },
  [Page.ADD_CONTACT_MODE_PAGE]: {
    previousUrl: _ => undefined,
    nextUrl: PAGES.SELECT_RELATIONSHIP_TYPE.url,
  },
  [Page.SELECT_RELATIONSHIP_TYPE]: {
    previousUrl: checkAnswersOr(PAGES.CONTACT_MATCH_PAGE.url),
    nextUrl: forwardToRelationshipToPrisonerOrCheckAnswers(),
  },
  [Page.SELECT_CONTACT_RELATIONSHIP]: {
    previousUrl: journey => backToRelationshipTypeOrCheckAnswers(journey),
    nextUrl: checkAnswersOr(PAGES.SELECT_EMERGENCY_CONTACT_OR_NEXT_OF_KIN.url),
  },
  [Page.SELECT_EMERGENCY_CONTACT_OR_NEXT_OF_KIN]: {
    previousUrl: checkAnswersOr(PAGES.SELECT_CONTACT_RELATIONSHIP.url),
    nextUrl: checkAnswersOr(PAGES.ADD_CONTACT_APPROVED_TO_VISIT_PAGE.url),
  },
  [Page.ADD_CONTACT_APPROVED_TO_VISIT_PAGE]: {
    previousUrl: checkAnswersOr(PAGES.SELECT_EMERGENCY_CONTACT_OR_NEXT_OF_KIN.url),
    nextUrl: checkAnswersOr(PAGES.ENTER_RELATIONSHIP_COMMENTS.url),
  },
  [Page.ENTER_RELATIONSHIP_COMMENTS]: {
    previousUrl: checkAnswersOr(PAGES.ADD_CONTACT_APPROVED_TO_VISIT_PAGE.url),
    nextUrl: checkAnswersOr(PAGES.CREATE_CONTACT_CHECK_ANSWERS_PAGE.url),
  },
  [Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE]: {
    previousUrl: PAGES.ENTER_RELATIONSHIP_COMMENTS.url,
    nextUrl: PAGES.SUCCESSFULLY_ADDED_CONTACT_PAGE.url,
    cancelUrl: PAGES.ADD_CONTACT_CANCEL_PAGE.url,
  },
  [Page.SUCCESSFULLY_ADDED_CONTACT_PAGE]: {
    previousUrl: _ => undefined,
    nextUrl: _ => undefined,
  },
  [Page.ADD_CONTACT_CANCEL_PAGE]: {
    previousUrl: PAGES.CREATE_CONTACT_CHECK_ANSWERS_PAGE.url,
    nextUrl: _ => undefined,
  },
}

function checkAnswersOr(other: JourneyUrlProvider): JourneyUrlProvider {
  return journey => (journey.isCheckingAnswers ? PAGES.CREATE_CONTACT_CHECK_ANSWERS_PAGE.url(journey) : other(journey))
}

function backIfCheckAnswersOr(other: JourneyUrlProvider): JourneyUrlProvider {
  return journey => (journey.isCheckingAnswers ? `Back` : other(journey))
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

function backToRelationshipTypeOrCheckAnswers(journey: AddContactJourney) {
  const relationshipType = journey.relationship?.pendingNewRelationshipType ?? journey.relationship?.relationshipType
  const relationshipTypeIsTheSame = relationshipType === journey.previousAnswers?.relationship?.relationshipType
  return (journey.isCheckingAnswers && !relationshipTypeIsTheSame) || !journey.isCheckingAnswers
    ? PAGES.SELECT_RELATIONSHIP_TYPE.url(journey)
    : PAGES.CREATE_CONTACT_CHECK_ANSWERS_PAGE.url(journey)
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
