import ReferenceCodeType from '../enumeration/referenceCodeType'

export const relationshipToPrisonerOptionsForRelationshipType = (
  relationshipType: string,
  contactName: string,
): {
  groupCodeForRelationshipType: ReferenceCodeType
  hintText: string
  defaultSelectLabel: string
} => {
  let groupCodeForRelationshipType
  let hintText
  let defaultSelectLabel
  if (relationshipType === 'S') {
    groupCodeForRelationshipType = ReferenceCodeType.SOCIAL_RELATIONSHIP
    hintText = `For example, if ${contactName} is the prisoner’s uncle, select ‘Uncle’.`
    defaultSelectLabel = 'Select social relationship'
  } else {
    groupCodeForRelationshipType = ReferenceCodeType.OFFICIAL_RELATIONSHIP
    hintText = `For example, if ${contactName} is the prisoner’s doctor, select ‘Doctor’.`
    defaultSelectLabel = 'Select official relationship'
  }
  return {
    groupCodeForRelationshipType,
    hintText,
    defaultSelectLabel,
  }
}
