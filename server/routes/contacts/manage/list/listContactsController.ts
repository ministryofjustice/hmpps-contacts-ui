import { Request, Response } from 'express'
import config from '../../../../config'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { ContactsService } from '../../../../services'
import { components } from '../../../../@types/contactsApi'
import ManageContactsJourney = journeys.ManageContactsJourney
import PrisonerContactSummary = contactsApiClientTypes.PrisonerContactSummary
import logger from '../../../../../logger'

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
    const { tab } = req.query
    const page = Number(req.query.page as unknown) || 0
    const pageSize = config.apis.contactsApi.pageSize || 10

    let journey: ManageContactsJourney
    logger.info(JSON.stringify(tab))

    if (journeyId) {
      journey = req.session.manageContactsJourneys[journeyId]
      journey.prisoner = {
        firstName: prisonerDetails?.firstName,
        lastName: prisonerDetails?.lastName,
        prisonerNumber: prisonerDetails?.prisonerNumber,
        dateOfBirth: prisonerDetails?.dateOfBirth,
        prisonName: prisonerDetails?.prisonName,
      }

      if (tab === 'active-contacts') {
        journey.activateListPage = page
      } else if (tab === 'inactive-contacts') {
        journey.inactivateListPage = page
      }
    }

    const activeContacts: PrisonerContactSummary = await this.contactsService.getPrisonerContacts(
      prisonerNumber as string,
      true,
      user,
      { page: journey ? journey.activateListPage : page, size: pageSize } as PageableObject,
    )

    const inactiveContacts: PrisonerContactSummary = await this.contactsService.getPrisonerContacts(
      prisonerNumber as string,
      false,
      user,
      { page: journey ? journey.inactivateListPage : page, size: pageSize } as PageableObject,
    )

    res.render('pages/contacts/manage/listContacts', {
      tab,
      activeContacts,
      inactiveContacts,
      journey,
      prisonerNumber,
    })
  }
}
