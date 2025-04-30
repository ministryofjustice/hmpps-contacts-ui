interface Navigation {
  backLink?: string | undefined
  backLinkLabel?: string | undefined
  breadcrumbs?: BreadcrumbType[] | undefined
  cancelButton?: string | undefined
}

type BreadcrumbType = 'DPS_HOME' | 'DPS_PROFILE' | 'PRISONER_CONTACTS'

export type { Navigation, BreadcrumbType }
