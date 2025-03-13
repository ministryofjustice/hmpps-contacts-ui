export const taskStatus = (
  val: string | object | object[] | undefined,
): { text: string } | { tag: { text: string; classes?: string } } => {
  if (!val || (Array.isArray(val) && val.length === 0)) {
    return { tag: { text: 'Not entered', classes: 'govuk-tag--blue' } }
  }
  return { text: 'Entered' }
}
