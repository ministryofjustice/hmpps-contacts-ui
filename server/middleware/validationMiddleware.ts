import { NextFunction, Request, Response } from 'express'
import z from 'zod'
import { $ZodSuperRefineIssue } from 'zod/v4/core'
import { PrisonerJourneyParams } from '../@types/journeys'
import logger from '../../logger'

export type fieldErrors = {
  [field: string | number | symbol]: string[] | undefined
}
export const buildErrorSummaryList = (array: fieldErrors) => {
  if (!array) return null
  return Object.entries(array)
    .filter(([_, errors]) => errors)
    .flatMap(([field, errors]) => {
      return errors!
        .filter(([_, error]) => error && error.length > 0)
        .map(error => ({
          text: error,
          href: `#${field}`,
        }))
    })
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
  return async (req: Request<PrisonerJourneyParams> | Request<P>, res: Response, next: NextFunction) => {
    if (!schema) {
      return next()
    }
    const resolvedSchema = typeof schema === 'function' ? await schema(req as Request<P>) : schema
    const result = resolvedSchema.safeParse(req.body)
    if (result.success) {
      req.body = result.data
      return next()
    }
    req.flash('formResponses', JSON.stringify(req.body))

    const deduplicatedFieldErrors = deduplicateFieldErrors(result.error)
    const { journeyId } = req.params
    logger.warn(
      `Validation errors on journey ${journeyId} for user ${res.locals.user?.username}: ${JSON.stringify(deduplicatedFieldErrors)}`,
    )

    req.flash('validationErrors', JSON.stringify(deduplicatedFieldErrors))
    const urlWithDefaultFragmentSoAnyFieldFocusIsRemoved = `${req.originalUrl}#`
    return res.redirect(urlWithDefaultFragmentSoAnyFieldFocusIsRemoved)
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
    if (!res.success) res.error.issues.forEach(issue => ctx.addIssue(issue as $ZodSuperRefineIssue))
    return res.data || val
  }) as unknown as T

const pathArrayToString = (previous: string | number | symbol, next: string | number | symbol): string | number => {
  if (!previous) {
    return next.toString()
  }
  if (typeof next === 'number') {
    return `${String(previous)}[${next.toString()}]`
  }
  return `${String(previous)}.${next.toString()}`
}

export const deduplicateFieldErrors = (error: z.ZodError<unknown>) => {
  const flattened: Record<string, Set<string>> = {}
  error.issues.forEach(issue => {
    // only field issues have a path
    if (issue.path.length > 0) {
      const path = issue.path.reduce(pathArrayToString) as string
      flattened[path] ??= new Set([])
      flattened[path].add(issue.message)
    }
  })
  return Object.fromEntries(
    Object.entries(flattened).map(([key, value]) => [key, [...value].map(o => o.replace(/^Invalid input$/, ''))]),
  )
}
export const customErrorOrderBuilder = (errorSummaryList: { href: string }[], order: string[]) =>
  order.map(key => errorSummaryList.find(error => error.href === `#${key}`)).filter(Boolean)
