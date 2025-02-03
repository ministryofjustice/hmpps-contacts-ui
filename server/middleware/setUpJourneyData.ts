import { NextFunction, Request, Response } from 'express'
import { v4 as uuidv4 } from 'uuid'
import TokenStore from '../data/tokenStore/tokenStore'
import JourneyData = journeys.JourneyData

const JOURNEY_EXPIRE_TIME_IN_SECONDS = 20 * 60 * 60

export default function setUpJourneyData(store: TokenStore) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const journeyId = req.params['journeyId'] ?? uuidv4()
    const journeyTokenKey = `journey.${req.user?.username}.${journeyId}`

    const cached = await store.getToken(journeyTokenKey)
    req.journey = cached ? (JSON.parse(cached) as JourneyData) : (req.journey ?? { journeyId })
    res.prependOnceListener('close', async () => {
      await store.setToken(
        journeyTokenKey,
        JSON.stringify(req.journey ?? { journeyId }),
        JOURNEY_EXPIRE_TIME_IN_SECONDS,
      )
    })
    next()
  }
}
