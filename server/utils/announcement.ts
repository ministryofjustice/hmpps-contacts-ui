interface Announcement {
  title: string
  html: string
}

const getEnabledPrisons = () => {
  return new Set(
    (process.env['FEATURE_NOMIS_CONTACT_OFF_PILOT_ENABLED_PRISONS'] || '')
      .split(',')
      .map(code => code.trim())
      .filter(Boolean),
  )
}

const NOMIS_OFF_PILOT_ANNOUNCEMENT: Announcement = {
  title: 'You must use DPS to manage contacts in your prison',
  html: `The equivalent NOMIS functionality has now been switched-off. You can access guidance and demo videos on <br/>our <a class="govuk-notification-sharepoint__link" href="https://justiceuk.sharepoint.com/:u:/r/sites/prisons-digital/SitePages/Managing%20Prisoner%20Contacts.aspx?csf=1&web=1&e=47P78C" target="_blank" rel="noopener noreferrer">SharePoint site</a>. If you have any questions or feedback, email 
<a class="govuk-notification-banner__link" href="mailto:managingcontacts@justice.gov.uk">managingcontacts@justice.gov.uk</a>.`,
}

const DEFAULT_ANNOUNCEMENT: Announcement = {
  title: 'Your prison has the new Contacts service in DPS.',
  html: `You can access guidance and demo videos on our <a class="govuk-notification-sharepoint__link" href="https://justiceuk.sharepoint.com/:u:/r/sites/prisons-digital/SitePages/Managing%20Prisoner%20Contacts.aspx?csf=1&web=1&e=47P78C" target="_blank" rel="noopener noreferrer">SharePoint site</a>. If you think you need a different role, speak to your LSA. The equivalent NOMIS functionality will be disabled in the coming months with read-only access. If you have any questions, contact <a class="govuk-notification-banner__link" href="mailto:managingcontacts@justice.gov.uk">managingcontacts@justice.gov.uk</a>`,
}

export function getAnnouncement(prison: string): Announcement | undefined {
  return getEnabledPrisons().has(prison) ? NOMIS_OFF_PILOT_ANNOUNCEMENT : DEFAULT_ANNOUNCEMENT
}
