# Neon database setup

1. Create a project at [neon.tech](https://neon.tech) and copy the connection string.
2. Set `DATABASE_URL` in `.env.local` (use the connection string from the Neon dashboard; it must include `?sslmode=require` for serverless).
3. Run the schema in the Neon SQL Editor: paste and run the contents of `schema.sql`.

To set up Neon tooling (optional, for branch-based workflows):

```bash
npx neonctl@latest --force-auth init --agent cursor
```

If that fails due to dependency issues, you can manage migrations and branches from the Neon dashboard.
