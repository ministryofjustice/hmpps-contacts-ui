import AddContactJourney = journeys.AddContactJourney
import { Page } from '../../../services/auditService'

interface Navigation {
  backLink?: string
  breadcrumbs?: BreadcrumbType[]
}

type BreadcrumbType = 'DPS_HOME' | 'DPS_PROFILE' | 'PRISONER_CONTACTS'

type PreModePages = Page.CREATE_CONTACT_START_PAGE | Page.CONTACT_SEARCH_PAGE
type CreateContactPages =
  | Page.CREATE_CONTACT_START_PAGE
  | Page.CONTACT_SEARCH_PAGE
  | Page.ADD_CONTACT_MODE_PAGE
  | Page.CREATE_CONTACT_NAME_PAGE
  | Page.SELECT_CONTACT_RELATIONSHIP
  | Page.SELECT_EMERGENCY_CONTACT
  | Page.SELECT_NEXT_OF_KIN
  | Page.CREATE_CONTACT_DOB_PAGE
  | Page.CREATE_CONTACT_ESTIMATED_DOB_PAGE
  | Page.ENTER_RELATIONSHIP_COMMENTS
  | Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE
type ExistingContactPages =
  | Page.CREATE_CONTACT_START_PAGE
  | Page.CONTACT_SEARCH_PAGE
  | Page.ADD_CONTACT_MODE_PAGE
  | Page.CONTACT_CONFIRMATION_PAGE
  | Page.SELECT_CONTACT_RELATIONSHIP
  | Page.SELECT_EMERGENCY_CONTACT
  | Page.SELECT_NEXT_OF_KIN
  | Page.ENTER_RELATIONSHIP_COMMENTS
  | Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE
type AllAddContactPages = PreModePages | CreateContactPages | ExistingContactPages
type JourneyUrlProvider = (journey: journeys.AddContactJourney) => string | undefined
type Spec = { previousUrl: JourneyUrlProvider; nextUrl: JourneyUrlProvider }

