interface Announcement {
  title: string
  html: string
}

const getEnabledPrisons = () => {
  return new Set(
    (process.env['FEATURE_ENABLED_PRISONS'] || '')
      .split(',')
      .map(code => code.trim())
      .filter(Boolean),
  )
}

const LIMITED_ACCESS_ANNOUNCEMENT: Announcement = {
  title: 'You have limited access to the new Contacts service on DPS',
  html: `Your prison currently has read-only access and will receive full access on Tuesday 21 October. Prepare by reading our <a class="govuk-notification-sharepoint__link" href="https://justiceuk.sharepoint.com/:u:/r/sites/prisons-digital/SitePages/Managing%20Prisoner%20Contacts.aspx?csf=1&web=1&e=47P78C" target="_blank" rel="noopener noreferrer">SharePoint site</a>.<br/>If you have any questions, please contact
<a class="govuk-notification-banner__link" href="mailto:managingcontacts@justice.gov.uk">managingcontacts@justice.gov.uk</a>.

<div class="govuk-notification-banner__content govuk-!-padding-left-0">
  <details class="govuk-details">
    <summary class="govuk-details__summary">
      <span class="govuk-details__summary-text">Where is this data from?</span>
    </summary>
    <div class="govuk-details__text">
      This data has been copied over from NOMIS. If any of the information needs to be changed, you should make the changes in NOMIS.
    </div>
  </details>
</div>`,
}

const NEW_ACCESS_ANNOUNCEMENT: Announcement = {
  title: 'Your prison is piloting the new Contacts service in DPS',
  html: `Use this service to manage contacts instead of NOMIS.</br> Guidance, support, and demo videos are available on the <a class="govuk-notification-banner__link" href="https://justiceuk.sharepoint.com/:u:/r/sites/prisons-digital/SitePages/Managing%20Prisoner%20Contacts.aspx?csf=1&web=1&e=47P78C" target="_blank" rel="noopener noreferrer">SharePoint site</a>.</br> Please help us improve the service by sending your feedback to <a class="govuk-notification-banner__link" href="mailto:managingcontacts@justice.gov.uk">managingcontacts@justice.gov.uk</a>.`,
}

export function getAnnouncement(prison: string): Announcement | undefined {
  return getEnabledPrisons().has(prison) ? NEW_ACCESS_ANNOUNCEMENT : LIMITED_ACCESS_ANNOUNCEMENT
}
