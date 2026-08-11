# hmpps-contacts-ui Agent Instructions

Frontend UI for creating and managing prisoner contacts within the Digital Prison Service (DPS). See [README.md](README.md) for setup and running instructions.

## Build & Test Commands

```bash
npm run build          # compile with esbuild
npm run start:dev      # build + watch (development)
npm run lint           # ESLint, max-warnings 0
npm run lint-fix       # ESLint auto-fix
npm run typecheck      # tsc check (app + integration_tests)
npm run test           # Jest unit tests
npm run test:ci        # Jest in serial mode (CI)
npm run int-test       # Cypress headless (requires docker-compose-test.yml + start-feature)
npm run int-test-ui    # Cypress interactive
```

## Architecture

```
Routes (controllers)  →  Services (business logic)  →  Data Clients (RestClient subclasses)  →  External APIs
```

- **`server/routes/`** — feature-grouped Express routers
- **`server/services/`** — orchestration; inject into routes as constructor args
- **`server/data/`** — `RestClient` subclasses (one per external API)
- **`server/middleware/`** — auth, validation, permissions, audit
- **`server/views/`** — Nunjucks templates (GOV.UK + MoJ design system)
- **`server/@types/`** — generated API types (do not edit by hand; re-generate via `scripts/generate-*.sh`)

## Key Conventions

### Controllers
Use method properties (`GET =`, `POST =`), not class methods. Handlers must be `async (req, res): Promise<void>`.

```typescript
export default class MyController {
  constructor(private readonly myService: MyService) {}

  GET = async (req: Request<MyParams>, res: Response): Promise<void> => { ... }
  POST = async (req: Request<MyParams>, res: Response): Promise<void> => { ... }
}
```

### Routes
Factory function pattern returning a `Router`. Pass services as parameters; wire controllers inside.

```typescript
const MyRoutes = (serviceA: ServiceA, serviceB: ServiceB) => {
  const router = Router({ mergeParams: true })
  // ...
  return router
}
```

### API Clients
Extend `RestClient` from `@ministryofjustice/hmpps-rest-client`. Constructor takes `(name, config.apis.<api>, logger, authenticationClient)`. Pass `asSystem(user.username)` (system-token calls) or `asUser(user.token)` as the second argument to `get`/`post`/`put`/`patch`/`delete` calls — the old `Client.SYSTEM_TOKEN`/`Client.USER_TOKEN` enum is gone. Auth token acquisition/verification/storage comes from `@ministryofjustice/hmpps-auth-clients` (`AuthenticationClient`, `VerificationClient`, `RedisTokenStore`/`InMemoryTokenStore`), wired once in `server/data/index.ts` and shared across clients/services (don't construct a second `AuthenticationClient` — e.g. `permissionsService` reuses the shared instance).

### Validation
Use Zod schemas in `*Schemas.ts` files colocated with the route. The `validate(schema)` middleware runs on POST routes and populates `res.locals.errors`.

### Enumerations & Permissions
Use constants from `server/enumeration/` (e.g. `Permission`, `ReferenceCodeType`). Never use magic strings.

### Proxy-awareness & config
Outbound HTTP goes through `@ministryofjustice/hmpps-rest-client`'s keepalive agents, which honour `HTTP_PROXY`/`HTTPS_PROXY`/`NO_PROXY` (see `helm_deploy/values-dev.yaml`'s `NODE_USE_ENV_PROXY: "1"` and `hmpps-envoy-https-proxy-env` secret) — don't create bespoke `http.Agent`/`https.Agent`/`superagent`/`agentkeepalive` instances outside that library, they'll bypass the Cloud Platform Envoy proxy. `config.ts`'s `AgentConfig`/`ApiConfig` types come from `@ministryofjustice/hmpps-rest-client`, not local definitions. Errors from migrated clients are `SanitisedError` with `.responseStatus` (not `.status`); `errorHandler.ts` checks both shapes since `http-errors`-based errors coexist. `server/utils/azureAppInsights.ts` forces Application Insights onto Node's core proxy-aware agents (`NODE_USE_ENV_PROXY`-driven) because its own proxy handling is rejected by Envoy on Node 24 — don't revert `configureProxyAgents()` when touching telemetry code.

## Testing

### Unit Tests
- Colocated with source: `server/**/*.test.ts`
- Mock API clients with `jest.mock('../data/myApiClient')` then `jest.Mocked<MyApiClient>`
- API client tests construct a real `AuthenticationClient`/`InMemoryTokenStore` from `@ministryofjustice/hmpps-auth-clients` (not a local adapter) and stub the actual HTTP calls with `nock`
- Mock HTTP calls with `nock`. For endpoints that retry (GET, DELETE), set up 3 nock interceptors when testing error paths
- Mock `node:fs` as `jest.mock('node:fs', () => ({ createReadStream: jest.fn() }))` when testing code that reads files

### Integration Tests (Cypress)
- Page objects in `integration_tests/pages/` — extend `Page` from `integration_tests/pages/page.ts`
- `PageElement` resolves to `Cypress.Chainable<JQuery<HTMLElement>>`. When using `.find('a')`, type explicitly: `.find<HTMLElement>('a')` to avoid assignment errors
- Tests live in `integration_tests/e2e/batch[1-4]/` — place new specs in the least-loaded batch
- Stub APIs via Wiremock helpers in `integration_tests/mockApis/`
- All tests must pass `checkAccessibility()` (cypress-axe)

## Generating Types

Re-run these scripts after API schema changes:

```bash
scripts/generate-hmpps-contacts-api-types.sh
scripts/generate-hmpps-organisations-api-types.sh
scripts/generate-hmpps-prison-api-types.sh
```
