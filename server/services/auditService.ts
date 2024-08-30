import HmppsAuditClient, { AuditEvent } from '../data/hmppsAuditClient'

export enum Page {
  EXAMPLE_PAGE = 'EXAMPLE_PAGE',
  SEARCH_PRISONERS_PAGE = 'SEARCH_PRISONERS_PAGE',
  SEARCH_PRISONER_CONTACT_PAGE = 'SEARCH_PRISONER_CONTACT_PAGE',
  CREATE_CONTACT_START_PAGE = 'CREATE_CONTACT_START_PAGE',
  CREATE_CONTACT_NAME_PAGE = 'CREATE_CONTACT_NAME_PAGE',
  CREATE_CONTACT_DOB_PAGE = 'CREATE_CONTACT_DOB_PAGE',
  CREATE_CONTACT_SUCCESS_PAGE = 'CREATE_CONTACT_SUCCESS_PAGE',
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
