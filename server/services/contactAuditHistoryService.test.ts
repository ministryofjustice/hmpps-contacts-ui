import ContactsApiClient from '../data/contactsApiClient'
import ContactAuditHistoryService from './contactAuditHistoryService'
import { ContactAuditEntry } from '../@types/contactsApiClient'
import { HmppsUser } from '../interfaces/hmppsUser'

jest.mock('../data/contactsApiClient')

describe('ContactAuditHistoryService', () => {
  const user = { token: 'userToken', username: 'user1' } as HmppsUser
  let apiClient: jest.Mocked<ContactsApiClient>
  let service: ContactAuditHistoryService

  beforeEach(() => {
    apiClient = new ContactsApiClient() as jest.Mocked<ContactsApiClient>
    service = new ContactAuditHistoryService(apiClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('returns empty history when only one revision exists', async () => {
    const singleRevision = {
      revisionId: 7,
      revisionType: 'MOD',
      revisionTimestamp: '2025-11-19T12:09:56.705629',
      username: 'PBALASURIYA',
      id: 8,
      lastName: 'Eight',
      firstName: 'Harry',
      middleNames: 'Middle',
      dateOfBirth: '2015-12-23',
      isStaff: false,
      isRemitter: false,
      genderCode: 'M',
      domesticStatusCode: 'S',
      languageCode: 'ENG',
      interpreterRequired: false,
      createdBy: 'TIM',
      createdTime: '2025-11-18T15:55:31.549464',
      updatedBy: 'PBALASURIYA',
      updatedTime: '2025-11-19T12:09:56.700724',
    } as unknown as ContactAuditEntry

    apiClient.getContactHistory.mockResolvedValue([singleRevision])

    const result = await service.getNameChangeHistory('8', user)

    expect(result).toEqual([])
    expect(apiClient.getContactHistory).toHaveBeenCalledWith(8, user)
  })

  it('detects a name change between consecutive revisions and maps audit fields', async () => {
    // older revision (previous values)
    const older = {
      revisionId: 6,
      revisionType: 'MOD',
      revisionTimestamp: '2025-11-18T15:55:31.549464',
      username: 'TIM',
      id: 8,
      lastName: 'Eight',
      firstName: 'Harry',
      middleNames: 'Middle',
      dateOfBirth: '2015-12-23',
      isStaff: false,
      isRemitter: false,
      genderCode: 'M',
      domesticStatusCode: 'S',
      languageCode: 'ENG',
      interpreterRequired: false,
      createdBy: 'TIM',
      createdTime: '2025-11-18T15:55:31.549464',
    } as unknown as ContactAuditEntry

    // newer revision (current values)
    const newer = {
      revisionId: 7,
      revisionType: 'MOD',
      revisionTimestamp: '2025-11-19T12:09:56.705629',
      username: 'PBALASURIYA',
      id: 8,
      lastName: 'Nine',
      firstName: 'Harry',
      middleNames: 'Middle',
      dateOfBirth: '2015-12-23',
      isStaff: false,
      isRemitter: false,
      genderCode: 'M',
      domesticStatusCode: 'S',
      languageCode: 'ENG',
      interpreterRequired: false,
      createdBy: 'TIM',
      createdTime: '2025-11-18T15:55:31.549464',
      updatedBy: 'PBALASURIYA',
      updatedTime: '2025-11-19T12:09:56.700724',
    } as unknown as ContactAuditEntry

    // Provide in reverse chronological order to exercise sorting logic
    apiClient.getContactHistory.mockResolvedValue([older, newer])

    const result = await service.getNameChangeHistory('8', user)

    expect(result).toEqual([
      {
        newFirstName: 'Harry',
        newMiddleNames: 'Middle',
        newLastName: 'Nine',
        previousFirstName: 'Harry',
        previousMiddleNames: 'Middle',
        previousLastName: 'Eight',
        updatedBy: 'PBALASURIYA',
        changedOn: '2025-11-19T12:09:56.700724',
      },
    ])
    expect(apiClient.getContactHistory).toHaveBeenCalledWith(8, user)
  })

  it('uses fallback fields for updatedBy and changedOn when updatedBy/updatedTime are missing', async () => {
    const older = {
      id: 8,
      lastName: 'Eight',
      firstName: 'Harry',
      middleNames: 'Middle',
      createdBy: 'CREATOR',
      createdTime: '2025-11-18T10:00:00.000000',
    } as unknown as ContactAuditEntry

    const newerNoUpdatedFields = {
      id: 8,
      lastName: 'Changed',
      firstName: 'Harry',
      middleNames: 'Middle',
      username: 'EDITOR_USERNAME',
      revisionTimestamp: '2025-11-19T12:00:00.000000',
      // intentionally no updatedBy or updatedTime
    } as unknown as ContactAuditEntry

    apiClient.getContactHistory.mockResolvedValue([older, newerNoUpdatedFields])

    const result = await service.getNameChangeHistory('8', user)

    expect(result).toEqual([
      {
        newFirstName: 'Harry',
        newMiddleNames: 'Middle',
        newLastName: 'Changed',
        previousFirstName: 'Harry',
        previousMiddleNames: 'Middle',
        previousLastName: 'Eight',
        updatedBy: 'EDITOR_USERNAME',
        changedOn: '2025-11-19T12:00:00.000000',
      },
    ])
  })

  it('returns empty list when names have not changed across revisions', async () => {
    const older = {
      id: 8,
      lastName: 'Eight',
      firstName: 'Harry',
      middleNames: 'Middle',
      revisionTimestamp: '2025-11-18T15:55:31.549464',
    } as unknown as ContactAuditEntry

    const newer = {
      id: 8,
      lastName: 'Eight',
      firstName: 'Harry',
      middleNames: 'Middle',
      updatedTime: '2025-11-19T12:09:56.700724',
    } as unknown as ContactAuditEntry

    apiClient.getContactHistory.mockResolvedValue([newer, older])

    const result = await service.getNameChangeHistory('8', user)

    expect(result).toEqual([])
  })
})
