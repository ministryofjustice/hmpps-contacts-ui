import { Request, Response } from 'express'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { Page } from '../../../../../services/auditService'
import UpdateEmploymentJourneyParams = journeys.UpdateEmploymentJourneyParams
import OrganisationsService from '../../../../../services/organisationsService'
import { IsCorrectEmployerSchema } from './checkEmployerSchema'
import OrganisationDetails = organisationsApiClientTypes.OrganisationDetails
import OrganisationSummary = contactsApiClientTypes.OrganisationSummary
import OrganisationAddressDetails = organisationsApiClientTypes.OrganisationAddressDetails
import { organisationAddressSorter } from '../../../../../utils/sorters'

export default class CheckEmployerController implements PageHandler {
  constructor(private readonly organisationsService: OrganisationsService) {}

  public PAGE_NAME = Page.MANAGE_CONTACT_CHECK_EMPLOYER_PAGE

  GET = async (
    req: Request<UpdateEmploymentJourneyParams, unknown, unknown, { organisationId: string }>,
    res: Response,
  ) => {
    const { prisonerNumber, contactId, employmentIdx, journeyId } = req.params
    const journey = req.session.updateEmploymentsJourneys![journeyId]!
    const { organisationId } = req.query

    if (organisationId) {
      const orgIdNumber = Number(organisationId)
      if (!Number.isNaN(orgIdNumber)) {
        journey.changeOrganisationId = orgIdNumber
      }
      return res.redirect(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-employments/${employmentIdx}/check-employer/${journeyId}`,
      )
    }

    if (!journey.changeOrganisationId) {
      return res.status(404).render('pages/errors/notFound')
    }
    journey.changeOrganisation = await this.organisationsService.getOrganisation(
      journey.changeOrganisationId,
      res.locals.user,
    )
    if (!journey.changeOrganisation) {
      return res.status(404).render('pages/errors/notFound')
    }

    return res.render('pages/contacts/manage/employments/checkEmployer/index', {
      navigation: {
        backLink: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-employments/${employmentIdx}/organisation-search/${journeyId}`,
      },
      ...req.params,
      contactNames: journey.contactNames,
      organisation: journey.changeOrganisation,
      organisationTypes: journey.changeOrganisation.organisationTypes
        .map(({ organisationTypeDescription }: { organisationTypeDescription: string }) => organisationTypeDescription)
        .sort((a: string, b: string) => a.localeCompare(b))
        .join('\n'),
      activeAddresses: this.getActiveAddresses(journey.changeOrganisation),
      inactiveAddresses: this.getInactiveAddresses(journey.changeOrganisation),
      emailAddresses: journey.changeOrganisation.emailAddresses
        .map(({ emailAddress }: { emailAddress: string }) => emailAddress)
        .join('\n'),
      webAddresses: journey.changeOrganisation.webAddresses
        .map(({ webAddress }: { webAddress: string }) => webAddress)
        .join('\n'),
    })
  }

  POST = async (req: Request<UpdateEmploymentJourneyParams, unknown, IsCorrectEmployerSchema>, res: Response) => {
    const { prisonerNumber, contactId, employmentIdx, journeyId } = req.params
    const journey = req.session.updateEmploymentsJourneys![journeyId]!

    if (req.body.isCorrectEmployer === 'NO') {
      delete journey.changeOrganisationId
      delete journey.changeOrganisation
      return res.redirect(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-employments/${employmentIdx}/organisation-search/${journeyId}`,
      )
    }

    if (employmentIdx === 'new') {
      journey.employments.push({
        employer: this.summariseOrganisationDetails(journey.changeOrganisation),
        isActive: true,
      })
    } else {
      const idx = Number(employmentIdx) - 1
      journey.employments[idx]!.employer = this.summariseOrganisationDetails(journey.changeOrganisation)
    }
    journey.organisationSearch = { page: 1 }

    return res.redirect(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-employments/${journeyId}`)
  }

  private getActiveAddresses = (organisation: OrganisationDetails) =>
    organisation.addresses
      .filter(({ endDate }: OrganisationAddressDetails) => !endDate || endDate > new Date().toISOString())
      .sort(organisationAddressSorter)

  private getInactiveAddresses = (organisation: OrganisationDetails) =>
    organisation.addresses
      .filter(({ endDate }: OrganisationAddressDetails) => endDate && endDate < new Date().toISOString())
      .sort(organisationAddressSorter)

  private summariseOrganisationDetails = ({
    organisationId,
    organisationName,
    organisationActive,
    addresses,
  }: OrganisationDetails): OrganisationSummary => {
    const activePrimaryAddress = addresses.find(
      ({ primaryAddress, endDate }: OrganisationAddressDetails) =>
        primaryAddress && (!endDate || endDate > new Date().toISOString()),
    )
    const phoneNumber = activePrimaryAddress?.phoneNumbers.find(
      ({ phoneType }: { phoneType: string }) => phoneType === 'BUS',
    )

    const {
      flat,
      property,
      street,
      area,
      cityCode,
      cityDescription,
      countyCode,
      countyDescription,
      postcode,
      countryCode,
      countryDescription,
    } = activePrimaryAddress || {}

    const { phoneNumber: businessPhoneNumber, extNumber: businessPhoneNumberExtension } = phoneNumber || {}

    return {
      organisationId,
      organisationName,
      organisationActive,
      flat,
      property,
      street,
      area,
      cityCode,
      cityDescription,
      countyCode,
      countyDescription,
      postcode,
      countryCode,
      countryDescription,
      businessPhoneNumber,
      businessPhoneNumberExtension,
    }
  }
}
