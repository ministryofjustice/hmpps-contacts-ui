import HmppsAuditClient, { AuditEvent } from '../data/hmppsAuditClient'

export enum Page {
  // Home page
  CONTACTS_HOME_PAGE = 'CONTACTS_HOME_PAGE',
  // Create contacts
  CREATE_CONTACT_START_PAGE = 'CREATE_CONTACT_START_PAGE',
  ADD_CONTACT_MODE_PAGE = 'ADD_CONTACT_MODE_PAGE',
  CREATE_CONTACT_NAME_PAGE = 'CREATE_CONTACT_NAME_PAGE',
  CREATE_CONTACT_DOB_PAGE = 'CREATE_CONTACT_DOB_PAGE',
  CREATE_CONTACT_CHECK_ANSWERS_PAGE = 'CREATE_CONTACT_CHECK_ANSWERS_PAGE',
  ADD_CONTACT_CANCEL_PAGE = 'ADD_CONTACT_CANCEL_PAGE',
  // Common contact pages
  SELECT_CONTACT_RELATIONSHIP = 'SELECT_CONTACT_RELATIONSHIP',
  SELECT_EMERGENCY_CONTACT = 'SELECT_EMERGENCY_CONTACT',
  SELECT_NEXT_OF_KIN = 'SELECT_NEXT_OF_KIN',
  SELECT_RELATIONSHIP_TYPE = 'SELECT_RELATIONSHIP_TYPE',
  ENTER_RELATIONSHIP_COMMENTS = 'ENTER_RELATIONSHIP_COMMENTS',
  SUCCESSFULLY_ADDED_CONTACT_PAGE = 'SUCCESSFULLY_ADDED_CONTACT_PAGE',
  // Manage contacts
  CONTACT_SEARCH_PAGE = 'CONTACT_SEARCH_PAGE',
  CONTACT_CONFIRMATION_PAGE = 'CONTACT_CONFIRMATION_PAGE',
  CONTACT_DETAILS_PAGE = 'CONTACT_DETAIL_PAGE',
  EDIT_CONTACT_DETAILS_PAGE = 'EDIT_CONTACT_DETAILS_PAGE',
  EDIT_CONTACT_METHODS_PAGE = 'EDIT_CONTACT_METHODS_PAGE',
  MANAGE_CONTACTS_START_PAGE = 'MANAGE_CONTACTS_START_PAGE',
  MANAGE_LANGUAGE_AND_INTERPRETER_PAGE = 'MANAGE_LANGUAGE_AND_INTERPRETER_PAGE',
  MANAGE_INTERPRETER_PAGE = 'MANAGE_INTERPRETER_PAGE',
  MANAGE_DOMESTIC_STATUS_PAGE = 'MANAGE_DOMESTIC_STATUS_PAGE',
  MANAGE_GENDER_PAGE = 'MANAGE_GENDER_PAGE',
  PRISONER_SEARCH_PAGE = 'PRISONER_SEARCH_PAGE',
  PRISONER_SEARCH_RESULTS_PAGE = 'PRISONER_SEARCH_RESULTS_PAGE',
  MANAGE_CONTACT_ADD_PHONE_PAGE = 'MANAGE_CONTACT_ADD_PHONE_PAGE',
  MANAGE_CONTACT_UPDATE_STAFF_PAGE = 'MANAGE_CONTACT_UPDATE_STAFF_PAGE',
  MANAGE_CONTACT_UPDATE_APPROVED_TO_VISIT_PAGE = 'MANAGE_CONTACT_UPDATE_APPROVED_TO_VISIT_PAGE',
  MANAGE_CONTACT_EDIT_PHONE_PAGE = 'MANAGE_CONTACT_EDIT_PHONE_PAGE',
  MANAGE_CONTACT_DELETE_PHONE_PAGE = 'MANAGE_CONTACT_DELETE_PHONE_PAGE',
  MANAGE_CONTACT_EDIT_IDENTITY_PAGE = 'MANAGE_CONTACT_EDIT_IDENTITY_PAGE',
  MANAGE_CONTACT_ADD_IDENTITY_PAGE = 'MANAGE_CONTACT_ADD_IDENTITY_PAGE',
  MANAGE_CONTACT_DELETE_IDENTITY_PAGE = 'MANAGE_CONTACT_DELETE_IDENTITY_PAGE',
  MANAGE_CONTACT_ADD_EMAIL_ADDRESSES_PAGE = 'MANAGE_CONTACT_ADD_EMAIL_ADDRESSES_PAGE',
  MANAGE_CONTACT_EDIT_EMAIL_ADDRESSES_PAGE = 'MANAGE_CONTACT_EDIT_EMAIL_ADDRESSES_PAGE',
  MANAGE_CONTACT_UPDATE_EMPLOYMENTS_PAGE = 'MANAGE_CONTACT_UPDATE_EMPLOYMENTS_PAGE',
  MANAGE_CONTACT_SEARCH_ORGANISATION_PAGE = 'MANAGE_CONTACT_SEARCH_ORGANISATION_PAGE',
  MANAGE_CONTACT_CHECK_EMPLOYER_PAGE = 'MANAGE_CONTACT_CHECK_EMPLOYER_PAGE',
  MANAGE_CONTACT_EMPLOYMENT_STATUS_PAGE = 'MANAGE_CONTACT_EMPLOYMENT_STATUS_PAGE',
  MANAGE_CONTACT_DELETE_EMPLOYMENT_PAGE = 'MANAGE_CONTACT_DELETE_EMPLOYMENT_PAGE',
  LIST_CONTACTS_PAGE = 'LIST_CONTACTS_PAGE',
  UPDATE_CONTACT_DOB_ENTER_DOB_PAGE = 'UPDATE_CONTACT_DOB_ENTER_DOB_PAGE',
  UPDATE_CONTACT_ENTER_DATE_OF_DEATH_PAGE = 'UPDATE_CONTACT_ENTER_DATE_OF_DEATH_PAGE',
  UPDATE_CONTACT_CONFIRM_DELETE_DATE_OF_DEATH_PAGE = 'UPDATE_CONTACT_CONFIRM_DELETE_DATE_OF_DEATH_PAGE',
  UPDATE_NAME_PAGE = 'UPDATE_NAME_PAGE',
  MANAGE_CONTACT_EDIT_EMERGENCY_STATUS_PAGE = 'MANAGE_CONTACT_EDIT_EMERGENCY_STATUS_PAGE',
  MANAGE_CONTACT_UPDATE_EMERGENCY_CONTACT_OR_NEXT_OF_KIN_PAGE = 'MANAGE_CONTACT_UPDATE_EMERGENCY_CONTACT_OR_NEXT_OF_KIN_PAGE',
  MANAGE_CONTACT_UPDATE_RELATIONSHIP_PAGE = 'MANAGE_CONTACT_UPDATE_RELATIONSHIP_PAGE',
  MANAGE_CONTACT_MANAGE_ADDRESSES_PAGE = 'MANAGE_CONTACT_MANAGE_ADDRESSES_PAGE',
  MANAGE_CONTACT_EDIT_NEXT_OF_KIN_STATUS_PAGE = 'MANAGE_CONTACT_EDIT_NEXT_OF_KIN_STATUS_PAGE',
  MANAGE_CONTACT_EDIT_RELATIONSHIP_STATUS_PAGE = 'MANAGE_CONTACT_EDIT_RELATIONSHIP_STATUS_PAGE',
  MANAGE_CONTACT_DELETE_EMAIL_PAGE = 'MANAGE_CONTACT_DELETE_EMAIL_PAGE',
  MANAGE_CONTACT_EDIT_RELATIONSHIP_COMMENTS_PAGE = 'MANAGE_CONTACT_EDIT_RELATIONSHIP_COMMENTS_PAGE',
  // Restriction
  ADD_RESTRICTION_START_PAGE = 'ADD_RESTRICTION_START_PAGE',
  ENTER_RESTRICTION_PAGE = 'ENTER_RESTRICTION_PAGE',
  ADD_RESTRICTION_CHECK_ANSWERS_PAGE = 'ADD_RESTRICTION_CHECK_ANSWERS_PAGE',
  SUCCESSFULLY_ADDED_RESTRICTION_PAGE = 'SUCCESSFULLY_ADDED_RESTRICTION_PAGE',
  UPDATE_RESTRICTION_PAGE = 'UPDATE_RESTRICTION_PAGE',
  CANCEL_RESTRICTION_PAGE = 'CANCEL_RESTRICTION_PAGE',
  // Address
  ADDRESS_START_PAGE = 'ADDRESS_START_PAGE',
  SELECT_ADDRESS_TYPE_PAGE = 'SELECT_ADDRESS_TYPE_PAGE',
  ENTER_ADDRESS_PAGE = 'ENTER_ADDRESS_PAGE',
  USE_PRISONER_ADDRESS_PAGE = 'USE_PRISONER_ADDRESS_PAGE',
  ENTER_ADDRESS_DATES_PAGE = 'ENTER_ADDRESS_DATES_PAGE',
  SELECT_ADDRESS_FLAGS_PAGE = 'SELECT_ADDRESS_FLAGS_PAGE',
  ENTER_ADDRESS_COMMENTS_PAGE = 'ENTER_ADDRESS_COMMENTS_PAGE',
  ADDRESS_CHECK_ANSWERS_PAGE = 'ADDRESS_CHECK_ANSWERS_PAGE',
  ADD_ADDRESS_PHONE_PAGE = 'ADD_ADDRESS_PHONE_PAGE',
  EDIT_ADDRESS_PHONE_PAGE = 'EDIT_ADDRESS_PHONE_PAGE',
  DELETE_ADDRESS_PHONE_PAGE = 'DELETE_ADDRESS_PHONE_PAGE',
  // Relationship type
  CHANGE_RELATIONSHIP_TYPE_START_PAGE = 'CHANGE_RELATIONSHIP_TYPE_START_PAGE',
  CHANGE_RELATIONSHIP_SELECT_NEW_TYPE_PAGE = 'CHANGE_RELATIONSHIP_SELECT_NEW_TYPE_PAGE',
  CHANGE_RELATIONSHIP_SELECT_NEW_RELATIONSHIP_TO_PRISONER_PAGE = 'CHANGE_RELATIONSHIP_SELECT_NEW_RELATIONSHIP_TO_PRISONER_PAGE',
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
