function urlFromTemplate(hrefTemplate: string, key: string, direction: string) {
  return hrefTemplate.replace('{sortKey}', key).replace('{sortDirection}', direction)
}

// add aria-sort attributes to govukTable head row, so that moj-sortable-table css will be applied
export const convertToSortableColumns = (
  headings: { text: string; key?: string }[],
  sort: string,
  hrefTemplate: string = '?sort={sortKey},{sortDirection}',
) => {
  const [sortingKey, sortingDirection] = (sort || '').split(',')

  const escapeHtml = (s: string) =>
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch])

  // Inline SVGs for icons (kept aria-hidden so screen readers rely on the visually-hidden text)
  const upArrowSvg = `<svg class="pcl-sortable__icon" width="22" height="22" focusable="false" aria-hidden="true" role="img" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.5625 15.5L11 6.63125L15.4375 15.5H6.5625Z" fill="currentColor"></path></svg>`
  const downArrowSvg = `<svg class="pcl-sortable__icon" width="22" height="22" focusable="false" aria-hidden="true" role="img" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.4375 7L11 15.8687L6.5625 7L15.4375 7Z" fill="currentColor"></path></svg>`
  const upDownArrowSvg = `<svg class="pcl-sortable__icon" width="22" height="22" focusable="false" aria-hidden="true" role="img" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8.1875 9.5L10.9609 3.95703L13.7344 9.5H8.1875Z" fill="currentColor"></path><path d="M13.7344 12.0781L10.9609 17.6211L8.1875 12.0781H13.7344Z" fill="currentColor"></path></svg>`

  return headings.map(heading => {
    const { text, key, ...others } = heading
    if (!key) {
      return heading
    }

    const hrefAsc = escapeHtml(urlFromTemplate(hrefTemplate, key, 'asc'))
    const hrefDesc = escapeHtml(urlFromTemplate(hrefTemplate, key, 'desc'))
    const safeText = escapeHtml(text)

    // active sorted column
    if (key === sortingKey) {
      if (sortingDirection === 'asc') {
        return {
          attributes: {
            'aria-sort': 'ascending',
          },
          // Anchor-only control with accessible labels, visually-hidden hint, and an up-arrow icon to the right
          html: `<a class="pcl-sortable" href="${hrefDesc}" aria-label="${safeText}, sorted ascending, activate to sort descending"><span class="pcl-sortable__label">${safeText}</span><span class="govuk-visually-hidden">, sorted ascending, activate to sort descending</span>${upArrowSvg}</a>`,
          ...others,
        }
      }
      if (sortingDirection === 'desc') {
        return {
          attributes: {
            'aria-sort': 'descending',
          },
          // Anchor-only control with a down-arrow icon to the right
          html: `<a class="pcl-sortable" href="${hrefAsc}" aria-label="${safeText}, sorted descending, activate to sort ascending"><span class="pcl-sortable__label">${safeText}</span><span class="govuk-visually-hidden">, sorted descending, activate to sort ascending</span>${downArrowSvg}</a>`,
          ...others,
        }
      }
    }

    // not currently sorted
    return {
      attributes: {
        'aria-sort': 'none',
      },
      // Anchor-only control with combined up/down icon indicating sortable (icon on the right)
      html: `<a class="pcl-sortable" href="${hrefAsc}" aria-label="${safeText}, sortable column, activate to sort ascending"><span class="pcl-sortable__label">${safeText}</span><span class="govuk-visually-hidden">, sortable column, activate to sort ascending</span>${upDownArrowSvg}</a>`,
      ...others,
    }
  })
}
