import { properCaseFullName, prisonerDatePretty } from '../utils/utils'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'
import PrisonerSearchApiClient from '../data/prisonerSearchApiClient'
import { extractPrisonerNumber } from '../routes/search/validationChecks'

export type PrisonerDetailsItem = {
  html?: string
  text?: string
  classes?: string
  attributes?: {
    'data-test': string
  }
}

export default class PrisonerSearchService {
  private numberOfPages = 1
  private currentPage = 0 // API page number is 0-indexed

  constructor(private readonly prisonerSearchApiClient: PrisonerSearchApiClient) {}

  private getPreviousPage(): number {
    return this.currentPage > 0 ? this.currentPage - 1 : 0
  }

  private getNextPage(): number {
    return this.currentPage < this.numberOfPages - 1 ? this.currentPage + 1 : this.numberOfPages - 1
  }

  async getPrisoners(
    search: string,
    prisonId: string,
    page: number,
    user: Express.User,
  ): Promise<{
    results: Array<PrisonerDetailsItem[]>
    numberOfResults: number
    numberOfPages: number
    next: number
    previous: number
  }> {
    this.currentPage = page - 1
    const { totalPages, totalElements, content } =
      await this.prisonerSearchApiClient.getPrisoners(search, prisonId, this.currentPage, user)

    this.numberOfPages = totalPages
    const nextPage = this.getNextPage()
    const previousPage = this.getPreviousPage()
    const prisonerList: Array<PrisonerDetailsItem[]> = []

    content.forEach((prisoner: Prisoner) => {
      const url = `<a href="#" class="govuk-link--no-visited-state bapv-result-row">${properCaseFullName(`${prisoner.lastName}, ${prisoner.firstName}`)}</a>`
      const row: PrisonerDetailsItem[] = [
        {
          html: url,
        },
        {
          html: prisoner.prisonerNumber,
        },
        {
          html: prisonerDatePretty({ dateToFormat: prisoner.dateOfBirth }),
        },
      ]

      prisonerList.push(row)
    })

    return {
      results: prisonerList,
      numberOfResults: totalElements,
      numberOfPages: this.numberOfPages,
      next: nextPage + 1,
      previous: previousPage + 1,
    }
  }

  async validatePrisonNumber(
    search: string,
    numberOfResults: number,
    prisonName: string,
    user: Express.User,
  ): Promise<string> {
    const validPrisonerNumber = extractPrisonerNumber(search)
    if (numberOfResults === 0 && validPrisonerNumber) {
      return this.getPrisonerNotFoundMessage(validPrisonerNumber, prisonName, user)
    }
    return `There are no results for this name or number at ${prisonName}.`
  }

  async getPrisoner(search: string, prisonId: string, user: Express.User): Promise<Prisoner> {
    const { content } = await this.prisonerSearchApiClient.getPrisoner(search, prisonId, user)
    return content.length === 1 ? content[0] : null
  }

  async getPrisonerById(id: string, user: Express.User): Promise<Prisoner> {
    return this.prisonerSearchApiClient.getPrisonerById(id, user)
  }

  async getPrisonerNotFoundMessage(id: string, prisonName: string, user: Express.User): Promise<string> {
    try {
      const prisoner = await this.prisonerSearchApiClient.getPrisonerById(id, user)
      if (prisoner.inOutStatus === 'OUT' || prisoner.inOutStatus === 'TRN') {
        return `This prisoner is not in ${prisonName}. They might be being moved to another establishment or have been released.`
      }
      if (prisoner.inOutStatus === 'IN') {
        return 'This prisoner is located at another establishment. The visitor should contact the prisoner to find out their location.'
      }
    } catch (error) {
      if (error.status !== 404) {
        throw error
      }
    }
    return 'There are no results for this prison number at any establishment. Check the number is correct and try again.'
  }
}
