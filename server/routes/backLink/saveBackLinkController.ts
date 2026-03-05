import { Request, Response } from 'express'
import { BadRequest } from 'http-errors'
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
      throw new BadRequest('Required query parameters missing')
    }

    const registeredService = registeredBackLinkServices.find(services => services.name === service)
    if (!registeredService) throw new BadRequest('Unregistered service for back link')

    // redirectPath is in form /prisoner/:prisonerNumber/contacts/manage/:contactId/relationship/:prisonerContactId
    const prisonerContactId = redirectPath.match(/\/relationship\/(\d+)$/)?.[1]
    if (!prisonerContactId) throw new BadRequest('Invalid redirect path for back link')

    req.session.userBackLink = {
      url: registeredService.hostname + returnPath,
      service: registeredService.name,
      prisonerContactId,
    }

    res.redirect(config.domain + redirectPath)
  }
}
