import { Readable } from 'stream'
import PrisonApiClient from '../data/prisonApiClient'

export default class PrisonerImageService {
  constructor(private readonly prisonApiClient: PrisonApiClient) {}

  getImage(prisonerNumber: string, user: Express.User): Promise<Readable> {
    return this.prisonApiClient.getImage(prisonerNumber, user)
  }
}
