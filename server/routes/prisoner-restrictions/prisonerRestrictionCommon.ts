import { Response } from 'express'
import { format } from 'date-fns'
import { formatNameFirstNameFirst } from '../../utils/formatName'

export type PrisonerParams = { prisonerNumber: string }
export type RestrictionParams = PrisonerParams & { prisonerRestrictionId: string }

export const MAX_COMMENT_LENGTH = 240
export const formatDateForDatePicker = (date?: string) => (date ? format(new Date(date), 'dd/MM/yyyy') : undefined)
export const prisonerName = (res: Response) =>
  formatNameFirstNameFirst(res.locals.prisonerDetails!, { excludeMiddleNames: true })
