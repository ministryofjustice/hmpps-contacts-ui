import { v4 as uuidv4 } from 'uuid'
import { Request as ExpressRequest, Response } from 'express'
import { SessionData } from 'express-session'
import { user } from '../../../testutils/appSetup'
import ensureInAddressJourney from './addressesMiddleware'
import resetAllMocks = jest.resetAllMocks

type Request = ExpressRequest<journeys.PrisonerJourneyParams>

describe('ensureInAddressJourney', () => {
  const journeyId = uuidv4()
  let req: Request
  let res: Response
  let next: jest.Mock

  beforeEach(() => {
    resetAllMocks()
    req = {
      params: { journeyId },
      session: {} as Partial<SessionData>,
    } as unknown as Request
    res = { redirect: jest.fn(), render: jest.fn(), locals: { user } } as unknown as Response
    next = jest.fn()
  })
  it('should proceed if the journey is in the session and update the last touched date', () => {
    const lastTouchedBeforeCall = new Date(2020, 1, 1)
    req.session.addressJourneys = {}
    req.session.addressJourneys[journeyId] = {
      id: journeyId,
      lastTouched: lastTouchedBeforeCall.toISOString(),
      contactId: 99,
      prisonerNumber: 'A1324BC',
      isCheckingAnswers: false,
      mode: 'ADD',
      contactNames: {
        lastName: 'Bar',
        firstName: 'Foo',
      },
    }

    ensureInAddressJourney(req, res, next)

    expect(next).toHaveBeenCalledTimes(1)
    expect(new Date(req.session.addressJourneys[journeyId].lastTouched).getTime()).toBeGreaterThan(
      lastTouchedBeforeCall.getTime(),
    )
  })

  it('should render not found if the journey is not in the session', () => {
    req.session.addressJourneys = {}

    ensureInAddressJourney(req, res, next)

    expect(next).toHaveBeenCalledTimes(0)
    expect(res.render).toHaveBeenCalledWith('pages/errors/notFound')
  })

  it('should redirect to start if the journey is not in the session and there are no journeys at all', () => {
    ensureInAddressJourney(req, res, next)

    expect(next).toHaveBeenCalledTimes(0)
    expect(res.render).toHaveBeenCalledWith('pages/errors/notFound')
  })
})
