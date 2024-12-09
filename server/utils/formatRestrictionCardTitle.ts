const formatRestrictionCardTitle = (expiryDate: string, restrictionTypeDescription: string): string => {
  const expiry = new Date(expiryDate)
  const now = new Date()

  if (expiry < now) {
    return `${restrictionTypeDescription} (expired)`
  }

  return restrictionTypeDescription
}

export default formatRestrictionCardTitle
