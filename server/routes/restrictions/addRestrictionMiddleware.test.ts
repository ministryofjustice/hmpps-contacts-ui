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
    beforeEach(() => {
      req = {
        params: { journeyId, prisonerNumber, contactId, prisonerContactId, restrictionClass },
        session: {} as Partial<SessionData>,
      } as unknown as Request
      res = { redirect: jest.fn(), locals: { user } } as unknown as Response
    })

    it('should proceed if the journey is in the session and update the last touched date', () => {
      const next = jest.fn()
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
        returnPoint: { url: '/foo-bar' },
      }
      ensureInAddRestrictionJourney()(req, res, next)
      expect(next).toHaveBeenCalledTimes(1)
      expect(new Date(req.session.addRestrictionJourneys[journeyId].lastTouched).getTime()).toBeGreaterThan(
        lastTouchedBeforeCall.getTime(),
      )
    })
    it('should return to start if the journey is not in the session', () => {
      const next = jest.fn()
      req.session.addRestrictionJourneys = {}
      ensureInAddRestrictionJourney()(req, res, next)
      expect(next).toHaveBeenCalledTimes(0)
      expect(res.redirect).toHaveBeenCalledWith(
        `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/${restrictionClass}/start`,
      )
    })
    it('should return to start if no journeys created at all', () => {
      const next = jest.fn()
      ensureInAddRestrictionJourney()(req, res, next)
      expect(next).toHaveBeenCalledTimes(0)
      expect(res.redirect).toHaveBeenCalledWith(
        `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/${restrictionClass}/start`,
      )
    })
  })
})
