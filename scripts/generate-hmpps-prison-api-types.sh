npx -y openapi-typescript https://prison-api-dev.prison.service.justice.gov.uk/v3/api-docs | sed "s/\"/'/g" | sed "s/;//g" > ../server/@types/prison-api.d.ts
eslint --fix "../server/@types/prison-api.d.ts"
