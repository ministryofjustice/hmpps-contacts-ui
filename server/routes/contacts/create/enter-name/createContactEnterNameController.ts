import { Request, Response } from 'express'
import { Page } from '../../../../services/auditService'
import { PageHandler } from '../../../../interfaces/pageHandler'
import { CreateContactEnterNameSchemaType } from './createContactEnterNameSchemas'

export default class EnterNameController implements PageHandler {
  public PAGE_NAME = Page.CREATE_CONTACT_NAME_PAGE

  private TITLES = [
    { value: '', text: '' },
    { value: 'DAME', text: 'Dame' },
    { value: 'FR', text: 'Father' },
    { value: 'LORD', text: 'Lord' },
    { value: 'MS', text: 'Ms' },
    { value: 'RABBI', text: 'Rabbi' },
    { value: 'REV', text: 'Reverend' },
    { value: 'SIR', text: 'Sir' },
    { value: 'SR', text: 'Sister' },
    { value: 'MR', text: 'Mr' },
    { value: 'BR', text: 'Brother' },
    { value: 'DR', text: 'Dr' },
    { value: 'LADY', text: 'Lady' },
    { value: 'MISS', text: 'Miss' },
    { value: 'MRS', text: 'Mrs' },
    { value: 'IMAM', text: 'Imam' },
  ]

  GET = async (req: Request, res: Response): Promise<void> => {
    const { journeyId } = req.params
    const journey = req.session.createContactJourneys[journeyId]

    const viewModel = {
      journey,
      titleOptions: this.getSelectedTitleOptions(res.locals?.formResponses?.title ?? journey?.names?.title),
      lastName: res.locals?.formResponses?.lastName ?? journey?.names?.lastName,
      firstName: res.locals?.formResponses?.firstName ?? journey?.names?.firstName,
      middleName: res.locals?.formResponses?.middleName ?? journey?.names?.middleName,
    }
    res.render('pages/contacts/create/enterName', viewModel)
  }

  POST = async (
    req: Request<
      {
        journeyId: string
      },
      unknown,
      CreateContactEnterNameSchemaType
    >,
    res: Response,
  ): Promise<void> => {
    const { journeyId } = req.params
    const { title, lastName, firstName, middleName } = req.body
    const journey = req.session.createContactJourneys[journeyId]
    journey.names = { title, lastName, firstName, middleName }
    if (journey.isCheckingAnswers) {
      res.redirect(`/contacts/create/check-answers/${journeyId}`)
    } else {
      res.redirect(`/contacts/create/enter-dob/${journeyId}`)
    }
  }

  private getSelectedTitleOptions(selectedTitle?: string): Array<{ value: string; text: string; selected: boolean }> {
    return this.TITLES.map((title: { value: string; text: string }) => {
      return { ...title, selected: title.value === selectedTitle }
    })
  }
}
