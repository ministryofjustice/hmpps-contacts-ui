import type { RequestHandler } from 'express'
import asyncMiddleware from './asyncMiddleware'

export default function populateSelectedEstablishment(): RequestHandler {
  return asyncMiddleware(async (req, res, next) => {
    // Populates the user's active caseload ID on the session - from hmpps-micro-frontend-components
    if (res.locals.feComponentsMeta != null) {
      const { activeCaseLoad } = res.locals.feComponentsMeta
      req.session.prisonId = activeCaseLoad.caseLoadId
      req.session.prisonName = activeCaseLoad.description
    }

    return next()
  })
}
