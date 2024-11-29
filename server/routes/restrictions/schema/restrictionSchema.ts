import z from 'zod'
import { Request } from 'express'
import { isValid, parse } from 'date-fns'
import { createSchema, SchemaFactory } from '../../../middleware/validationMiddleware'
import RestrictionClass = journeys.RestrictionClass

const TYPE_REQUIRED_MESSAGE = 'Select the restriction type'
const START_DATE_REQUIRED_MESSAGE = 'Enter the start date for the restriction'
const START_DATE_INVALID_MESSAGE = 'Start date must be a real date'
const EXPIRY_DATE_INVALID_MESSAGE = 'Expiry date must be a real date'

export const restrictionSchema =
  (): SchemaFactory => async (request: Request<{ restrictionClass: RestrictionClass }>) => {
    const { restrictionClass } = request.params
    const maxCommentLength = maxLengthForRestrictionClass(restrictionClass)
    return createSchema({
      type: z.string().trim().min(1, { message: TYPE_REQUIRED_MESSAGE }),
      startDate: z
        .string()
        .trim()
        .min(1, { message: START_DATE_REQUIRED_MESSAGE })
        .pipe(
          z
            .string()
            .refine(val => isValid(parse(val, 'dd/MM/yyyy', new Date())), { message: START_DATE_INVALID_MESSAGE }),
        ),
      expiryDate: z
        .string()
        .trim()
        .optional()
        .transform(value => value?.trim() || undefined)
        .pipe(
          z
            .string()
            .optional()
            .refine(val => !val || isValid(parse(val, 'dd/MM/yyyy', new Date())), {
              message: EXPIRY_DATE_INVALID_MESSAGE,
            }),
        ),
      comments: z
        .string()
        .max(maxCommentLength, `Comment must be ${maxCommentLength} characters or less`)
        .optional()
        .transform(value => value?.trim() || undefined),
    })
  }

export type RestrictionSchemaType = z.infer<Awaited<ReturnType<ReturnType<typeof restrictionSchema>>>>

export const maxLengthForRestrictionClass = (restrictionClass: RestrictionClass) =>
  restrictionClass === 'PRISONER_CONTACT' ? 255 : 240
