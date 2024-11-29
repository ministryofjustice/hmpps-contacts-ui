interface Navigation {
  backLink?: string
  breadcrumbs?: BreadcrumbType[]
  cancelButton?: string
}

type BreadcrumbType = 'DPS_HOME' | 'DPS_PROFILE' | 'PRISONER_CONTACTS'

export { Navigation, BreadcrumbType }
