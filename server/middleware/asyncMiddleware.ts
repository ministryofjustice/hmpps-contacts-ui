import type { Request, Response, NextFunction, RequestHandler } from 'express'
import { ParamsDictionary } from 'express-serve-static-core'

interface ParsedQs {
  [key: string]: undefined | string | ParsedQs | (ParsedQs | string)[]
}

export default function asyncMiddleware<P extends ParamsDictionary, ResBody, ReqBody, Qs extends ParsedQs>(
  fn: RequestHandler<P, ResBody, ReqBody, Qs>,
) {
  return (req: Request<P, ResBody, ReqBody, Qs>, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}
