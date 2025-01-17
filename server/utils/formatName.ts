import { capitaliseName } from './utils'
import PrisonerDetails = journeys.PrisonerDetails
import ContactNames = journeys.ContactNames

const formatNameLastNameFirst = (
  val: { lastName: string; firstName: string; middleNames?: string } | ContactNames | PrisonerDetails,
  opts?: { excludeMiddleNames?: boolean; customTitle?: string },
): string => {
  let name = `${val.lastName}, `
  if (opts?.customTitle) {
    name += `${opts.customTitle} `
  }
  name += val.firstName
  if (!opts?.excludeMiddleNames) {
    if ('middleName' in val && val.middleName) {
      name += ` ${val.middleName}`
    } else if ('middleNames' in val && val.middleNames) {
      name += ` ${val.middleNames}`
    }
  }
  return capitaliseName(name)
}

const formatNameFirstNameFirst = (
  val: { lastName: string; firstName: string; middleNames?: string } | ContactNames | PrisonerDetails,
  opts?: { excludeMiddleNames?: boolean; customTitle?: string; possessiveSuffix?: boolean },
): string => {
  const nameArr = []
  let name = ''

  if (opts?.customTitle) {
    nameArr.push(opts.customTitle)
  }

  nameArr.push(val.firstName)
  if (!opts?.excludeMiddleNames) {
    if ('middleName' in val && val.middleName) {
      nameArr.push(val.middleName)
    } else if ('middleNames' in val && val.middleNames) {
      nameArr.push(val.middleNames)
    }
  }

  nameArr.push(val.lastName)
  name = nameArr.join(' ').trim()
  name = capitaliseName(name)

  if (opts?.possessiveSuffix === true) {
    const requiresAnS = !name.endsWith('s')
    name += '&rsquo;'
    if (requiresAnS) {
      name += 's'
    }
  }
  return name
}

export { formatNameLastNameFirst, formatNameFirstNameFirst }
