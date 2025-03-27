import { Request as ExpressRequest, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { SessionData } from 'express-session'
import ensureInAddRestrictionJourney from './addRestrictionMiddleware'
import { user } from '../testutils/appSetup'

type Request = ExpressRequest<{
  journeyId: string
  prisonerNumber: string
  contactId: string
  prisonerContactId: string
  restrictionClass: journeys.RestrictionClass
}>

describe('addRestrictionMiddleware', () => {
  describe('ensureInAddRestrictionJourney', () => {
    const journeyId = uuidv4()
    const prisonerNumber = 'A1234BC'
    const contactId = 999
    const prisonerContactId = 777
    const restrictionClass = 'PRISONER_CONTACT'
    let req: Request
    let res: Response
    let status: jest.Mock
    let render: jest.Mock
    let next: jest.Mock
    beforeEach(() => {
      status = jest.fn()
      render = jest.fn()
      next = jest.fn()
      req = {
        params: { journeyId, prisonerNumber, contactId, prisonerContactId, restrictionClass },
        session: {} as Partial<SessionData>,
      } as unknown as Request
      res = { status, render, locals: { user } } as unknown as Response
    })

    it('should proceed if the journey is in the session and update the last touched date', () => {
      const lastTouchedBeforeCall = new Date(2020, 1, 1)
      req.session.addRestrictionJourneys = {}
      req.session.addRestrictionJourneys[journeyId] = {
        id: journeyId,
        lastTouched: lastTouchedBeforeCall.toISOString(),
        prisonerNumber,
        contactId,
        prisonerContactId,
        restrictionClass,
        contactNames: { lastName: 'Last', firstName: 'First' },
      }
      ensureInAddRestrictionJourney()(req, res, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(new Date(req.session.addRestrictionJourneys[journeyId].lastTouched).getTime()).toBeGreaterThan(
        lastTouchedBeforeCall.getTime(),
      )
    })
    it('should return not found if the journey is not in the session', () => {
      status.mockReturnValue(res)
      req.session.addRestrictionJourneys = {}
      ensureInAddRestrictionJourney()(req, res, next)
      expect(next).toHaveBeenCalledTimes(0)
      expect(status).toHaveBeenCalledWith(404)
      expect(render).toHaveBeenCalledWith('pages/errors/notFound')
    })
    it('should return not found if no journeys created at all', () => {
      status.mockReturnValue(res)
      ensureInAddRestrictionJourney()(req, res, next)
      expect(next).toHaveBeenCalledTimes(0)
      expect(status).toHaveBeenCalledWith(404)
      expect(render).toHaveBeenCalledWith('pages/errors/notFound')
    })
  })
})
