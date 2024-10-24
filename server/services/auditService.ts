import HmppsAuditClient, { AuditEvent } from '../data/hmppsAuditClient'

export enum Page {
  // Home page
  CONTACTS_HOME_PAGE = 'CONTACTS_HOME_PAGE',
  // Create contacts
  CREATE_CONTACT_START_PAGE = 'CREATE_CONTACT_START_PAGE',
  ADD_CONTACT_MODE_PAGE = 'ADD_CONTACT_MODE_PAGE',
  CREATE_CONTACT_NAME_PAGE = 'CREATE_CONTACT_NAME_PAGE',
  CREATE_CONTACT_DOB_PAGE = 'CREATE_CONTACT_DOB_PAGE',
  CREATE_CONTACT_ESTIMATED_DOB_PAGE = 'CREATE_CONTACT_ESTIMATED_DOB_PAGE',
  CREATE_CONTACT_CHECK_ANSWERS_PAGE = 'CREATE_CONTACT_CHECK_ANSWERS_PAGE',
  // Common contact pages
  SELECT_CONTACT_RELATIONSHIP = 'SELECT_CONTACT_RELATIONSHIP',
  SELECT_EMERGENCY_CONTACT = 'SELECT_EMERGENCY_CONTACT',
  SELECT_NEXT_OF_KIN = 'SELECT_NEXT_OF_KIN',
  ENTER_RELATIONSHIP_COMMENTS = 'ENTER_RELATIONSHIP_COMMENTS',
  // Manage contacts
  CONTACT_SEARCH_PAGE = 'CONTACT_SEARCH_PAGE',
  CONTACT_CONFIRMATION_PAGE = 'CONTACT_CONFIRMATION_PAGE',
  CONTACT_DETAILS_PAGE = 'CONTACT_DETAIL_PAGE',
  MANAGE_CONTACTS_START_PAGE = 'MANAGE_CONTACTS_START_PAGE',
  PRISONER_SEARCH_PAGE = 'PRISONER_SEARCH_PAGE',
  PRISONER_SEARCH_RESULTS_PAGE = 'PRISONER_SEARCH_RESULTS_PAGE',
  LIST_CONTACTS_PAGE = 'LIST_CONTACTS_PAGE',
}

export interface PageViewEventDetails {
  who: string
  subjectId?: string
  subjectType?: string
  correlationId?: string
  details?: object
}

export default class AuditService {
  constructor(private readonly hmppsAuditClient: HmppsAuditClient) {}

  async logAuditEvent(event: AuditEvent) {
    await this.hmppsAuditClient.sendMessage(event)
  }

  async logPageView(page: Page, eventDetails: PageViewEventDetails) {
    const event: AuditEvent = {
      ...eventDetails,
      what: `PAGE_VIEW_${page}`,
    }
    await this.hmppsAuditClient.sendMessage(event)
  }
}
