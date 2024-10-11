import { Request, Response } from 'express'
import config from '../../../../config'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import { components } from '../../../../@types/contactsApi'
import logger from '../../../../../logger'
import ManageContactsJourney = journeys.ManageContactsJourney
import PrisonerContactSummary = contactsApiClientTypes.PrisonerContactSummary

type PageableObject = components['schemas']['PageableObject']

export default class ListContactsController implements PageHandler {
  constructor(private readonly contactsService: ContactsService) {}

  public PAGE_NAME = Page.LIST_CONTACTS_PAGE

  GET = async (
    req: Request<{ prisonerNumber: string; journeyId?: string }, unknown, unknown>,
    res: Response,
  ): Promise<void> => {
    const { user, prisonerDetails } = res.locals
    const { journeyId, prisonerNumber } = req.params
    const page = Number(req.query.page as unknown) || 0
    const pageSize = config.apis.contactsApi.pageSize || 10

    let journey: ManageContactsJourney
    if (journeyId) {
      journey = req.session.manageContactsJourneys[journeyId]
      journey.prisoner = {
        firstName: prisonerDetails?.firstName,
        lastName: prisonerDetails?.lastName,
        prisonerNumber: prisonerDetails?.prisonerNumber,
        dateOfBirth: prisonerDetails?.dateOfBirth,
        prisonName: prisonerDetails?.prisonName,
      }
    }

    const activeContacts: PrisonerContactSummary = await this.contactsService.getPrisonerContacts(
      prisonerNumber as string,
      true,
      user,
      { page, size: pageSize } as PageableObject,
    )

    const inactiveContacts: PrisonerContactSummary = await this.contactsService.getPrisonerContacts(
      prisonerNumber as string,
      false,
      user,
      { page, size: pageSize } as PageableObject,
    )

    logger.info(JSON.stringify(req.query.page))
    logger.info(JSON.stringify(activeContacts))

    res.render('pages/contacts/manage/listContacts', {
      activeContacts,
      inactiveContacts,
      journey,
      prisonerNumber,
    })
  }
}
