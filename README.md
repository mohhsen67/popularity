# GitHub Repo Popularity API
This is a tiny Node.js service by which you can search GitHub repositories and get the result with a computed popularity score attached to each repository.

# Prerequisites
- Node 18+
- Docker (for Redis cache)

# Quick start
```
npm install
cp .env.sample .env (update env vars as needed)
npm run cache:up
npm start
```

# Tests
```
npm test
```

# OpenAPI spec check
```
npm run openapi:validate
```

# Swagger UI
- Visit http://localhost:3000/docs

# APIs
- `GET /repos/popularity`

### Query params
- language: (required) - e.g., JavaScript
- created_after: (required) - e.g., 2023-01-01
- per_page: (optional) - default 10, max 100
- page: (optional) - default 1
- q: (optional) - search term to match in repo name or description

# Example request
```
curl "http://localhost:3000/repos/popularity?language=JavaScript&created_after=2023-01-01&per_page=5&page=1&q=express"
```
