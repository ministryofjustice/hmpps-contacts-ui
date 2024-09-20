import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../../services/referenceDataService'
import { contactsApiClientTypes } from '../../../../@types/contactsApiClient'
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import { SelectRelationshipSchema } from './selectRelationshipSchemas'
import PrisonerJourneyParams = journeys.PrisonerJourneyParams

export default class SelectRelationshipController implements PageHandler {
  constructor(private readonly referenceDataService: ReferenceDataService) {}

  public PAGE_NAME = Page.SELECT_CONTACT_RELATIONSHIP

  GET = async (req: Request<PrisonerJourneyParams>, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const { user } = res.locals
    const journey = req.session.createContactJourneys[journeyId]
    const relationshipOptions = await this.referenceDataService
      .getReferenceData(ReferenceCodeType.RELATIONSHIP, user)
      .then(val =>
        this.getSelectedRelationshipOptions(
          val,
          res.locals?.formResponses?.relationship ?? journey?.relationship?.type,
        ),
      )
    const viewModel = {
      journey,
      relationshipOptions,
    }
    res.render('pages/contacts/common/selectRelationship', viewModel)
  }

  POST = async (
    req: Request<PrisonerJourneyParams, unknown, SelectRelationshipSchema>,
    res: Response,
  ): Promise<void> => {
    const { journeyId, prisonerNumber } = req.params
    const { relationship } = req.body
    const journey = req.session.createContactJourneys[journeyId]
    if (!journey.relationship) {
      journey.relationship = {}
    }
    journey.relationship.type = relationship
    if (journey.isCheckingAnswers) {
      res.redirect(`/prisoner/${prisonerNumber}/contacts/create/check-answers/${journeyId}`)
    } else {
      res.redirect(`/prisoner/${prisonerNumber}/contacts/create/select-emergency-contact/${journeyId}`)
    }
  }

  private getSelectedRelationshipOptions(
    options: ReferenceCode[],
    selected?: string,
  ): Array<{
    value: string
    text: string
    selected?: boolean
  }> {
    const mappedOptions = options.map((relationship: ReferenceCode) => {
      return {
        text: relationship.description,
        value: relationship.code,
        selected: relationship.code === selected,
      }
    })
    return [{ text: '', value: '' }, ...mappedOptions]
  }
}
