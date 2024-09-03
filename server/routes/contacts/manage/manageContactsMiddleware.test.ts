import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { SessionData } from 'express-session'
import ensureInManageContactsJourney from './manageContactsMiddleware'

describe('manageContactsMiddleware', () => {
  describe('ensureInManageContactsJourney', () => {
    const journeyId = uuidv4()
    let req: Request
    let res: Response

    beforeEach(() => {
      req = {
        params: { journeyId },
        session: {} as Partial<SessionData>,
      } as unknown as Request
      res = { redirect: jest.fn() } as unknown as Response
    })

    it('should proceed if the journey is in the session and update the last touched date', () => {
      const next = jest.fn()
      const lastTouchedBeforeCall = new Date(2020, 1, 1)
      req.session.manageContactsJourneys = {}
      req.session.manageContactsJourneys[journeyId] = { id: journeyId, lastTouched: lastTouchedBeforeCall }

      ensureInManageContactsJourney()(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      expect(req.session.manageContactsJourneys[journeyId].lastTouched.getTime()).toBeGreaterThan(
        lastTouchedBeforeCall.getTime(),
      )
    })

    it('should return to start if the journey is not in the session', () => {
      const next = jest.fn()
      req.session.manageContactsJourneys = {}

      ensureInManageContactsJourney()(req, res, next)

      expect(next).toHaveBeenCalledTimes(0)
      expect(res.redirect).toHaveBeenCalledWith('/contacts/manage/start')
    })

    it('should return to start if no journeys at all', () => {
      const next = jest.fn()

      ensureInManageContactsJourney()(req, res, next)

      expect(next).toHaveBeenCalledTimes(0)
      expect(res.redirect).toHaveBeenCalledWith('/contacts/manage/start')
    })
  })
})
