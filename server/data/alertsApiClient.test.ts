import nock from 'nock'
import { AuthenticationClient, InMemoryTokenStore } from '@ministryofjustice/hmpps-auth-clients'
import AlertsApiClient from './alertsApiClient'
import config from '../config'
import pagedPrisonerAlertsData from '../testutils/testPrisonerAlertsData'

jest.mock('./tokenStore/inMemoryTokenStore')

const user = { token: 'userToken', username: 'user1' } as Express.User

describe('Alerts api client tests', () => {
  let fakeAlertsApi: nock.Scope
  let alertsApiClient: AlertsApiClient

  beforeEach(() => {
    fakeAlertsApi = nock(config.apis.alertsApi.url)
    alertsApiClient = new AlertsApiClient(new AuthenticationClient(config.apis.hmppsAuth, console))
    jest.spyOn(InMemoryTokenStore.prototype, 'getToken').mockResolvedValue('systemToken')
  })

  afterEach(() => {
    jest.resetAllMocks()
    if (!nock.isDone()) {
      nock.cleanAll()
      throw new Error('Not all nock interceptors were used!')
    }
    nock.abortPendingRequests()
    nock.cleanAll()
  })

  it('Get alerts for a prisoner', async () => {
    const alert = pagedPrisonerAlertsData()

    fakeAlertsApi.get('/prisoners/A1234BC/alerts').matchHeader('authorization', `Bearer systemToken`).reply(200, alert)
    const result = await alertsApiClient.getAllAlerts('A1234BC', user)

    expect(result).toEqual(alert)
  })
})
