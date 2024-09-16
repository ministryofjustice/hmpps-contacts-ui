document.addEventListener('DOMContentLoaded', event => {
  function updateHint() {
    const hintDiv = document.querySelector('#selected-relationship-hint')
    const name = hintDiv.dataset.contact
    const selectedRelationship = document.querySelector('#relationship option:checked').innerHTML
    let hint = ''
    if (selectedRelationship.length > 0) {
      hint = '<b>' + name + "</b> is the prisoner's <b>" + selectedRelationship.toLowerCase() + '</b>'
    }
    hintDiv.innerHTML = hint
  }
  updateHint()
  document.querySelector('#relationship').addEventListener('change', function () {
    updateHint()
  })
})
