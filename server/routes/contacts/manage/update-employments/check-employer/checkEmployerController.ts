import { Request, Response } from 'express'
import { PageHandler } from '../../../../../interfaces/pageHandler'
import { Page } from '../../../../../services/auditService'
import UpdateEmploymentJourneyParams = journeys.UpdateEmploymentJourneyParams
import OrganisationsService from '../../../../../services/organisationsService'
import { IsCorrectEmployerSchema } from './checkEmployerSchema'
import { EmploymentUtils } from '../../../add/employments/common/utils'

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
    const employer = await this.organisationsService.getOrganisation(journey.changeOrganisationId, res.locals.user)
    if (!employer) {
      return res.status(404).render('pages/errors/notFound')
    }

    return res.render('pages/contacts/manage/employments/checkEmployer/index', {
      navigation: {
        backLink: `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-employments/${employmentIdx}/organisation-search/${journeyId}`,
      },
      contactNames: journey.contactNames,
      organisation: employer,
      organisationTypes: employer.organisationTypes
        .map(({ organisationTypeDescription }: { organisationTypeDescription: string }) => organisationTypeDescription)
        .sort((a: string, b: string) => a.localeCompare(b))
        .join('\n'),
      activeAddresses: EmploymentUtils.getActiveAddresses(employer),
      inactiveAddresses: EmploymentUtils.getInactiveAddresses(employer),
      emailAddresses: employer.emailAddresses
        .map(({ emailAddress }: { emailAddress: string }) => emailAddress)
        .join('\n'),
      webAddresses: employer.webAddresses.map(({ webAddress }: { webAddress: string }) => webAddress).join('\n'),
    })
  }

  POST = async (req: Request<UpdateEmploymentJourneyParams, unknown, IsCorrectEmployerSchema>, res: Response) => {
    const { prisonerNumber, contactId, employmentIdx, journeyId } = req.params
    const journey = req.session.updateEmploymentsJourneys![journeyId]!

    if (req.body.isCorrectEmployer === 'NO') {
      delete journey.changeOrganisationId
      return res.redirect(
        `/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-employments/${employmentIdx}/organisation-search/${journeyId}`,
      )
    }

    const employerSummary = await this.organisationsService.getOrganisationSummary(
      journey.changeOrganisationId!,
      res.locals.user,
    )

    if (employmentIdx === 'new') {
      journey.employments.push({
        employer: employerSummary,
        isActive: true,
      })
    } else {
      const idx = Number(employmentIdx) - 1
      journey.employments[idx]!.employer = employerSummary
    }

    return res.redirect(`/prisoner/${prisonerNumber}/contacts/manage/${contactId}/update-employments/${journeyId}`)
  }
}
