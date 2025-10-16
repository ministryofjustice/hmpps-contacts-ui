import type { Express } from 'express'
import request from 'supertest'
import { Readable } from 'stream'
import { appWithAllRoutes, basicPrisonUser } from '../testutils/appSetup'
import PrisonerImageService from '../../services/prisonerImageService'
import { MockedService } from '../../testutils/mockedServices'

jest.mock('../../services/prisonerImageService')
jest.mock('../../services/contactsService')
jest.mock('../../services/alertsService')

const contactsService = MockedService.ContactsService()
const alertsService = MockedService.AlertsService()
// @ts-expect-error pass null param into mocked service
const prisonerImageService = new PrisonerImageService(null) as jest.Mocked<PrisonerImageService>

let app: Express

beforeEach(() => {
  app = appWithAllRoutes({
    services: {
      prisonerImageService,
      contactsService,
      alertsService,
    },
    userSupplier: () => basicPrisonUser,
  })
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('GET /prisoner-image/:prisonerNumber', () => {
  it('should get a prisoner image', async () => {
    prisonerImageService.getImage.mockResolvedValue(Readable.from('image'))
    const response = await request(app).get(`/prisoner-image/A1111AA`)
    expect(response.status).toEqual(200)
    expect(response.body).toEqual(Buffer.from('image'))
    expect(prisonerImageService.getImage).toHaveBeenCalledWith('A1111AA', basicPrisonUser)
  })

  it('should return a placeholder image when the service fails', async () => {
    prisonerImageService.getImage.mockRejectedValue(Readable.from('rejected'))
    const response = await request(app).get(`/prisoner-image/A1111AA`)
    expect(response.status).toEqual(200)
    expect(response.body).not.toEqual(Buffer.from('rejected'))
    expect(prisonerImageService.getImage).toHaveBeenCalledWith('A1111AA', basicPrisonUser)
  })
})
