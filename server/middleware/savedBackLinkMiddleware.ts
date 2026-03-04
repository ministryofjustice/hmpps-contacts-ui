import type { RequestHandler } from 'express'

export default function savedBackLinkMiddleware(): RequestHandler {
  return (req, res, next) => {
    const { userBackLink } = req.session
    if (!userBackLink) return next()

    // Keep saved back link if still in a relevant journey and add to res.locals
    if (
      userBackLink.service === 'prisoner-profile' &&
      req.params?.prisonerContactId === userBackLink.prisonerContactId
    ) {
      res.locals.user.backLink = userBackLink
      return next()
    }

    // Otherwise remove it
    delete req.session.userBackLink
    return next()
  }
}
