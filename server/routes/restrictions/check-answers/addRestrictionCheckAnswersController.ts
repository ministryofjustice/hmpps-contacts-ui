import { Request, Response } from 'express'
import { parse } from 'date-fns'
import { Page } from '../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../services/referenceDataService'
import { Navigation } from '../../contacts/common/navigation'
import { RestrictionSchemaType } from '../schema/restrictionSchema'
import RestrictionsService from '../../../services/restrictionsService'

export default class AddRestrictionCheckAnswersController implements PageHandler {
  constructor(
    private readonly referenceDataService: ReferenceDataService,
    private readonly restrictionsService: RestrictionsService,
  ) {}

  public PAGE_NAME = Page.ADD_RESTRICTION_CHECK_ANSWERS_PAGE

  GET = async (
    req: Request<{
      journeyId: string
      prisonerNumber: string
      contactId: string
      prisonerContactId: string
      restrictionClass: string
    }>,
    res: Response,
  ): Promise<void> => {
    const { journeyId, prisonerNumber, contactId, prisonerContactId, restrictionClass } = req.params
    const { user } = res.locals
    const journey = req.session.addRestrictionJourneys![journeyId]!
    const changeUrl = `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/${restrictionClass}/enter-restriction/${journeyId}`
    const navigation: Navigation = {
      backLink: changeUrl,
      cancelButton: `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/${restrictionClass}/cancel/${journeyId}`,
    }

    const restrictionDescription = await this.referenceDataService.getReferenceDescriptionForCode(
      ReferenceCodeType.RESTRICTION,
      journey.restriction!.type,
      user,
    )
    const startDate = parse(journey.restriction!.startDate!, 'dd/MM/yyyy', new Date())
    let expiryDate
    if (journey.restriction!.expiryDate) {
      expiryDate = parse(journey.restriction!.expiryDate, 'dd/MM/yyyy', new Date())
    }
    const viewModel = {
      journey,
      navigation,
      restrictionDescription,
      changeUrl,
      startDate,
      expiryDate,
    }
    res.render('pages/contacts/restrictions/addRestrictionCheckAnswers', viewModel)
  }

  POST = async (
    req: Request<
      {
        journeyId: string
        prisonerNumber: string
        contactId: string
        prisonerContactId: string
        restrictionClass: string
      },
      unknown,
      RestrictionSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { journeyId, prisonerNumber, contactId, prisonerContactId, restrictionClass } = req.params
    const { user } = res.locals
    const journey = req.session.addRestrictionJourneys![journeyId]!
    await this.restrictionsService
      .createRestriction(journey, user, req.id)
      .then(_ => delete req.session.addRestrictionJourneys![journeyId])
    res.redirect(
      `/prisoner/${prisonerNumber}/contacts/${contactId}/relationship/${prisonerContactId}/restriction/add/${restrictionClass}/success`,
    )
  }
}
