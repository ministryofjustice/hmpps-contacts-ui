import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { SessionData } from 'express-session'
import ensureInAddContactJourney from './addContactMiddleware'

describe('createContactMiddleware', () => {
  describe('ensureInCreateContactJourney', () => {
    const journeyId = uuidv4()
    const prisonerNumber = 'A1234BC'
    let req: Request
    let res: Response
    beforeEach(() => {
      req = {
        params: { journeyId, prisonerNumber },
        session: {} as Partial<SessionData>,
      } as unknown as Request
      res = { redirect: jest.fn() } as unknown as Response
    })

    it('should proceed if the journey is in the session and update the last touched date', () => {
      const next = jest.fn()
      const lastTouchedBeforeCall = new Date(2020, 1, 1)
      req.session.addContactJourneys = {}
      req.session.addContactJourneys[journeyId] = {
        id: journeyId,
        lastTouched: lastTouchedBeforeCall.toISOString(),
        prisonerNumber,
        isCheckingAnswers: false,
        returnPoint: { type: 'PRISONER_CONTACTS', url: '/foo-bar' },
      }
      ensureInAddContactJourney()(req, res, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(new Date(req.session.addContactJourneys[journeyId].lastTouched).getTime()).toBeGreaterThan(
        lastTouchedBeforeCall.getTime(),
      )
    })
    it('should return to start if the journey is not in the session', () => {
      const next = jest.fn()
      req.session.addContactJourneys = {}
      ensureInAddContactJourney()(req, res, next)
      expect(next).toHaveBeenCalledTimes(0)
      expect(res.redirect).toHaveBeenCalledWith(`/prisoner/${prisonerNumber}/contacts/create/start`)
    })
    it('should return to start if no journeys created at all', () => {
      const next = jest.fn()
      ensureInAddContactJourney()(req, res, next)
      expect(next).toHaveBeenCalledTimes(0)
      expect(res.redirect).toHaveBeenCalledWith(`/prisoner/${prisonerNumber}/contacts/create/start`)
    })
  })
})
