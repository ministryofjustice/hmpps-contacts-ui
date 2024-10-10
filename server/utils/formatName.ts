import { convertToTitleCase } from './utils'
import PrisonerDetails = journeys.PrisonerDetails
import ContactNames = journeys.ContactNames

const formatName = (
  val: { lastName: string; firstName: string; middleNames?: string } | ContactNames | PrisonerDetails,
  opts?: { excludeMiddleNames?: boolean },
): string => {
  let name = `${val.lastName}, ${val.firstName}`
  if (!opts?.excludeMiddleNames) {
    if ('middleName' in val && val.middleName) {
      name += ` ${val.middleName}`
    } else if ('middleNames' in val && val.middleNames) {
      name += ` ${val.middleNames}`
    }
  }
  return convertToTitleCase(name)
}

export default formatName
