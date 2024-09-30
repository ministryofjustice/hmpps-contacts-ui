document.addEventListener('DOMContentLoaded', event => {
  const excludedValues = ['NONE', 'OTHER', 'ILP']
  function updateHint() {
    const hintDiv = document.querySelector('#selected-relationship-hint')
    const name = hintDiv.dataset.contact
    const selectedRelationship = document.querySelector('#relationship option:checked')
    const selectedRelationshipValue = selectedRelationship.value
    let hint = '&nbsp;'
    if (selectedRelationshipValue.length > 0 && !excludedValues.includes(selectedRelationshipValue)) {
      hint = '<b>' + name + "</b> is the prisoner's <b>" + selectedRelationship.innerHTML.toLowerCase() + '</b>.'
    }
    hintDiv.innerHTML = hint
  }
  updateHint()
  document.querySelector('#relationship').addEventListener('change', function () {
    updateHint()
  })
})
