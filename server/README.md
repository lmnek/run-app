
# Server

Start the server service with:
- `npm run dev` for development (hot reload)
- `npm run build && npm run start` for production


It may be necessary to `npm install` beforehand. 

The following environment variables need to be set in `.env` file: OPENAI_API_KEY, OPENROUTER_API_KEY, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, CLERK_SECRET_KEY, CLERK_JWT_PEM, DB_URL, REDIS_URL, ENV (development/production)
