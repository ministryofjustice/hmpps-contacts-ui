import { Request, Response, NextFunction } from 'express'

export default class HowToManagePrisonersContactsController {
  GET = async (req: Request, res: Response, _next?: NextFunction): Promise<void> => {
    return res.render('pages/static/howToManagePrisonersContacts', {
      navigation: { breadcrumbs: ['DPS_HOME', 'CONTACTS_HOME_PAGE'] },
    })
  }
}
