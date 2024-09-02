declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to signIn. Set failOnStatusCode to false if you expect and non 200 return code
     * @example cy.signIn({ failOnStatusCode: boolean })
     */
    signIn(options?: { failOnStatusCode: boolean }): Chainable<AUTWindow>

    /**
     * Custom command to verify that the last API call matching the parameter is deeply equal to the expected value.
     * @param matching a wiremock request to /requests/find. For options see: https://wiremock.org/docs/standalone/admin-api-reference/#tag/Requests/operation/removeRequestsByMetadata
     * @param expected the request body to match
     */
    verifyLastAPICall(matching: string | object, expected: object): Chainable<*>
  }
}
