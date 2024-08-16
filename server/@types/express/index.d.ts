import { HmppsUser } from '../../interfaces/hmppsUser'
import { fieldErrors } from '../../middleware/validationMiddleware'

export declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  interface SessionData {
    returnTo: string
    nowInMinutes: number
    journey: object
    prisonId: string
  }
}

export declare global {
  namespace Express {
    interface User {
      username: string
      token: string
      authSource: string
    }

    interface Request {
      verified?: boolean
      id: string
      logout(done: (err: unknown) => void): void
      systemClientToken: string
    }

    interface Locals {
      user: HmppsUser
      validationErrors?: fieldErrors
    }
  }
}
