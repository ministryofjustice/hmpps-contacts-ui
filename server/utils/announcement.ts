/**
 * Represents an announcement banner for the homepage.
 */
interface Announcement {
  title: string
  html: string
}

const featureEnabledPrisons = new Set<string>(['KMI', 'GNI', 'SPI', 'LGI', 'DWI', 'HOI', 'WWI'])

const limitedAccessAnnouncement: Announcement = {
  title: `You have limited access to the new Contacts service on DPS`,
  html: `Your ability to manage prisoner contacts on DPS is currently limited. All establishments will have full access to the new prisoner Contacts service from October. To receive early accesses, ask your Head of Operations or another appropriate staff member to email
<a class="govuk-notification-banner__link" href="mailto:managingcontacts@justice.gov.uk">managingcontacts@justice.gov.uk</a>.`,
}

/**
 * Returns the banner if the prison is not in the feature enabled list.
 * @param prison - The prison code to check.
 * @returns The announcement or undefined.
 */
export function getAnnouncement(prison: string): Announcement | undefined {
  return featureEnabledPrisons.has(prison) ? undefined : limitedAccessAnnouncement
}
