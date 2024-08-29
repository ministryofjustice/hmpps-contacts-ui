import { properCaseFullName, prisonerDatePretty } from '../utils/utils'
import { Prisoner } from '../data/prisonerOffenderSearchTypes'
import { HmppsAuthClient, RestClientBuilder } from '../data'
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

  constructor(
    private readonly prisonerSearchApiClientFactory: RestClientBuilder<PrisonerSearchApiClient>,
    private readonly hmppsAuthClient: HmppsAuthClient,
  ) {}

  private getPreviousPage(): number {
    return this.currentPage > 0 ? this.currentPage - 1 : 0
  }

  private getNextPage(): number {
    return this.currentPage < this.numberOfPages - 1 ? this.currentPage + 1 : this.numberOfPages - 1
  }

  async getPrisoners(
    search: string,
    prisonId: string,
    username: string,
    page: number,
  ): Promise<{
    results: Array<PrisonerDetailsItem[]>
    numberOfResults: number
    numberOfPages: number
    next: number
    previous: number
  }> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const prisonerSearchApiClient = this.prisonerSearchApiClientFactory(token)
    this.currentPage = page - 1
    const { totalPages, totalElements, content } = await prisonerSearchApiClient.getPrisoners(
      search,
      prisonId,
      this.currentPage,
    )

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
    username: string,
  ): Promise<string> {
    const validPrisonerNumber = extractPrisonerNumber(search)

    if (numberOfResults === 0 && validPrisonerNumber) {
      return this.getPrisonerNotFoundMessage(validPrisonerNumber, prisonName, username)
    }

    return `There are no results for this name or number at ${prisonName}.`
  }

  async getPrisoner(search: string, prisonId: string, username: string): Promise<Prisoner> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const prisonerSearchApiClient = this.prisonerSearchApiClientFactory(token)
    const { content } = await prisonerSearchApiClient.getPrisoner(search, prisonId)
    return content.length === 1 ? content[0] : null
  }

  async getPrisonerById(id: string, username: string): Promise<Prisoner> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const prisonerSearchClient = this.prisonerSearchApiClientFactory(token)
    return prisonerSearchClient.getPrisonerById(id)
  }

  async getPrisonerNotFoundMessage(id: string, prisonName: string, username: string): Promise<string> {
    const token = await this.hmppsAuthClient.getSystemClientToken(username)
    const prisonerSearchApiClient = this.prisonerSearchApiClientFactory(token)

    try {
      const prisoner = await prisonerSearchApiClient.getPrisonerById(id)
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
