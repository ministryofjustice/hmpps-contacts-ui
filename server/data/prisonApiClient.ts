import { Readable } from 'stream'
import RestClient from './restClient'
import config, { ApiConfig } from '../config'
import { PrisonApiAddress } from './prisonApiTypes'

export default class PrisonApiClient extends RestClient {
  constructor() {
    super('prisonApiClient', config.apis.prisonApi as ApiConfig)
  }

  async getImage(prisonerNumber: string, user: Express.User): Promise<Readable> {
    return this.stream({ path: `/api/bookings/offenderNo/${prisonerNumber}/image/data` }, user)
  }

  async getOffenderAddresses(prisonerNumber: string, user: Express.User): Promise<PrisonApiAddress[]> {
    return this.get({ path: `/api/offenders/${prisonerNumber}/addresses` }, user)
  }
}
