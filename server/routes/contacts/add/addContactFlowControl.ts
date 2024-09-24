import AddContactJourney = journeys.AddContactJourney
import { Page } from '../../../services/auditService'

interface AddContactNavigation {
  backLink?: string
}

function navigationForAddContactJourney(currentPage: Page, journey: journeys.AddContactJourney): AddContactNavigation {
  if (currentPage === Page.CREATE_CONTACT_NAME_PAGE) {
    return { backLink: undefined }
  }
  if (currentPage === Page.SELECT_CONTACT_RELATIONSHIP) {
    return { backLink: `/prisoner/${journey.prisonerNumber}/contacts/create/enter-name/${journey.id}` }
  }
  if (currentPage === Page.SELECT_EMERGENCY_CONTACT) {
    return { backLink: `/prisoner/${journey.prisonerNumber}/contacts/create/select-relationship/${journey.id}` }
  }
  if (currentPage === Page.SELECT_NEXT_OF_KIN) {
    return { backLink: `/prisoner/${journey.prisonerNumber}/contacts/create/select-emergency-contact/${journey.id}` }
  }
  if (currentPage === Page.CREATE_CONTACT_DOB_PAGE) {
    return { backLink: `/prisoner/${journey.prisonerNumber}/contacts/create/select-next-of-kin/${journey.id}` }
  }
  if (currentPage === Page.CREATE_CONTACT_ESTIMATED_DOB_PAGE) {
    return { backLink: `/prisoner/${journey.prisonerNumber}/contacts/create/enter-dob/${journey.id}` }
  }
  if (currentPage === Page.ENTER_RELATIONSHIP_COMMENTS) {
    if (journey?.dateOfBirth?.isKnown === 'YES') {
      return { backLink: `/prisoner/${journey.prisonerNumber}/contacts/create/enter-dob/${journey.id}` }
    }
    if (journey?.dateOfBirth?.isKnown === 'NO') {
      return { backLink: `/prisoner/${journey.prisonerNumber}/contacts/create/enter-estimated-dob/${journey.id}` }
    }
  }
  if (currentPage === Page.CREATE_CONTACT_CHECK_ANSWERS_PAGE) {
    return { backLink: `/prisoner/${journey.prisonerNumber}/contacts/create/enter-relationship-comments/${journey.id}` }
  }

  throw new Error(`Couldn't determine navigation for page (${currentPage}) and journey (${JSON.stringify(journey)})`)
}

function nextPageForAddContactJourney(currentPage: Page, journey: AddContactJourney): string {
  if (journey.isCheckingAnswers) {
    if (currentPage === Page.CREATE_CONTACT_DOB_PAGE && journey.dateOfBirth?.isKnown === 'NO') {
      return `/prisoner/${journey.prisonerNumber}/contacts/create/enter-estimated-dob/${journey.id}`
    }
    return `/prisoner/${journey.prisonerNumber}/contacts/create/check-answers/${journey.id}`
  }
  if (currentPage === Page.CREATE_CONTACT_START_PAGE || currentPage === Page.CONTACT_SEARCH_PAGE) {
    return `/prisoner/${journey.prisonerNumber}/contacts/search/${journey.id}`
  }
  if (currentPage === Page.ADD_CONTACT_MODE_PAGE && journey.mode === 'NEW') {
    return `/prisoner/${journey.prisonerNumber}/contacts/create/enter-name/${journey.id}`
  }
  if (currentPage === Page.CREATE_CONTACT_NAME_PAGE) {
    return `/prisoner/${journey.prisonerNumber}/contacts/create/select-relationship/${journey.id}`
  }
  if (currentPage === Page.SELECT_CONTACT_RELATIONSHIP) {
    return `/prisoner/${journey.prisonerNumber}/contacts/create/select-emergency-contact/${journey.id}`
  }
  if (currentPage === Page.SELECT_EMERGENCY_CONTACT) {
    return `/prisoner/${journey.prisonerNumber}/contacts/create/select-next-of-kin/${journey.id}`
  }
  if (currentPage === Page.SELECT_NEXT_OF_KIN) {
    return `/prisoner/${journey.prisonerNumber}/contacts/create/enter-dob/${journey.id}`
  }
  if (currentPage === Page.CREATE_CONTACT_DOB_PAGE) {
    if (journey?.dateOfBirth?.isKnown === 'YES') {
      return `/prisoner/${journey.prisonerNumber}/contacts/create/enter-relationship-comments/${journey.id}`
    }
    if (journey?.dateOfBirth?.isKnown === 'NO') {
      return `/prisoner/${journey.prisonerNumber}/contacts/create/enter-estimated-dob/${journey.id}`
    }
  } else if (currentPage === Page.CREATE_CONTACT_ESTIMATED_DOB_PAGE) {
    return `/prisoner/${journey.prisonerNumber}/contacts/create/enter-relationship-comments/${journey.id}`
  } else if (currentPage === Page.ENTER_RELATIONSHIP_COMMENTS) {
    return `/prisoner/${journey.prisonerNumber}/contacts/create/check-answers/${journey.id}`
  }

  throw new Error(`Couldn't determine next page from (${currentPage}) and journey (${JSON.stringify(journey)})`)
}

export { navigationForAddContactJourney, nextPageForAddContactJourney, AddContactNavigation }
