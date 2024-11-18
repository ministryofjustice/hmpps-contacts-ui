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
  MANAGE_SPOKEN_LANGUAGE_PAGE = 'MANAGE_SPOKEN_LANGUAGE_PAGE',
  MANAGE_INTERPRETER_PAGE = 'MANAGE_INTERPRETER_PAGE',
  MANAGE_DOMESTIC_STATUS_PAGE = 'MANAGE_DOMESTIC_STATUS_PAGE',
  MANAGE_GENDER_PAGE = 'MANAGE_GENDER_PAGE',
  PRISONER_SEARCH_PAGE = 'PRISONER_SEARCH_PAGE',
  PRISONER_SEARCH_RESULTS_PAGE = 'PRISONER_SEARCH_RESULTS_PAGE',
  MANAGE_CONTACT_ADD_PHONE_PAGE = 'MANAGE_CONTACT_ADD_PHONE_PAGE',
  MANAGE_CONTACT_UPDATE_STAFF_PAGE = 'MANAGE_CONTACT_UPDATE_STAFF_PAGE',
  MANAGE_CONTACT_EDIT_PHONE_PAGE = 'MANAGE_CONTACT_EDIT_PHONE_PAGE',
  MANAGE_CONTACT_DELETE_PHONE_PAGE = 'MANAGE_CONTACT_DELETE_PHONE_PAGE',
  MANAGE_CONTACT_EDIT_IDENTITY_PAGE = 'MANAGE_CONTACT_EDIT_IDENTITY_PAGE',
  MANAGE_CONTACT_ADD_IDENTITY_PAGE = 'MANAGE_CONTACT_ADD_IDENTITY_PAGE',
  MANAGE_CONTACT_DELETE_IDENTITY_PAGE = 'MANAGE_CONTACT_DELETE_IDENTITY_PAGE',
  MANAGE_CONTACT_ADD_EMAIL_ADDRESSES_PAGE = 'MANAGE_CONTACT_ADD_EMAIL_ADDRESSES_PAGE',
  LIST_CONTACTS_PAGE = 'LIST_CONTACTS_PAGE',
  UPDATE_CONTACT_DOB_ENTER_DOB_PAGE = 'UPDATE_CONTACT_DOB_ENTER_DOB_PAGE',
  UPDATE_CONTACT_DOB_START_PAGE = 'UPDATE_CONTACT_DOB_START_PAGE',
  UPDATE_CONTACT_DOB_ESTIMATED_DOB_PAGE = 'UPDATE_CONTACT_DOB_ESTIMATED_DOB_PAGE',
  UPDATE_CONTACT_DOB_COMPLETE_PAGE = 'UPDATE_CONTACT_DOB_COMPLETE_PAGE',
  UPDATE_ESTIMATED_DOB_PAGE = 'UPDATE_ESTIMATED_DOB_PAGE',
  UPDATE_NAME_PAGE = 'UPDATE_NAME_PAGE',
  MANAGE_CONTACT_EDIT_EMERGENCY_STATUS_PAGE = 'MANAGE_CONTACT_EDIT_EMERGENCY_STATUS_PAGE',
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
