import 'reflect-metadata'
import { Request, Response } from 'express'
import populatePrisonerDetailsIfInCaseload from './populatePrisonerDetailsIfInCaseload'
import PrisonerSearchService from '../services/prisonerSearchService'
import AuditService from '../services/auditService'
import TestData from '../routes/testutils/testData'
import { user } from '../routes/testutils/appSetup'
import { PrisonerSearchAddress } from '../data/prisonerOffenderSearchTypes'
import PrisonerDetails = journeys.PrisonerDetails

jest.mock('../services/prisonerSearchService')
jest.mock('../services/auditService')

const prisonerSearchService = new PrisonerSearchService(null) as jest.Mocked<PrisonerSearchService>
const auditService = new AuditService(null) as jest.Mocked<AuditService>

describe('prisonerDetailsMiddleware', () => {
  const prisoner = TestData.prisoner()
  const res = { locals: { user }, render: jest.fn() } as unknown as Response
  let req = {} as Request

  beforeEach(() => {
    delete res.locals.prisonerDetails
    auditService.logAuditEvent.mockResolvedValue(null)
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

    await populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService)(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(prisonerSearchService.getByPrisonerNumber).toHaveBeenCalledWith('A1234BC', user)
    const expectedPrisonerDetails: PrisonerDetails = {
      prisonerNumber: 'A1234BC',
      lastName: 'SMITH',
      firstName: 'JOHN',
      dateOfBirth: '1975-04-02',
      prisonName: 'HMP Hewell',
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
      session: { prisonId: prisoner.prisonId },
    } as Request<{ prisonerNumber: string }>

    await populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService)(req, res, next)

    const expectedPrisonerDetails: PrisonerDetails = {
      prisonerNumber: 'A1234BC',
      lastName: 'SMITH',
      firstName: 'JOHN',
      dateOfBirth: '1975-04-02',
      prisonName: 'HMP Hewell',
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
      session: { prisonId: prisoner.prisonId },
    } as Request<{ prisonerNumber: string }>

    await populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService)(req, res, next)

    const expectedPrisonerDetails: PrisonerDetails = {
      prisonerNumber: 'A1234BC',
      lastName: 'SMITH',
      firstName: 'JOHN',
      dateOfBirth: '1975-04-02',
      prisonName: 'HMP Hewell',
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
      session: { prisonId: prisoner.prisonId },
    } as Request<{ prisonerNumber: string }>

    await populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService)(req, res, next)

    const expectedPrisonerDetails: PrisonerDetails = {
      prisonerNumber: 'A1234BC',
      lastName: 'SMITH',
      firstName: 'JOHN',
      dateOfBirth: '1975-04-02',
      prisonName: 'HMP Hewell',
      cellLocation: '1-1-C-028',
      hasPrimaryAddress: true,
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
      id: '123456',
    } as Request<{ prisonerNumber: string }>

    await populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService)(req, res, next)

    expect(next).toHaveBeenCalledTimes(0)
    expect(res.render).toHaveBeenCalledWith('pages/errors/notFound')
    expect(res.locals.prisonerDetails).toBeUndefined()
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      what: 'NOT_IN_CASELOAD',
      who: user.username,
      correlationId: '123456',
      subjectType: 'PRISONER_NUMBER',
      subjectId: 'A1234BC',
      details: {
        userCurrentPrison: undefined,
        prisonerCurrentPrison: 'HEI',
      },
    })
  })

  it('should redirect to caseload error page if prison id in session does not match prisoners location', async () => {
    const next = jest.fn()
    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(prisoner)

    req = {
      params: {
        prisonerNumber: 'A1234BC',
      },
      session: { prisonId: 'NOT HERE' },
      id: '123456',
    } as Request<{ prisonerNumber: string }>

    await populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService)(req, res, next)

    expect(next).toHaveBeenCalledTimes(0)
    expect(res.render).toHaveBeenCalledWith('pages/errors/notFound')
    expect(res.locals.prisonerDetails).toBeUndefined()
    expect(auditService.logAuditEvent).toHaveBeenCalledWith({
      what: 'NOT_IN_CASELOAD',
      who: user.username,
      correlationId: '123456',
      subjectType: 'PRISONER_NUMBER',
      subjectId: 'A1234BC',
      details: {
        userCurrentPrison: 'NOT HERE',
        prisonerCurrentPrison: 'HEI',
      },
    })
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

    await populatePrisonerDetailsIfInCaseload(prisonerSearchService, auditService)(req, res, next)

    expect(prisonerSearchService.getByPrisonerNumber).toHaveBeenCalledWith('A1234BC', user)
  })
})
