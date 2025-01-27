import CaseLoad from '@ministryofjustice/hmpps-connect-dps-components/dist/types/CaseLoad'
import { HmppsUser } from '../../interfaces/hmppsUser'
import { fieldErrors } from '../../middleware/validationMiddleware'

export declare module 'express-session' {
  // Declare that the session will potentially contain these additional fields
  import AddContactJourney = journeys.AddContactJourney
  import ManageContactsJourney = journeys.ManageContactsJourney
  import AddRestrictionJourney = journeys.AddRestrictionJourney
  import AddressJourney = journeys.AddressJourney

  interface SessionData {
    returnTo: string
    nowInMinutes: number
    search: string
    addContactJourneys: Record<string, AddContactJourney>
    manageContactsJourneys: Record<string, ManageContactsJourney>
    addRestrictionJourneys: Record<string, AddRestrictionJourney>
    addressJourneys: Record<string, AddressJourney>
    // Caseload details populated by dpsComponents.retrieveCaseLoadData
    caseLoads?: CaseLoad[]
    activeCaseLoad?: CaseLoad
    activeCaseLoadId?: string
  }
}
export declare global {
  namespace Express {
    import PrisonerDetails = journeys.PrisonerDetails
    import StandaloneManageContactJourney = journeys.StandaloneManageContactJourney

    interface User {
      username: string
      token: string
      authSource: string
    }

    interface Request {
      verified?: boolean
      id: string
      logout(done: (err: unknown) => void): void
    }

    interface Locals {
      user: HmppsUser
      validationErrors?: fieldErrors
      digitalPrisonServicesUrl: string
      feComponents?: {
        sharedData?: {
          activeCaseLoad: CaseLoad
          caseLoads: CaseLoad[]
          services: {
            id: string
            heading: string
            description: string
            href: string
            navEnabled: boolean
          }[]
        }
      }
      prisonerDetails?: PrisonerDetails
      successNotificationBanner?: string
      formResponses?: { [key: string]: string }
      asset_path: string
      applicationName: string
      environmentName: string
      environmentNameColour: string
      csrfToken: string
      message?: string
      status?: number
      stack?: string | null
      journey: StandaloneManageContactJourney
    }
  }
}
