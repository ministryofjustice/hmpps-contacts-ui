npx -y openapi-typescript https://alerts-api-dev.hmpps.service.justice.gov.uk/v3/api-docs | sed "s/\"/'/g" | sed "s/;//g" > ../server/@types/alerts-api.d.ts
eslint --fix "../server/@types/alerts-api.d.ts"
