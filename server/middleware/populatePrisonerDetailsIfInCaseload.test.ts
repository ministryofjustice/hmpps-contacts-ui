import 'reflect-metadata'
import { Request as ExpressRequest, Response } from 'express'
import populatePrisonerDetailsIfInCaseload from './populatePrisonerDetailsIfInCaseload'
import TestData from '../routes/testutils/testData'
import { basicPrisonUser } from '../routes/testutils/appSetup'
import { PrisonerSearchAddress } from '../data/prisonerOffenderSearchTypes'
import { MockedService } from '../testutils/mockedServices'
import { PrisonerDetails } from '../@types/journeys'

jest.mock('../services/prisonerSearchService')

const prisonerSearchService = MockedService.PrisonerSearchService()

type Request = ExpressRequest<{ prisonerNumber: string }>

describe('prisonerDetailsMiddleware', () => {
  const prisoner = TestData.prisoner()
  const resStatus = jest.fn()
  const res = { locals: { user: basicPrisonUser }, render: jest.fn(), status: resStatus } as unknown as Response

  let req = {} as Request

  beforeEach(() => {
    delete res.locals.prisonerDetails
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should add prisoner details and call next if in caseload', async () => {
    const next = jest.fn()
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(prisoner)

    req = {
      params: {
        prisonerNumber: 'A1234BC',
      },
      session: { activeCaseLoadId: prisoner.prisonId },
    } as Request

    await populatePrisonerDetailsIfInCaseload(prisonerSearchService)(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(prisonerSearchService.getByPrisonerNumber).toHaveBeenCalledWith('A1234BC', basicPrisonUser)
    const expectedPrisonerDetails: PrisonerDetails = {
      prisonerNumber: 'A1234BC',
      lastName: 'SMITH',
      firstName: 'JOHN',
      dateOfBirth: '1975-04-02',
      prisonName: 'HMP Hewell',
      prisonId: 'HEI',
      cellLocation: '1-1-C-028',
      hasPrimaryAddress: false,
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
      session: { activeCaseLoadId: prisoner.prisonId },
    } as Request

    await populatePrisonerDetailsIfInCaseload(prisonerSearchService)(req, res, next)

    const expectedPrisonerDetails: PrisonerDetails = {
      prisonerNumber: 'A1234BC',
      lastName: 'SMITH',
      firstName: 'JOHN',
      dateOfBirth: '1975-04-02',
      prisonName: 'HMP Hewell',
      prisonId: 'HEI',
      cellLocation: '1-1-C-028',
      hasPrimaryAddress: false,
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
      session: { activeCaseLoadId: prisoner.prisonId },
    } as Request

    await populatePrisonerDetailsIfInCaseload(prisonerSearchService)(req, res, next)

    const expectedPrisonerDetails: PrisonerDetails = {
      prisonerNumber: 'A1234BC',
      lastName: 'SMITH',
      firstName: 'JOHN',
      dateOfBirth: '1975-04-02',
      prisonName: 'HMP Hewell',
      prisonId: 'HEI',
      cellLocation: '1-1-C-028',
      hasPrimaryAddress: false,
    }
    expect(res.locals.prisonerDetails).toStrictEqual(expectedPrisonerDetails)
  })

  it('should add prisoner details if has a primary addresses', async () => {
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
      session: { activeCaseLoadId: prisoner.prisonId },
    } as Request

    await populatePrisonerDetailsIfInCaseload(prisonerSearchService)(req, res, next)

    const expectedPrisonerDetails: PrisonerDetails = {
      prisonerNumber: 'A1234BC',
      lastName: 'SMITH',
      firstName: 'JOHN',
      dateOfBirth: '1975-04-02',
      prisonName: 'HMP Hewell',
      prisonId: 'HEI',
      cellLocation: '1-1-C-028',
      hasPrimaryAddress: true,
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
      session: {},
    } as Request

    await populatePrisonerDetailsIfInCaseload(prisonerSearchService)(req, res, next)

    expect(prisonerSearchService.getByPrisonerNumber).toHaveBeenCalledWith('A1234BC', basicPrisonUser)
  })
})
