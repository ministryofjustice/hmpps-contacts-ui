npx -y openapi-typescript https://organisations-api-dev.hmpps.service.justice.gov.uk/v3/api-docs | sed "s/\"/'/g" | sed "s/;//g" > ../server/@types/organisationsApi/index.d.ts
eslint --fix "../server/@types/organisationsApi/index.d.ts"
