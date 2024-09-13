import createError, { BadRequest } from 'http-errors'
import ContactsApiClient from '../data/contactsApiClient'
import ReferenceDataService from './referenceDataService'
import { STUBBED_TITLE_OPTIONS } from '../routes/testutils/stubReferenceData'
import ReferenceCodeType from '../enumeration/referenceCodeType'

jest.mock('../data/contactsApiClient')

describe('referenceDataService', () => {
  const user = { token: 'userToken', username: 'user1' } as Express.User
  let apiClient: jest.Mocked<ContactsApiClient>
  let service: ReferenceDataService
  beforeEach(() => {
    apiClient = new ContactsApiClient() as jest.Mocked<ContactsApiClient>
    service = new ReferenceDataService(apiClient)
  })

  afterEach(() => {
    jest.resetAllMocks()
  })
  describe('getReferenceData', () => {
    it('should get reference data by type', async () => {
      // Given
      apiClient.getReferenceCodes.mockResolvedValue(STUBBED_TITLE_OPTIONS)

      // When
      const created = await service.getReferenceData(ReferenceCodeType.TITLE, user)

      // Then
      expect(created).toStrictEqual(STUBBED_TITLE_OPTIONS)
      expect(apiClient.getReferenceCodes).toHaveBeenCalledWith(ReferenceCodeType.TITLE, user)
    })

    it('should handle a bad request', async () => {
      apiClient.getReferenceCodes.mockRejectedValue(createError.BadRequest())
      await expect(service.getReferenceData(ReferenceCodeType.TITLE, user)).rejects.toBeInstanceOf(BadRequest)
    })
  })

  describe('getReferenceDescriptionForCode', () => {
    it('should get reference description for code by type', async () => {
      // Given
      apiClient.getReferenceCodes.mockResolvedValue(STUBBED_TITLE_OPTIONS)

      // When
      const created = await service.getReferenceDescriptionForCode(ReferenceCodeType.TITLE, 'MR', user)

      // Then
      expect(created).toStrictEqual('Mr')
      expect(apiClient.getReferenceCodes).toHaveBeenCalledWith(ReferenceCodeType.TITLE, user)
    })

    it('should get return empty if no matching code', async () => {
      // Given
      apiClient.getReferenceCodes.mockResolvedValue(STUBBED_TITLE_OPTIONS)

      // When
      const created = await service.getReferenceDescriptionForCode(ReferenceCodeType.TITLE, 'FOO', user)

      // Then
      expect(created).toStrictEqual('')
      expect(apiClient.getReferenceCodes).toHaveBeenCalledWith(ReferenceCodeType.TITLE, user)
    })

    it('should handle a bad request', async () => {
      apiClient.getReferenceCodes.mockRejectedValue(createError.BadRequest())
      await expect(service.getReferenceDescriptionForCode(ReferenceCodeType.TITLE, 'MR', user)).rejects.toBeInstanceOf(
        BadRequest,
      )
    })
  })
})
