import { AuditClient } from '@ministryofjustice/hmpps-audit-client'
import AuditService, { Page } from './auditService'

jest.mock('@ministryofjustice/hmpps-audit-client')

describe('Audit service', () => {
  let hmppsAuditClient: jest.Mocked<AuditClient>
  let auditService: AuditService

  beforeEach(() => {
    hmppsAuditClient = new AuditClient(
      { queueUrl: '', region: '', serviceName: '', enabled: true },
      console,
    ) as jest.Mocked<AuditClient>
    auditService = new AuditService(hmppsAuditClient)
  })

  describe('logAuditEvent', () => {
    it('sends audit message using audit client', async () => {
      await auditService.logAuditEvent({
        what: 'AUDIT_EVENT',
        who: 'user1',
        subjectId: 'subject123',
        subjectType: 'CONTACT',
        correlationId: 'request123',
        details: { extraDetails: 'example' },
      })

      expect(hmppsAuditClient.sendMessage).toHaveBeenCalledWith({
        action: 'AUDIT_EVENT',
        who: 'user1',
        subjectId: 'subject123',
        subjectType: 'CONTACT',
        correlationId: 'request123',
        details: { extraDetails: 'example' },
      })
    })

    it('defaults subjectType to NOT_APPLICABLE when not provided', async () => {
      await auditService.logAuditEvent({
        what: 'AUDIT_EVENT',
        who: 'user1',
        correlationId: 'request123',
      })

      expect(hmppsAuditClient.sendMessage).toHaveBeenCalledWith({
        action: 'AUDIT_EVENT',
        who: 'user1',
        subjectId: undefined,
        subjectType: 'NOT_APPLICABLE',
        correlationId: 'request123',
        details: undefined,
      })
    })
  })

  describe('logPageView', () => {
    it('sends page view event audit message using audit client', async () => {
      await auditService.logPageView(Page.CONTACTS_HOME_PAGE, {
        who: 'user1',
        subjectId: 'subject123',
        subjectType: 'CONTACT',
        correlationId: 'request123',
        details: { extraDetails: 'example' },
      })

      expect(hmppsAuditClient.sendMessage).toHaveBeenCalledWith({
        action: 'PAGE_VIEW_CONTACTS_HOME_PAGE',
        who: 'user1',
        subjectId: 'subject123',
        subjectType: 'CONTACT',
        correlationId: 'request123',
        details: { extraDetails: 'example' },
      })
    })
  })
})
