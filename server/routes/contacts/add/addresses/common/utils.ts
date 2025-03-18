import { Request } from 'express'
import { NotFound } from 'http-errors'
import AddressForm = journeys.AddressForm

export type CreateContactAddressParam = {
  prisonerNumber: string
  journeyId: string
  addressIdx: string
}

export const getAddressFormAndUrl = (req: Request<CreateContactAddressParam>) => {
  const { prisonerNumber, addressIdx, journeyId } = req.params
  const journey = req.session.addContactJourneys![journeyId]!

  let addressForm: AddressForm
  const isNew = addressIdx === 'new'

  if (isNew) {
    journey.newAddress ??= {}
    addressForm = journey.newAddress
  } else {
    const idx = Number(addressIdx) - 1
    if (Number.isNaN(idx) || !journey.addressesToSave?.[idx]) {
      throw new NotFound()
    }
    addressForm = journey.addressesToSave[idx]
  }

  const bounceBackUrl = `/prisoner/${prisonerNumber}/contacts/create/addresses/${journeyId}`

  const addressUrl = ({ subPath }: { subPath: string }) =>
    `/prisoner/${prisonerNumber}/contacts/create/addresses/${addressIdx}/${subPath}/${journeyId}`

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
