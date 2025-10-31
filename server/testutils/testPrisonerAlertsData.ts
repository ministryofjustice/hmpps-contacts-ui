export default function pagedPrisonerAlertsData(
  {
    prisonNumber = 'G5276UE',
    createdByDisplayName = 'Azfgorigh Johneh',
    lastModifiedByDisplayName = 'Admin&onb Cnomis',
    ...alertOverrides
  } = {},
  overrides = {},
) {
  const alert = {
    alertUuid: '1',
    prisonNumber,
    alertCode: {
      alertTypeCode: 'X',
      alertTypeDescription: 'Hold or transfer restriction',
      code: 'XVL',
      description: 'Accredited Programme hold',
    },
    description: 'gzmONOQRHANxDCBhAmycaZSDIfUTkIlYdGXcdhtVJLBgzmONOQRHANxDCBhAmycaZSDIfUTkIlYdGXcdhtVJL',
    authorisedBy: 'OSYQOSYQ',
    activeFrom: '2016-02-01',
    isActive: true,
    createdAt: '2015-09-25T13:56:34',
    createdBy: 'DQU83Q',
    createdByDisplayName,
    lastModifiedAt: '2017-05-09T21:53:32',
    lastModifiedBy: 'OMS_OWNER',
    lastModifiedByDisplayName,
    ...alertOverrides, // allows any other alert property to be overridden
  }

  return {
    content: [alert],
    ...overrides, // allows overriding the top-level PageAlert fields (like pagination)
  }
}
