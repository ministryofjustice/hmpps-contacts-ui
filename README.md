# hmpps-contacts-ui
[![repo standards badge](https://img.shields.io/badge/endpoint.svg?&style=flat&logo=github&url=https%3A%2F%2Foperations-engineering-reports.cloud-platform.service.justice.gov.uk%2Fapi%2Fv1%2Fcompliant_public_repositories%2Fhmpps-contacts-ui)](https://operations-engineering-reports.cloud-platform.service.justice.gov.uk/public-github-repositories.html#hmpps-contacts-ui "Link to report")
[![codecov](https://codecov.io/github/ministryofjustice/hmpps-contacts-ui/graph/badge.svg?token=SJ5M6R0CXZ)](https://codecov.io/github/ministryofjustice/hmpps-contacts-ui)
[![CircleCI](https://circleci.com/gh/ministryofjustice/hmpps-contacts-ui/tree/main.svg?style=svg)](https://circleci.com/gh/ministryofjustice/hmpps-contacts-ui)

Template github repo used for new Typescript based projects.

# Instructions

If this is a HMPPS project then the project will be created as part of bootstrapping -
see https://github.com/ministryofjustice/hmpps-project-bootstrap. You are able to specify a template application using the `github_template_repo` attribute to clone without the need to manually do this yourself within GitHub.

This bootstrap is community managed by the mojdt `#typescript` slack channel.
Please raise any questions or queries there. Contributions welcome!

Our security policy is located [here](https://github.com/ministryofjustice/hmpps-contacts-ui/security/policy).

More information about the template project including features can be found [here](https://dsdmoj.atlassian.net/wiki/spaces/NDSS/pages/3488677932/Typescript+template+project).

## Creating a Cloud Platform namespace

When deploying to a new namespace, you may wish to use this template typescript project namespace as the basis for your new namespace:

<https://github.com/ministryofjustice/cloud-platform-environments/tree/main/namespaces/live.cloud-platform.service.justice.gov.uk/hmpps-contacts-ui>

This template namespace includes an AWS elasticache setup - which is required by this template project.

Copy this folder, update all the existing namespace references, and submit a PR to the Cloud Platform team. Further instructions from the Cloud Platform team can be found here: <https://user-guide.cloud-platform.service.justice.gov.uk/#cloud-platform-user-guide>

## Renaming from HMPPS Template Typescript - github Actions

Once the new repository is deployed. Navigate to the repository in github, and select the `Actions` tab.
Click the link to `Enable Actions on this repository`.

Find the Action workflow named: `rename-project-create-pr` and click `Run workflow`.  This workflow will
execute the `rename-project.bash` and create Pull Request for you to review.  Review the PR and merge.

Note: ideally this workflow would run automatically however due to a recent change github Actions are not
enabled by default on newly created repos. There is no way to enable Actions other then to click the button in the UI.
If this situation changes we will update this project so that the workflow is triggered during the bootstrap project.
Further reading: <https://github.community/t/workflow-isnt-enabled-in-repos-generated-from-template/136421>

## Manually branding from template app
Run the `rename-project.bash` and create a PR.

The rename-project.bash script takes a single argument - the name of the project and calculates from it the project description
It then performs a search and replace and directory renames so the project is ready to be used.

## Ensuring slack notifications are raised correctly

To ensure notifications are routed to the correct slack channels, update the `alerts-slack-channel` and `releases-slack-channel` parameters in `.circle/config.yml` to an appropriate channel.

## Filling in the `productId`

To allow easy identification of an application, the product Id of the overall product should be set in `values.yaml`. The Service Catalogue contains a list of these IDs and is currently in development here https://developer-portal.hmpps.service.justice.gov.uk/products

## Running the app
The easiest way to run the app is to use docker compose to create the service and all dependencies.

`docker compose pull`

`docker compose up`

### Dependencies
The app requires:
* hmpps-auth - for authentication
* redis - session store and token caching

### Running the app for development

To start the main services excluding the example typescript template app:

`docker compose up --scale=app=0`

Install dependencies using `npm install`, ensuring you are using `node v20`

Note: Using `nvm` (or [fnm](https://github.com/Schniz/fnm)), run `nvm install --latest-npm` within the repository folder to use the correct version of node, and the latest version of npm. This matches the `engines` config in `package.json` and the CircleCI build config.

And then, to build the assets and start the app with esbuild:

`npm run start:dev`

### Run linter

`npm run lint`

### Run tests

`npm run test`

### Running integration tests

For local running, start a test db and wiremock instance by:

`docker compose -f docker-compose-test.yml up`

Then run the server in test mode by:

`npm run start-feature` (or `npm run start-feature:dev` to run with auto-restart on changes)

And then either, run tests in headless mode with:

`npm run int-test`

Or run tests with the cypress UI:

`npm run int-test-ui`

## Generating types
You can re-generate the hmpps-contacts-api types with

`/scripts/generate-hmpps-contacts-api-types.sh`

## Change log

A changelog for the service is available [here](./CHANGELOG.md)

### Run locally for prabash
`docker-compose -f docker-compose-local.yml up`

Install dependencies using `npm install`, ensuring you are using `node v20`

then run application

`npm run start:dev`

### Run api tests locally for prabash

For local running, start a test db and wiremock instance by:

`docker compose -f docker-compose-test.yml up`

Then run the server in test mode by:

`npm run start-feature` (or `npm run start-feature:dev` to run with auto-restart on changes)

Or run tests with the cypress UI:

`npm run int-test-ui`

### Run locally for prabash env settings
HMPPS_AUTH_URL=https://sign-in-dev.hmpps.service.justice.gov.uk/auth
TOKEN_VERIFICATION_API_URL=https://token-verification-api-dev.prison.service.justice.gov.uk
TOKEN_VERIFICATION_ENABLED=false
COMPONENT_API_URL=https://frontend-components-dev.hmpps.service.justice.gov.uk
PRISONER_SEARCH_API_URL=https://prisoner-search-dev.prison.service.justice.gov.uk
PRISON_API_URL=https://prison-api-dev.prison.service.justice.gov.uk
CONTACTS_API_URL=https://contacts-api-dev.hmpps.service.justice.gov.uk
SESSION_SECRET=316360c316fbd8e36815
SIGN_IN_CLIENT_ID=hmpps-contacts-ui-1
SIGN_IN_CLIENT_SECRET=DSVI+i2OS:u&yD=h,IVABKHXkOOzJ9(.zD)&vNrUjjLwO4YMQo;FHNvDTc0O
SYSTEM_CLIENT_ID=hmpps-contacts-ui-system-2
SYSTEM_CLIENT_SECRET=LIfqmZ2VLuzhhagjt=!(ZCP!,8etUWYaeHNM&V.YIY7aZ$RRXvGr.odz5K6K
APPINSIGHTS_INSTRUMENTATIONKEY=b44af8fc-1647-443d-8cea-55c5cfbd4518
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=b44af8fc-1647-443d-8cea-55c5cfbd4518


### fix LInt issue
`npm run lint -- --fix`

### npm clean install
`npm ci`

### connect to dev db pod
`kubectl -n hmpps-contacts-dev port-forward port-forward-pod 5433:5432`

### Run locally for prabash
`docker-compose -f docker-compose-local.yml up`

Install dependencies using `npm install`, ensuring you are using `node v20`

then run application

`npm run start:dev`

### Run api tests locally for prabash

For local running, start a test db and wiremock instance by:

`docker compose -f docker-compose-test.yml up`

Then run the server in test mode by:

`npm run start-feature` (or `npm run start-feature:dev` to run with auto-restart on changes)

Or run tests with the cypress UI:

`npm run int-test-ui`

### Run locally for prabash env settings
HMPPS_AUTH_URL=https://sign-in-dev.hmpps.service.justice.gov.uk/auth
TOKEN_VERIFICATION_API_URL=https://token-verification-api-dev.prison.service.justice.gov.uk
TOKEN_VERIFICATION_ENABLED=false
COMPONENT_API_URL=https://frontend-components-dev.hmpps.service.justice.gov.uk
PRISONER_SEARCH_API_URL=https://prisoner-search-dev.prison.service.justice.gov.uk
PRISON_API_URL=https://prison-api-dev.prison.service.justice.gov.uk
CONTACTS_API_URL=https://contacts-api-dev.hmpps.service.justice.gov.uk
SESSION_SECRET=316360c316fbd8e36815
SIGN_IN_CLIENT_ID=hmpps-contacts-ui-1
SIGN_IN_CLIENT_SECRET=DSVI+i2OS:u&yD=h,IVABKHXkOOzJ9(.zD)&vNrUjjLwO4YMQo;FHNvDTc0O
SYSTEM_CLIENT_ID=hmpps-contacts-ui-system-2
SYSTEM_CLIENT_SECRET=LIfqmZ2VLuzhhagjt=!(ZCP!,8etUWYaeHNM&V.YIY7aZ$RRXvGr.odz5K6K
APPINSIGHTS_INSTRUMENTATIONKEY=b44af8fc-1647-443d-8cea-55c5cfbd4518
APPLICATIONINSIGHTS_CONNECTION_STRING=InstrumentationKey=b44af8fc-1647-443d-8cea-55c5cfbd4518


### fix LInt issue
`npm run lint -- --fix`

### npm clean install
`npm ci`

### connect to dev db pod
`kubectl -n hmpps-contacts-dev port-forward port-forward-pod 5433:5432`

### to debug cypress tests
### start server in debug mode
`npm run start-feature`

### then start with debug mode
`npm run int-test-ui`
