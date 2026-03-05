import type { Express } from 'express'
import request from 'supertest'
import { SessionData } from 'express-session'
import { appWithAllRoutes } from '../testutils/appSetup'
import config from '../../config'
import { UserBackLink } from './saveBackLinkController'

jest.mock('../../services/auditService')

let app: Express
let session: Partial<SessionData>

beforeEach(() => {
  app = appWithAllRoutes({
    sessionReceiver: (receivedSession: Partial<SessionData>) => {
      session = receivedSession
    },
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /save-backlink', () => {
  it('should save the backlink in session and redirect to the provided path in this service', async () => {
    const backLinkQuery =
      'service=prisoner-profile&' +
      'returnPath=/prisoner/A1234BC/personal%23next-of-kin&' +
      'redirectPath=/prisoner/A1234BC/contacts/manage/123/relationship/456'

    const expectedRedirectPath = `${config.domain}/prisoner/A1234BC/contacts/manage/123/relationship/456`

    const expectedReturnPath = `${config.serviceUrls.prisonerProfileUrl}/prisoner/A1234BC/personal#next-of-kin`

    await request(app).get(`/save-backlink?${backLinkQuery}`).expect(302).expect('Location', expectedRedirectPath)

    expect(session.userBackLink).toStrictEqual<UserBackLink>({
      service: 'prisoner-profile',
      url: expectedReturnPath,
      prisonerContactId: '456',
    })
  })

  it('should throw a Bad Request error if required query parameters missing', async () => {
    const backLinkQuery = 'service=prisoner-profile'

    await request(app)
      .get(`/save-backlink?${backLinkQuery}`)
      .expect(400)
      .expect(res => expect(res.text).toContain('BadRequestError: Required query parameters missing'))

    expect(session.userBackLink).toBeUndefined()
  })

  it('should throw a Bad Request error if an unregistered back link service is specified', async () => {
    const backLinkQuery = 'service=unregistered-service&returnPath=some-path&redirectPath=some-redirect'

    await request(app)
      .get(`/save-backlink?${backLinkQuery}`)
      .expect(400)
      .expect(res => expect(res.text).toContain('BadRequestError: Unregistered service for back link'))

    expect(session.userBackLink).toBeUndefined()
  })

  it('should throw a Bad Request error if an invalid redirect path is specified', async () => {
    const backLinkQuery =
      'service=prisoner-profile&returnPath=some-path&redirectPath=/prisoner/A1234BC/contacts/manage/123/relationship/xyz'

    await request(app)
      .get(`/save-backlink?${backLinkQuery}`)
      .expect(400)
      .expect(res => expect(res.text).toContain('BadRequestError: Invalid redirect path for back link'))

    expect(session.userBackLink).toBeUndefined()
  })
})
