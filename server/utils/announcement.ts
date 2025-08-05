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
  html: `Your ability to manage prisoner contacts on DPS is currently limited.</br>
All establishments will have full access to the new prisoner Contacts service from October. To request early access, ask your Head of Operations or another appropriate staff member to email
<a class="govuk-notification-banner__link" href="mailto:managingcontacts@justice.gov.uk">managingcontacts@justice.gov.uk</a>.

<div class="govuk-notification-banner__content">
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

export function getAnnouncement(prison: string): Announcement | undefined {
  return getEnabledPrisons().has(prison) ? undefined : LIMITED_ACCESS_ANNOUNCEMENT
}
