function urlFromTemplate(hrefTemplate: string, key: string, direction: string) {
  return hrefTemplate.replace('{sortKey}', key).replace('{sortDirection}', direction)
}

// add aria-sort attributes to govukTable head row, so that moj-sortable-table css will be applied
export const convertToSortableColumns = (
  headings: { text: string; key?: string }[],
  sort: string,
  hrefTemplate: string = '?sort={sortKey},{sortDirection}',
) => {
  const [sortingKey, sortingDirection] = sort.split(',')

  return headings.map(heading => {
    const { text, key, ...others } = heading
    if (!key) {
      return heading
    }

    if (key === sortingKey) {
      if (sortingDirection === 'asc') {
        return {
          attributes: {
            'aria-sort': 'ascending',
          },
          html: `<a href="${urlFromTemplate(hrefTemplate, key, 'desc')}"><button>${text}</button></a>`,
          ...others,
        }
      }
      if (sortingDirection === 'desc') {
        return {
          attributes: {
            'aria-sort': 'descending',
          },
          html: `<a href="${urlFromTemplate(hrefTemplate, key, 'asc')}"><button>${text}</button></a>`,
          ...others,
        }
      }
    }
    return {
      attributes: {
        'aria-sort': 'none',
      },
      html: `<a href="${urlFromTemplate(hrefTemplate, key, 'asc')}"><button>${text}</button></a>`,
      ...others,
    }
  })
}
