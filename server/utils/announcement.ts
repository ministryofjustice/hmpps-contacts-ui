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
  html: `While the new Contacts service is being piloted, your establishment has read-only access.</br>
To request full access for your establishment, ask your Head of Operations or another appropriate staff member to email
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
  title: 'Your prison has the new Contacts service in DPS',
  html: `You can access guidance and demo videos on our <a class="govuk-notification-banner__link" href="https://justiceuk.sharepoint.com/:u:/r/sites/prisons-digital/SitePages/Managing%20Prisoner%20Contacts.aspx?csf=1&web=1&e=47P78C">Sharepoint site</a>.</br> If you think you need a different role, email <a class="govuk-notification-banner__link" href="mailto:managingcontacts@justice.gov.uk">managingcontacts@justice.gov.uk</a> to request access.`,
}

export function getAnnouncement(prison: string): Announcement | undefined {
  return getEnabledPrisons().has(prison) ? NEW_ACCESS_ANNOUNCEMENT : LIMITED_ACCESS_ANNOUNCEMENT
}
