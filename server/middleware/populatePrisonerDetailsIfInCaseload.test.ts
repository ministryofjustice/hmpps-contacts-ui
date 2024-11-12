import 'reflect-metadata'
import { Request, Response } from 'express'
import populatePrisonerDetailsIfInCaseload from './populatePrisonerDetailsIfInCaseload'
import PrisonerSearchService from '../services/prisonerSearchService'
import TestData from '../routes/testutils/testData'
import { user } from '../routes/testutils/appSetup'
import PrisonerDetails = journeys.PrisonerDetails

jest.mock('../services/prisonerSearchService')

const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>

describe('prisonerDetailsMiddleware', () => {
  const prisoner = TestData.prisoner()
  const res = { locals: { user }, render: jest.fn() } as unknown as Response
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
      session: { prisonId: prisoner.prisonId },
    } as Request<{ prisonerNumber: string }>

    await populatePrisonerDetailsIfInCaseload(prisonerSearchService)(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(prisonerSearchService.getByPrisonerNumber).toHaveBeenCalledWith('A1234BC', user)
    const expectedPrisonerDetails: PrisonerDetails = {
      prisonerNumber: 'A1234BC',
      lastName: 'SMITH',
      firstName: 'JOHN',
      dateOfBirth: '1975-04-02',
      prisonName: 'HMP Hewell',
      cellLocation: '1-1-C-028',
    }
    expect(res.locals.prisonerDetails).toStrictEqual(expectedPrisonerDetails)
  })

  it('should redirect to caseload error page if no prison id in session', async () => {
    const next = jest.fn()
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(prisoner)

    req = {
      params: {
        prisonerNumber: 'A1234BC',
      },
      session: { prisonId: undefined },
    } as Request<{ prisonerNumber: string }>

    await populatePrisonerDetailsIfInCaseload(prisonerSearchService)(req, res, next)

    expect(next).toHaveBeenCalledTimes(0)
    expect(res.render).toHaveBeenCalledTimes(1)
    expect(res.locals.prisonerDetails).toBeUndefined()
  })

  it('should redirect to caseload error page if prison id in session does not match prisoners location', async () => {
    const next = jest.fn()
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(prisoner)

    req = {
      params: {
        prisonerNumber: 'A1234BC',
      },
      session: { prisonId: 'NOT HERE' },
    } as Request<{ prisonerNumber: string }>

    await populatePrisonerDetailsIfInCaseload(prisonerSearchService)(req, res, next)

    expect(next).toHaveBeenCalledTimes(0)
    expect(res.render).toHaveBeenCalledTimes(1)
    expect(res.locals.prisonerDetails).toBeUndefined()
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
    } as Request<{ prisonerNumber: string }>

    await populatePrisonerDetailsIfInCaseload(prisonerSearchService)(req, res, next)

    expect(prisonerSearchService.getByPrisonerNumber).toHaveBeenCalledWith('A1234BC', user)
  })
})
