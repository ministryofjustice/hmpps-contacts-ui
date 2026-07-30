import { Readable } from 'stream'
import { join } from 'path'
import { createReadStream } from 'node:fs'
import { RestClient, asSystem, SanitisedError, type AuthenticationClient } from '@ministryofjustice/hmpps-rest-client'
import config from '../config'
import logger from '../../logger'
import { PrisonApiAddress } from './prisonApiTypes'

export default class PrisonApiClient extends RestClient {
  constructor(authenticationClient: AuthenticationClient) {
    super('prisonApiClient', config.apis.prisonApi, logger, authenticationClient)
  }

  async getImage(prisonerNumber: string, user: Express.User): Promise<Readable> {
    try {
      return await this.stream(
        { path: `/api/bookings/offenderNo/${prisonerNumber}/image/data` },
        asSystem(user.username),
      )
    } catch (error) {
      if ((error as SanitisedError).responseStatus === 404) {
        const placeHolderImage = join(process.cwd(), '/dist/assets/images/prisoner-profile-image.png')
        return createReadStream(placeHolderImage)
      }
      throw error
    }
  }

  async getOffenderAddresses(prisonerNumber: string, user: Express.User): Promise<PrisonApiAddress[]> {
    return this.get({ path: `/api/offenders/${prisonerNumber}/addresses` }, asSystem(user.username))
  }
}
