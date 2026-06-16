declare namespace Cypress {
  interface Chainable {
    signIn(options?: { startUrl: string; failOnStatusCode?: boolean }): Chainable<AUTWindow>

    verifyLastAPICall(matching: string | object, expected: object): Chainable<*>

    verifyAPIWasCalled(matching: string | object, expected: number): Chainable<*>
  }
}
