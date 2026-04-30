import { Request as ExpressRequest, Response } from 'express'
import populatePrisonerDetailsIfInCaseload from './populatePrisonerDetailsIfInCaseload'
import TestData from '../routes/testutils/testData'
import RestrictionsTestData from '../routes/testutils/stubRestrictionsData'
import { basicPrisonUser } from '../routes/testutils/appSetup'
import { Prisoner, PrisonerSearchAddress } from '../data/prisonerOffenderSearchTypes'
import { MockedService } from '../testutils/mockedServices'
import { PrisonerDetails } from '../@types/journeys'
import pagedPrisonerAlertsData from '../testutils/testPrisonerAlertsData'

jest.mock('../services/prisonerSearchService')
jest.mock('../services/contactsService')
jest.mock('../services/alertsService')

const prisonerSearchService = MockedService.PrisonerSearchService()
const contactsService = MockedService.ContactsService()
const alertsService = MockedService.AlertsService()

type Request = ExpressRequest<{ prisonerNumber: string }>

describe('prisonerDetailsMiddleware', () => {
  let prisoner: Prisoner
  const res = { locals: { user: basicPrisonUser }, render: jest.fn(), status: jest.fn() } as unknown as Response

  let req = {} as Request
  const next = jest.fn()

  beforeEach(() => {
    delete res.locals.prisonerDetails

    prisoner = TestData.prisoner()

    prisonerSearchService.getByPrisonerNumber.mockResolvedValue(prisoner)
    contactsService.getPrisonerRestrictions.mockResolvedValue(RestrictionsTestData.stubRestrictionsData())
    alertsService.getAlerts.mockResolvedValue(pagedPrisonerAlertsData())

    req = {
      params: {
        prisonerNumber: 'A1234BC',
      },
    } as Request
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  it('should add prisoner details and call next', async () => {
    contactsService.getPrisonerRestrictions.mockResolvedValue(RestrictionsTestData.stubRestrictionsData())

    await populatePrisonerDetailsIfInCaseload(prisonerSearchService, contactsService, alertsService)(req, res, next)

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
      alertsCount: 1,
      restrictionsCount: 1,
    }
    expect(res.locals.prisonerDetails).toStrictEqual(expectedPrisonerDetails)
  })

  it('should add prisoner details if no addresses', async () => {
    prisoner.addresses = []

    await populatePrisonerDetailsIfInCaseload(prisonerSearchService, contactsService, alertsService)(req, res, next)

    const expectedPrisonerDetails: PrisonerDetails = {
      prisonerNumber: 'A1234BC',
      lastName: 'SMITH',
      firstName: 'JOHN',
      dateOfBirth: '1975-04-02',
      prisonName: 'HMP Hewell',
      cellLocation: '1-1-C-028',
      hasPrimaryAddress: false,
      alertsCount: 1,
      restrictionsCount: 1,
    }
    expect(res.locals.prisonerDetails).toStrictEqual(expectedPrisonerDetails)
  })

  it('should add prisoner details if no primary addresses', async () => {
    const prisonerAddress: PrisonerSearchAddress = {
      fullAddress: '12, my street, england',
      primaryAddress: false,
    }
    prisoner.addresses = [prisonerAddress]

    await populatePrisonerDetailsIfInCaseload(prisonerSearchService, contactsService, alertsService)(req, res, next)

    const expectedPrisonerDetails: PrisonerDetails = {
      prisonerNumber: 'A1234BC',
      lastName: 'SMITH',
      firstName: 'JOHN',
      dateOfBirth: '1975-04-02',
      prisonName: 'HMP Hewell',
      cellLocation: '1-1-C-028',
      hasPrimaryAddress: false,
      alertsCount: 1,
      restrictionsCount: 1,
    }
    expect(res.locals.prisonerDetails).toStrictEqual(expectedPrisonerDetails)
  })

  it('should add prisoner details if has a primary address', async () => {
    const prisonerAddress: PrisonerSearchAddress = {
      fullAddress: '12, my street, england',
      primaryAddress: true,
    }
    prisoner.addresses = [prisonerAddress]

    await populatePrisonerDetailsIfInCaseload(prisonerSearchService, contactsService, alertsService)(req, res, next)

    const expectedPrisonerDetails: PrisonerDetails = {
      prisonerNumber: 'A1234BC',
      lastName: 'SMITH',
      firstName: 'JOHN',
      dateOfBirth: '1975-04-02',
      prisonName: 'HMP Hewell',
      cellLocation: '1-1-C-028',
      hasPrimaryAddress: true,
      alertsCount: 1,
      restrictionsCount: 1,
    }
    expect(res.locals.prisonerDetails).toStrictEqual(expectedPrisonerDetails)
  })

  it('should handle alerts API failure', async () => {
    alertsService.getAlerts.mockRejectedValue(new Error())

    await populatePrisonerDetailsIfInCaseload(prisonerSearchService, contactsService, alertsService)(req, res, next)

    expect(res.locals.prisonerDetails!.alertsCount).toBeNull()
    expect(res.locals.prisonerDetails!.restrictionsCount).toBe(1)
  })

  it('should propagate errors (to be handled by the error middleware)', async () => {
    const error = new Error('Bang!')
    prisonerSearchService.getByPrisonerNumber.mockRejectedValue(error)

    await expect(
      populatePrisonerDetailsIfInCaseload(prisonerSearchService, contactsService, alertsService)(req, res, next),
    ).rejects.toThrow(error)
  })
})
