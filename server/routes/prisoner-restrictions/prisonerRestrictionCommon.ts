import { Response } from 'express'
import { format } from 'date-fns'
import { PrisonerAlertsPermission, PrisonerPermission } from '@ministryofjustice/hmpps-prison-permissions-lib'
import Permission from '../../enumeration/permission'
import { formatNameFirstNameFirst } from '../../utils/formatName'

export type PrisonerParams = { prisonerNumber: string }
export type RestrictionParams = PrisonerParams & { prisonerRestrictionId: string }

// Maintaining restrictions is open to Contacts Authorisers and to users who can update alerts (ROLE_UPDATE_ALERT),
// aligning access with prisoner alerts ahead of restrictions moving into the alerts service
export const MAINTAIN_RESTRICTIONS_PERMISSIONS: PrisonerPermission[] = [
  Permission.edit_contact_restrictions,
  PrisonerAlertsPermission.edit,
]

export const MAX_COMMENT_LENGTH = 240
export const formatDateForDatePicker = (date?: string) => (date ? format(new Date(date), 'dd/MM/yyyy') : undefined)
export const prisonerName = (res: Response) =>
  formatNameFirstNameFirst(res.locals.prisonerDetails!, { excludeMiddleNames: true })
