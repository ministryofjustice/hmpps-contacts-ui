// Import shared SVG icons
import { upArrowSvg, downArrowSvg, upDownArrowSvg } from './sortableIcons'

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

  const escapeHtml = (s: unknown): string => {
    const str = String(s)
    const map: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }
    return str.replace(/[&<>"]/g, ch => map[ch] ?? ch)
  }

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
          // Remove redundant aria-label because the visually-hidden text contains the same info
          html: `<a class="pcl-sortable" href="${hrefDesc}"><span class="pcl-sortable__label">${safeText}</span><span class="govuk-visually-hidden">, sorted ascending, activate to sort descending</span>${upArrowSvg}</a>`,
          ...others,
        }
      }
      if (sortingDirection === 'desc') {
        return {
          attributes: {
            'aria-sort': 'descending',
          },
          // Anchor-only control with a down-arrow icon to the right
          // Remove redundant aria-label because the visually-hidden text contains the same info
          html: `<a class="pcl-sortable" href="${hrefAsc}"><span class="pcl-sortable__label">${safeText}</span><span class="govuk-visually-hidden">, sorted descending, activate to sort ascending</span>${downArrowSvg}</a>`,
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
      // Remove redundant aria-label because the visually-hidden text contains the same info
      html: `<a class="pcl-sortable" href="${hrefAsc}"><span class="pcl-sortable__label">${safeText}</span><span class="govuk-visually-hidden">, sortable column, activate to sort ascending</span>${upDownArrowSvg}</a>`,
      ...others,
    }
  })
}
