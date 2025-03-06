npx -y openapi-typescript https://personal-relationships-api-dev.hmpps.service.justice.gov.uk/v3/api-docs | sed "s/\"/'/g" | sed "s/;//g" > ../server/@types/contactsApi/index.d.ts
eslint --fix "../server/@types/contactsApi/index.d.ts"
