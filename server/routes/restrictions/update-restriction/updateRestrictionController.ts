import { Request, Response } from 'express'
import { format } from 'date-fns'
import { Page } from '../../../services/auditService'
import { PageHandler } from '../../../interfaces/pageHandler'
import ReferenceCodeType from '../../../enumeration/referenceCodeType'
import ReferenceDataService from '../../../services/referenceDataService'
import { Navigation } from '../../contacts/common/navigation'
import { maxLengthForRestrictionClass, RestrictionSchemaType } from '../schema/restrictionSchema'
import { formatNameFirstNameFirst } from '../../../utils/formatName'
import { ContactsService, RestrictionsService } from '../../../services'
import ReferenceCode = contactsApiClientTypes.ReferenceCode
import RestrictionClass = journeys.RestrictionClass
import PrisonerContactRestrictionDetails = contactsApiClientTypes.PrisonerContactRestrictionDetails

export default class UpdateRestrictionController implements PageHandler {
  constructor(
    private readonly contactsService: ContactsService,
    private readonly restrictionsService: RestrictionsService,
    private readonly referenceDataService: ReferenceDataService,
  ) {}

  public PAGE_NAME = Page.UPDATE_RESTRICTION_PAGE

  GET = async (
    req: Request<{
      prisonerNumber: string
      contactId: string
      prisonerContactId: string
      restrictionClass: RestrictionClass
      restrictionId: string
    }>,
    res: Response,
  ): Promise<void> => {
    const { contactId, prisonerContactId, restrictionId, restrictionClass } = req.params
    const { user, journey } = res.locals
    await this.contactsService.getContact(Number(contactId), user).then(contact => {
      journey.contactNames = {
        title: contact.title,
        lastName: contact.lastName,
        firstName: contact.firstName,
        middleNames: contact.middleNames,
      }
    })
    journey.restrictionClass = restrictionClass
    journey.contactId = contactId
    let title
    let existingRestriction
    if (restrictionClass === 'PRISONER_CONTACT') {
      title = 'Update a prisoner-contact restriction'
      existingRestriction = await this.contactsService
        .getPrisonerContactRestrictions(Number(prisonerContactId), user)
        .then(restrictions =>
          restrictions.prisonerContactRestrictions.find(
            (restriction: PrisonerContactRestrictionDetails) =>
              restriction.prisonerContactRestrictionId === Number(restrictionId),
          ),
        )
    } else {
      title = `Update a global restriction for contact ${formatNameFirstNameFirst(journey.contactNames!, {
        excludeMiddleNames: true,
      })}`
      existingRestriction = await this.contactsService
        .getGlobalContactRestrictions(Number(contactId), user)
        .then(restrictions =>
          restrictions.find(restriction => restriction.contactRestrictionId === Number(restrictionId)),
        )
    }

    const typeOptions = await this.referenceDataService
      .getReferenceData(ReferenceCodeType.RESTRICTION, user)
      .then(val =>
        this.getSelectedOptions(val, res.locals?.formResponses?.['type'] ?? existingRestriction?.restrictionType),
      )

    const navigation: Navigation = {
      backLink: journey.returnPoint.url,
      cancelButton: journey.returnPoint.url,
    }

    const viewModel = {
      journey,
      typeOptions,
      title,
      type: res.locals?.formResponses?.['type'] ?? existingRestriction?.restrictionType,
      startDate:
        res.locals?.formResponses?.['startDate'] ?? this.formatDateForDatePicker(existingRestriction?.startDate),
      expiryDate:
        res.locals?.formResponses?.['expiryDate'] ?? this.formatDateForDatePicker(existingRestriction?.expiryDate),
      comments: res.locals?.formResponses?.['comments'] ?? existingRestriction?.comments,
      navigation,
      maxCommentLength: maxLengthForRestrictionClass(restrictionClass),
      continueButtonLabel: 'Continue',
    }
    res.render('pages/contacts/restrictions/enterRestriction', viewModel)
  }

  POST = async (
    req: Request<
      {
        journeyId: string
        prisonerNumber: string
        contactId: string
        prisonerContactId: string
        restrictionClass: RestrictionClass
        restrictionId: string
      },
      unknown,
      RestrictionSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { contactId, prisonerContactId, restrictionClass, restrictionId } = req.params
    const { user, journey } = res.locals
    if (restrictionClass === 'PRISONER_CONTACT') {
      await this.restrictionsService
        .updatePrisonerContactRestriction(Number(prisonerContactId), Number(restrictionId), req.body, user)
        .then(_ => req.flash('successNotificationBanner', "You've updated a prisoner-contact restriction"))
    } else {
      await this.restrictionsService
        .updateContactGlobalRestriction(Number(contactId), Number(restrictionId), req.body, user)
        .then(_ => req.flash('successNotificationBanner', "You've updated a global restriction"))
    }
    res.redirect(journey.returnPoint.url)
  }

  private getSelectedOptions(
    options: ReferenceCode[],
    selectedOption?: string,
  ): Array<{
    value: string
    text: string
    selected?: boolean
  }> {
    const mappedOptions = options.map((referenceCode: ReferenceCode) => {
      return {
        text: referenceCode.description,
        value: referenceCode.code,
        selected: referenceCode.code === selectedOption,
      }
    })
    return [{ text: 'Select restriction type', value: '' }, ...mappedOptions]
  }

  private formatDateForDatePicker(date: string | undefined): string | undefined {
    return date ? format(new Date(date), 'dd/MM/yyyy') : undefined
  }
}
