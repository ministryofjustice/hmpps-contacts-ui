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

  async getImage(prisonerNumber: string, username: string): Promise<Readable> {
    try {
      return await this.stream({ path: `/api/bookings/offenderNo/${prisonerNumber}/image/data` }, asSystem(username))
    } catch (error) {
      if ((error as SanitisedError).responseStatus === 404) {
        return PrisonApiClient.openPlaceholderImage()
      }
      throw error
    }
  }

  async getOffenderAddresses(prisonerNumber: string, username: string): Promise<PrisonApiAddress[]> {
    return this.get({ path: `/api/offenders/${prisonerNumber}/addresses` }, asSystem(username))
  }

  private static openPlaceholderImage(): Promise<Readable> {
    const placeHolderImage = join(process.cwd(), '/dist/assets/images/prisoner-profile-image.png')
    return new Promise((resolve, reject) => {
      const stream = createReadStream(placeHolderImage)
      stream.once('open', () => resolve(stream))
      stream.once('error', reject)
    })
  }
}
