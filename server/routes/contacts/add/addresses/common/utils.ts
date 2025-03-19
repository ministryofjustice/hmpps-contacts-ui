import { Request } from 'express'
import { NotFound } from 'http-errors'
import AddressForm = journeys.AddressForm

export type CreateContactAddressParam = {
  prisonerNumber: string
  journeyId: string
  addressIndex: string
}

export const getAddressFormAndUrl = (req: Request<CreateContactAddressParam>) => {
  const { prisonerNumber, addressIndex, journeyId } = req.params
  const journey = req.session.addContactJourneys![journeyId]!

  let addressForm: AddressForm
  const isNew = addressIndex === 'new'

  if (isNew) {
    journey.newAddress ??= {}
    addressForm = journey.newAddress
  } else {
    const idx = Number(addressIndex) - 1
    if (Number.isNaN(idx) || !journey.pendingAddresses?.[idx]) {
      throw new NotFound()
    }
    addressForm = journey.pendingAddresses[idx]
  }

  const bounceBackUrl = `/prisoner/${prisonerNumber}/contacts/create/addresses/${journeyId}`

  const addressUrl = ({ subPath }: { subPath: string }) =>
    `/prisoner/${prisonerNumber}/contacts/create/addresses/${addressIndex}/${subPath}/${journeyId}`

  const bounceBackOrAddressUrl = ({ subPath }: { subPath: string }) => (isNew ? addressUrl({ subPath }) : bounceBackUrl)

  return {
    isNew,
    journey,
    addressForm,
    addressUrl,
    bounceBackUrl,
    bounceBackOrAddressUrl,
  }
}
