interface Navigation {
  backLink?: string
  breadcrumbs?: BreadcrumbType[]
}

type BreadcrumbType = 'DPS_HOME' | 'DPS_PROFILE' | 'PRISONER_CONTACTS'

export { Navigation, BreadcrumbType }
