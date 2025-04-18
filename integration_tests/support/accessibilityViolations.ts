import { Result, Spec } from 'axe-core'
import { fail } from 'assert'

const logAccessibilityViolations = (violations: Result[]) => {
  cy.task('logAccessibilityViolationsSummary', `Accessibility violations detected: ${violations.length}`)

  const violationData = violations.map(violation => ({
    ...violation,
    nodes: violation.nodes.length,
    nodeTargets: violation.nodes.map(node => node.target).join(' - '),
  }))

  cy.task('logAccessibilityViolationsTable', violationData)
}

export const checkAxeAccessibility = () => {
  cy.injectAxe()
  cy.configureAxe({
    rules: [
      // Temporary rule whilst this issue is resolved https://github.com/w3c/aria/issues/1404
      { id: 'aria-allowed-attr', reviewOnFail: true },
      // Ignore the "All page content should be contained by landmarks", which conflicts with GOV.UK guidance (https://design-system.service.gov.uk/components/back-link/#how-it-works)
      { id: 'region', reviewOnFail: true, selector: '.govuk-back-link' },
      { id: 'empty-table-header', reviewOnFail: true },
      // Allow MOJ Pagination components to have duplicate aria label (when used in pair on top and bottom of a table)
      { id: 'landmark-unique', reviewOnFail: true, selector: '.moj-pagination' },
    ],
  } as Spec)
  cy.checkA11y(undefined, undefined, logAccessibilityViolations)

  checkRadioGroupsHaveLegends()

  checkStyleRules()
}

const checkStyleRules = () => {
  // No un-curly apostrophes in text
  cy.contains('*', `'`)
    .should('have.length.gte', 0)
    .each(element => {
      if (element.hasClass('user-generated-content')) {
        return
      }
      if (element.text().includes("'")) {
        fail(`Non-curly apostrophe found in the following text: ${element.text()}`)
      }
    })
}

const checkRadioGroupsHaveLegends = () => {
  cy.get('body').then($body => {
    const expectedRadios = $body.find('.govuk-radios').length
    const radiosInFieldset = $body.find('.govuk-fieldset > .govuk-radios').length
    if (expectedRadios > radiosInFieldset) {
      fail(
        `Expected ${expectedRadios} radios to be within a fieldset with a legend but only found ${radiosInFieldset} within a fieldset`,
      )
    }
    if (expectedRadios > 0) {
      cy.get('.govuk-fieldset > .govuk-radios').then($fieldsetRadioGroup => {
        if ($fieldsetRadioGroup.parent().find('.govuk-fieldset__legend').length === 0) {
          fail(`Found radio group fieldset without legend`)
        }
      })
    }
  })
}

export default {
  logAccessibilityViolationsSummary: (message: string): null => {
    // eslint-disable-next-line no-console
    console.log(message)

    return null
  },
  logAccessibilityViolationsTable: (violations: Result[]): null => {
    // eslint-disable-next-line no-console
    console.table(violations)

    return null
  },
}
