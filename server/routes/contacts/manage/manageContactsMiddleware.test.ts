import { Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import { SessionData } from 'express-session'
import ensureInManageContactsJourney from './manageContactsMiddleware'
import resetAllMocks = jest.resetAllMocks

describe('manageContactsMiddleware', () => {
  describe('ensureInManageContactsJourney', () => {
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
      res = { redirect: jest.fn() } as unknown as Response
      next = jest.fn()
    })

    it('should proceed if the journey is in the session and update the last touched date', () => {
      const lastTouchedBeforeCall = new Date(2020, 1, 1)
      req.session.manageContactsJourneys = {}
      req.session.manageContactsJourneys[journeyId] = {
        id: journeyId,
        lastTouched: lastTouchedBeforeCall.toISOString(),
      }

      ensureInManageContactsJourney()(req, res, next)

      expect(next).toHaveBeenCalledTimes(1)
      expect(new Date(req.session.manageContactsJourneys[journeyId].lastTouched).getTime()).toBeGreaterThan(
        lastTouchedBeforeCall.getTime(),
      )
    })

    describe('with no prisoner in context', () => {
      it('should return to start if the journey is not in the session and there is no prisoner param', () => {
        req.session.manageContactsJourneys = {}

        ensureInManageContactsJourney()(req, res, next)

        expect(next).toHaveBeenCalledTimes(0)
        expect(res.redirect).toHaveBeenCalledWith('/contacts/manage/start')
      })

      it('should return to start if no journeys at all and there is no prisoner param', () => {
        ensureInManageContactsJourney()(req, res, next)

        expect(next).toHaveBeenCalledTimes(0)
        expect(res.redirect).toHaveBeenCalledWith('/contacts/manage/start')
      })
    })
    describe('with prisoner in context', () => {
      const prisonerNumber = 'A1234BC'
      it('should redirect to prisoner contact list if the journey is not in the session and there is a prisoner param', () => {
        req.params = { journeyId, prisonerNumber }
        req.session.manageContactsJourneys = {}

        ensureInManageContactsJourney()(req, res, next)

        expect(next).toHaveBeenCalledTimes(0)
        expect(res.redirect).toHaveBeenCalledWith('/prisoner/A1234BC/contacts/list')
      })

      it('should redirect to prisoner contact list if the journey is not in the session and there are no journeys at all', () => {
        req.params = { journeyId, prisonerNumber }
        ensureInManageContactsJourney()(req, res, next)

        expect(next).toHaveBeenCalledTimes(0)
        expect(res.redirect).toHaveBeenCalledWith('/prisoner/A1234BC/contacts/list')
      })
    })
  })
})