const PAGES: Record<AllAddContactPages, { url: JourneyUrlProvider; breadcrumbs?: BreadcrumbType[] }> = {
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
  [Page.SELECT_CONTACT_RELATIONSHIP]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/create/select-relationship/${journey.id}`,
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
  [Page.CREATE_CONTACT_ESTIMATED_DOB_PAGE]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/create/enter-estimated-dob/${journey.id}`,
  },
  [Page.ENTER_RELATIONSHIP_COMMENTS]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/create/enter-relationship-comments/${journey.id}`,
  },
  [Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/create/check-answers/${journey.id}`,
  },
  [Page.CONTACT_CONFIRMATION_PAGE]: {
    url: journey => `/prisoner/${journey.prisonerNumber}/contacts/add/confirmation/${journey.id}`,
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
    previousUrl: PAGES.CONTACT_SEARCH_PAGE.url,
    nextUrl: checkAnswersOr(PAGES.SELECT_CONTACT_RELATIONSHIP.url),
  },
  [Page.SELECT_CONTACT_RELATIONSHIP]: {
    previousUrl: PAGES.CREATE_CONTACT_NAME_PAGE.url,
    nextUrl: checkAnswersOr(PAGES.SELECT_EMERGENCY_CONTACT.url),
  },
  [Page.SELECT_EMERGENCY_CONTACT]: {
    previousUrl: PAGES.SELECT_CONTACT_RELATIONSHIP.url,
    nextUrl: checkAnswersOr(PAGES.SELECT_NEXT_OF_KIN.url),
  },
  [Page.SELECT_NEXT_OF_KIN]: {
    previousUrl: PAGES.SELECT_EMERGENCY_CONTACT.url,
    nextUrl: checkAnswersOr(PAGES.CREATE_CONTACT_DOB_PAGE.url),
  },
  [Page.CREATE_CONTACT_DOB_PAGE]: {
    previousUrl: PAGES.SELECT_NEXT_OF_KIN.url,
    nextUrl: journey => {
      if (journey.dateOfBirth?.isKnown === 'NO') {
        return PAGES.CREATE_CONTACT_ESTIMATED_DOB_PAGE.url(journey)
      }
      if (journey.dateOfBirth?.isKnown === 'YES') {
        if (journey.isCheckingAnswers) {
          return PAGES.CREATE_CONTACT_CHECK_ANSWERS_PAGE.url(journey)
        }
        return PAGES.ENTER_RELATIONSHIP_COMMENTS.url(journey)
      }
      return PAGES.CREATE_CONTACT_DOB_PAGE.url(journey)
    },
  },
  [Page.CREATE_CONTACT_ESTIMATED_DOB_PAGE]: {
    previousUrl: PAGES.CREATE_CONTACT_DOB_PAGE.url,
    nextUrl: checkAnswersOr(PAGES.ENTER_RELATIONSHIP_COMMENTS.url),
  },
  [Page.ENTER_RELATIONSHIP_COMMENTS]: {
    previousUrl: journey => {
      if (journey.dateOfBirth?.isKnown === 'NO') {
        return PAGES.CREATE_CONTACT_ESTIMATED_DOB_PAGE.url(journey)
      }
      return PAGES.CREATE_CONTACT_DOB_PAGE.url(journey)
    },
    nextUrl: checkAnswersOr(PAGES.CREATE_CONTACT_CHECK_ANSWERS_PAGE.url),
  },
  [Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE]: {
    previousUrl: _ => undefined,
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
    previousUrl: PAGES.CONTACT_SEARCH_PAGE.url,
    nextUrl: checkAnswersOr(PAGES.SELECT_CONTACT_RELATIONSHIP.url),
  },
  [Page.SELECT_CONTACT_RELATIONSHIP]: {
    previousUrl: PAGES.CONTACT_CONFIRMATION_PAGE.url,
    nextUrl: checkAnswersOr(PAGES.SELECT_EMERGENCY_CONTACT.url),
  },
  [Page.SELECT_EMERGENCY_CONTACT]: {
    previousUrl: PAGES.SELECT_CONTACT_RELATIONSHIP.url,
    nextUrl: checkAnswersOr(PAGES.SELECT_NEXT_OF_KIN.url),
  },
  [Page.SELECT_NEXT_OF_KIN]: {
    previousUrl: PAGES.SELECT_EMERGENCY_CONTACT.url,
    nextUrl: checkAnswersOr(PAGES.ENTER_RELATIONSHIP_COMMENTS.url),
  },
  [Page.ENTER_RELATIONSHIP_COMMENTS]: {
    previousUrl: PAGES.SELECT_NEXT_OF_KIN.url,
    nextUrl: checkAnswersOr(PAGES.CREATE_CONTACT_CHECK_ANSWERS_PAGE.url),
  },
  [Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE]: {
    previousUrl: _ => undefined,
    nextUrl: _ => undefined,
  },
}

function checkAnswersOr(other: JourneyUrlProvider): JourneyUrlProvider {
  return journey => (journey.isCheckingAnswers ? PAGES.CREATE_CONTACT_CHECK_ANSWERS_PAGE.url(journey) : other(journey))
}

function navigationForAddContactJourney(currentPage: Page, journey: journeys.AddContactJourney): Navigation {
  const spec = findSpec(journey, currentPage)
  if (spec) {
    return {
      backLink: spec.previousUrl(journey),
      breadcrumbs: PAGES[currentPage as AllAddContactPages].breadcrumbs,
    }
  }
  throw new Error(`Couldn't determine navigation for page (${currentPage}) and journey (${JSON.stringify(journey)})`)
}

function nextPageForAddContactJourney(currentPage: Page, journey: AddContactJourney): string {
  const spec = findSpec(journey, currentPage)
  if (spec) {
    return spec.nextUrl(journey)
  }
  throw new Error(`Couldn't determine next page from (${currentPage}) and journey (${JSON.stringify(journey)})`)
}

function findSpec(journey: journeys.AddContactJourney, currentPage: Page) {
  let spec: Spec
  if (!journey.mode) {
    spec = PRE_MODE_SPEC[`${currentPage}` as PreModePages]
  } else if (journey.mode === 'NEW') {
    spec = CREATE_CONTACT_SPEC[currentPage as CreateContactPages]
  } else if (journey.mode === 'EXISTING') {
    spec = EXISTING_CONTACT_SPEC[currentPage as ExistingContactPages]
  }
  return spec
}

export { navigationForAddContactJourney, nextPageForAddContactJourney, Navigation, BreadcrumbType }
