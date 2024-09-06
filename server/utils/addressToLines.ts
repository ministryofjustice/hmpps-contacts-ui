import logger from '../../logger'
import PrisonerContactSummary = contactsApiClientTypes.PrisonerContactSummary

const addressToLines = ({
  flat,
  premise,
  street,
  area,
  city,
  county,
  postalCode,
  country,
}: Partial<PrisonerContactSummary>): string => {
  let lineOne = [premise, street].filter(s => s).join(', ')
  if (flat) {
    lineOne = `Flat ${flat}, ${lineOne}`
  }
  const addressArray = [lineOne, area, city, county, postalCode, country].filter(s => s).join('<br />')
  logger.info(`ADDRESS ARRAY ${JSON.stringify(addressArray)}`)
  if (addressArray.length !== 1 || !country) return addressArray
  return null
}

export default addressToLines
