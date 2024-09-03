import { Request, Response } from 'express'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { Page } from '../../../../services/auditService'
import { PrisonerSearchService, ContactsService } from '../../../../services'
import logger from '../../../../../logger'

export default class ListContactsController implements PageHandler {
  constructor(
    private readonly prisonerSearchService: PrisonerSearchService,
    private readonly contactsService: ContactsService,
  ) {}

  public PAGE_NAME = Page.LIST_CONTACTS_PAGE

  GET = async (req: Request, res: Response): Promise<void> => {
    const { user } = res.locals
    const { prisoner } = req.query
    const { journeyId } = req.params
    const journey = req.session.manageContactsJourneys[journeyId]

    const prisonerDetails = await this.prisonerSearchService.getByPrisonerNumber(prisoner as string, user)

    journey.prisoner = {
      firstName: prisonerDetails?.firstName,
      lastName: prisonerDetails?.lastName,
      prisonerNumber: prisonerDetails?.prisonerNumber,
      dateOfBirth: prisonerDetails?.dateOfBirth,
      prisonId: prisonerDetails?.prisonId,
      prisonName: prisonerDetails?.prisonName,
    }

    const activeContacts = await this.contactsService.getPrisonerContacts(prisoner as string, true, user)
    const inactiveContacts = await this.contactsService.getPrisonerContacts(prisoner as string, true, user)

    logger.info(`List contacts journey ${JSON.stringify(journey)}`)

    logger.info(`Active contacts ${JSON.stringify(activeContacts)}`)
    logger.info(`Inactive contacts ${JSON.stringify(inactiveContacts)}`)

    res.render('pages/contacts/manage/listContacts', {
      activeContacts,
      inactiveContacts,
      prisonerDetails,
      journey,
    })
  }
}
