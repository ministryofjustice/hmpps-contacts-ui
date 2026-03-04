import { Request, Response } from 'express'
import config from '../../config'

export type BackLinkService = {
  name: 'prisoner-profile'
  hostname: string
}

export type UserBackLink = {
  url: string
  service: BackLinkService['name']
  prisonerContactId?: string
}

const registeredBackLinkServices: BackLinkService[] = [
  {
    name: 'prisoner-profile',
    hostname: config.serviceUrls.prisonerProfileUrl,
  },
]

export default class SaveBackLinkController {
  GET = (req: Request, res: Response) => {
    const { service, returnPath, redirectPath } = req.query

    if (typeof service !== 'string' || typeof returnPath !== 'string' || typeof redirectPath !== 'string') {
      throw new Error('Required query parameters missing')
    }

    const registeredService = registeredBackLinkServices.find(services => services.name === service)
    if (!registeredService) throw new Error('Unregistered service for back link')

    req.session.userBackLink = {
      url: registeredService.hostname + returnPath,
      service: registeredService.name,
      // redirectPath is in form /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId
      prisonerContactId: redirectPath.split('/relationship/')[1],
    }

    res.redirect(config.domain + redirectPath)
  }
}
