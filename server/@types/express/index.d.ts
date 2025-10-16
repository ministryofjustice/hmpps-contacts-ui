import CaseLoad from '@ministryofjustice/hmpps-connect-dps-components/dist/types/CaseLoad'
import { HmppsUser } from '../../interfaces/hmppsUser'
import { fieldErrors } from '../../middleware/validationMiddleware'
import { Prisoner } from '../../data/prisonerOffenderSearchTypes'
import {
  AddContactJourney,
  AddressJourney,
  AddRestrictionJourney,
  ChangeRelationshipTypeJourney,
  ManageContactsJourney,
  PrisonerDetails,
  UpdateEmploymentsJourney,
} from '../journeys'

export declare module 'express-session' {
  interface SessionData {
    returnTo: string
    nowInMinutes: number
    search: string
    addContactJourneys: Record<string, AddContactJourney>
    manageContactsJourneys: Record<string, ManageContactsJourney>
    addRestrictionJourneys: Record<string, AddRestrictionJourney>
    addressJourneys: Record<string, AddressJourney>
    updateEmploymentsJourneys: Record<string, UpdateEmploymentsJourney>
    changeRelationshipTypeJourneys: Record<string, ChangeRelationshipTypeJourney>
    // Caseload details populated by dpsComponents.retrieveCaseLoadData
    caseLoads?: CaseLoad[]
    activeCaseLoad?: CaseLoad
    activeCaseLoadId?: string
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
      middleware?: {
        prisonerData?: Prisoner
      }
    }

    interface Locals {
      user: HmppsUser
      prisonerPermissions?: PrisonerPermissions
      validationErrors?: fieldErrors
      digitalPrisonServicesUrl: string
      prisonerProfileUrl: string
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
      successNotificationBanner?: string | undefined
      formResponses?: { [key: string]: string }
      asset_path: string
      applicationName: string
      environmentName: string
      environmentNameColour: string
      csrfToken: string
      message?: string
      status?: number
      stack?: string | null | undefined
    }
  }
}
