import { PersonalRelationshipsPermission } from '@ministryofjustice/hmpps-prison-permissions-lib'

export { PersonalRelationshipsPermission }

// For backward compatibility, export the base permission as the default
// read_contact_list = 'prisoner:contact-list:read',// previously 'VIEW_CONTACT_LIST',
// edit_contact_list = 'prisoner:contact-list:edit',//'MANAGE_CONTACTS',
// approve_contact_visit = 'prisoner:contact-visit:approve',//'APPROVE_TO_VISIT',
// edit_contact_restrictions = 'prisoner:contact-restrictions:approve',//'MANAGE_RESTRICTIONS',
export default PersonalRelationshipsPermission
