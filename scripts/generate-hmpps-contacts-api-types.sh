npx -y openapi-typescript http://localhost:8080/v3/api-docs | sed "s/\"/'/g" | sed "s/;//g" > ../server/@types/contactsApi/index.d.ts
eslint --fix "../server/@types/contactsApi/index.d.ts"
