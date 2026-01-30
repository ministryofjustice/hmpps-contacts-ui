import { Request, Response, NextFunction } from 'express'

export default class AccessibilityStatementController {
  GET = async (req: Request, res: Response, _next?: NextFunction): Promise<void> => {
    return res.render('pages/static/accessibilityStatement', {
      navigation: {
        backLink: 'https://dps.prison.service.justice.gov.uk/accessibility-statement',
      },
    })
  }
}
