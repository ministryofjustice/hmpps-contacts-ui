import { NextFunction, Request, Response } from 'express'
import { z, ZodError } from 'zod'

export type fieldErrors = {
  [field: string | number | symbol]: string[] | undefined
}
export const buildErrorSummaryList = (array: fieldErrors) => {
  if (!array) return null
  return Object.entries(array).map(([field, error]) => ({
    text: error?.[0],
    href: `#${field}`,
  }))
}

export const findError = (errors: fieldErrors, fieldName: string) => {
  if (!errors?.[fieldName]) {
    return null
  }
  return {
    text: errors[fieldName]?.[0],
  }
}

export type SchemaFactory<P extends { [key: string]: string }> = (request: Request<P>) => Promise<z.ZodTypeAny>

export const validate = <P extends { [key: string]: string }>(schema: z.ZodTypeAny | SchemaFactory<P>) => {
  return async (req: Request<P>, res: Response, next: NextFunction) => {
    if (!schema) {
      return next()
    }
    const resolvedSchema = typeof schema === 'function' ? await schema(req) : schema
    const result = resolvedSchema.safeParse(req.body)
    if (result.success) {
      req.body = result.data
      return next()
    }
    req.flash('formResponses', JSON.stringify(req.body))

    const deduplicatedFieldErrors = deduplicateFieldErrors(result.error)

    req.flash('validationErrors', JSON.stringify(deduplicatedFieldErrors))
    return res.redirect(req.originalUrl)
  }
}

export const createSchema = <T = object>(shape: T) => zodAlwaysRefine(zObjectStrict(shape))

const zObjectStrict = <T = object>(shape: T) => z.object({ _csrf: z.string().optional(), ...shape }).strict()

/*
 * Ensure that all parts of the schema get tried and can fail before exiting schema checks - this ensures we don't have to
 * have complicated schemas if we want to both ensure the order of fields and have all the schema validation run
 * more info regarding this issue and workaround on: https://github.com/colinhacks/zod/issues/479#issuecomment-2067278879
 */
const zodAlwaysRefine = <T extends z.ZodTypeAny>(zodType: T) =>
  z.any().transform((val, ctx) => {
    const res = zodType.safeParse(val)
    if (!res.success) res.error.issues.forEach(ctx.addIssue)
    return res.data || val
  }) as unknown as T

export const deduplicateFieldErrors = <Result>(error: ZodError) =>
  Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).map(([key, value]) => [
      key,
      [...new Set((value as Array<Result>) || [])],
    ]),
  )

// Handy way to override default messaging with access to the value, e.g., for regex errors
export const makeErrorMap = (messages: {
  [Code in z.ZodIssueCode]?: (value: unknown) => string
}): { errorMap: z.ZodErrorMap } => {
  return {
    errorMap: (issue, ctx) => {
      return {
        message: messages[issue.code]?.(ctx.data) || ctx.defaultError,
      }
    },
  }
}
