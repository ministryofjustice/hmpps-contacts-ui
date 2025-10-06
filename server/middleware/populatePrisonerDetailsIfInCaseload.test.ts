import 'reflect-metadata'
import { Request as ExpressRequest, Response } from 'express'
import populatePrisonerDetailsIfInCaseload from './populatePrisonerDetailsIfInCaseload'
import TestData from '../routes/testutils/testData'
import RestrictionsTestData from '../routes/testutils/stubRestrictionsData'
import { basicPrisonUser } from '../routes/testutils/appSetup'
import { PrisonerSearchAddress } from '../data/prisonerOffenderSearchTypes'
import { MockedService } from '../testutils/mockedServices'
import { PrisonerDetails } from '../@types/journeys'

jest.mock('../services/prisonerSearchService')
jest.mock('../services/contactsService')

const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()

type Request = ExpressRequest<{ prisonerNumber: string }>

describe('prisonerDetailsMiddleware', () => {
  const prisoner = TestData.prisoner()
  const res = { locals: { user: basicPrisonUser }, render: jest.fn(), status: jest.fn() } as unknown as Response

  let req = {} as Request

  beforeEach(() => {
    delete res.locals.prisonerDetails
    // provide a sensible default so middleware won't throw when awaiting restrictions
    contactsService.getPrisonerRestrictions.mockResolvedValue(RestrictionsTestData.stubRestrictionsData())
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should add prisoner details and call next', async () => {
    const next = jest.fn()
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(prisoner)
    contactsService.getPrisonerRestrictions.mockResolvedValue(RestrictionsTestData.stubRestrictionsData())

    req = {
      params: {
        prisonerNumber: 'A1234BC',
      },
    } as Request

    await populatePrisonerDetailsIfInCaseload(prisonerSearchService, contactsService)(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(prisonerSearchService.getByPrisonerNumber).toHaveBeenCalledWith('A1234BC', basicPrisonUser)
    const expectedPrisonerDetails: PrisonerDetails = {
      prisonerNumber: 'A1234BC',
      lastName: 'SMITH',
      firstName: 'JOHN',
      dateOfBirth: '1975-04-02',
      prisonName: 'HMP Hewell',
      cellLocation: '1-1-C-028',
      hasPrimaryAddress: false,
      alertsCount: 0,
      restrictionsCount: 1,
    }
    expect(res.locals.prisonerDetails).toStrictEqual(expectedPrisonerDetails)
  })

  it('should add prisoner details if no addresses', async () => {
    const next = jest.fn()
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(prisoner)
    prisoner.addresses = []

    req = {
      params: {
        prisonerNumber: 'A1234BC',
      },
    } as Request

    await populatePrisonerDetailsIfInCaseload(prisonerSearchService, contactsService)(req, res, next)

    const expectedPrisonerDetails: PrisonerDetails = {
      prisonerNumber: 'A1234BC',
      lastName: 'SMITH',
      firstName: 'JOHN',
      dateOfBirth: '1975-04-02',
      prisonName: 'HMP Hewell',
      cellLocation: '1-1-C-028',
      hasPrimaryAddress: false,
      alertsCount: 0,
      restrictionsCount: 1,
    }
    expect(res.locals.prisonerDetails).toStrictEqual(expectedPrisonerDetails)
  })

  it('should add prisoner details if no primary addresses', async () => {
    const next = jest.fn()
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(prisoner)
    const prisonerAddress: PrisonerSearchAddress = {
      fullAddress: '12, my street, england',
      primaryAddress: false,
    }
    prisoner.addresses = [prisonerAddress]

    req = {
      params: {
        prisonerNumber: 'A1234BC',
      },
    } as Request

    await populatePrisonerDetailsIfInCaseload(prisonerSearchService, contactsService)(req, res, next)

    const expectedPrisonerDetails: PrisonerDetails = {
      prisonerNumber: 'A1234BC',
      lastName: 'SMITH',
      firstName: 'JOHN',
      dateOfBirth: '1975-04-02',
      prisonName: 'HMP Hewell',
      cellLocation: '1-1-C-028',
      hasPrimaryAddress: false,
      alertsCount: 0,
      restrictionsCount: 1,
    }
    expect(res.locals.prisonerDetails).toStrictEqual(expectedPrisonerDetails)
  })

  it('should add prisoner details if has a primary address', async () => {
    const next = jest.fn()
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(prisoner)
    const prisonerAddress: PrisonerSearchAddress = {
      fullAddress: '12, my street, england',
      primaryAddress: true,
    }
    prisoner.addresses = [prisonerAddress]

    req = {
      params: {
        prisonerNumber: 'A1234BC',
      },
    } as Request

    await populatePrisonerDetailsIfInCaseload(prisonerSearchService, contactsService)(req, res, next)

    const expectedPrisonerDetails: PrisonerDetails = {
      prisonerNumber: 'A1234BC',
      lastName: 'SMITH',
      firstName: 'JOHN',
      dateOfBirth: '1975-04-02',
      prisonName: 'HMP Hewell',
      cellLocation: '1-1-C-028',
      hasPrimaryAddress: true,
      alertsCount: 0,
      restrictionsCount: 1,
    }
    expect(res.locals.prisonerDetails).toStrictEqual(expectedPrisonerDetails)
  })

  it('should deal with problems coming from the service without blowing up', async () => {
    const next = jest.fn()
    const error = new Error('Bang!')
    prisonerSearchService.getByPrisonerNumber.mockRejectedValue(error)

    req = {
      params: {
        prisonerNumber: 'A1234BC',
      },
    } as Request

    await populatePrisonerDetailsIfInCaseload(prisonerSearchService, contactsService)(req, res, next)

    expect(prisonerSearchService.getByPrisonerNumber).toHaveBeenCalledWith('A1234BC', basicPrisonUser)
  })
})
