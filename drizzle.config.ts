// drizzle-kit settings, used by `npm run db:generate` and `npm run db:check`, which only read
// files. There's deliberately no database address here: migrations are applied by
// scripts/db-migrate.ts, which first checks it's talking to the sandbox.
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	dialect: 'postgresql',
	schema: './src/lib/server/db/schema.ts',
	out: './drizzle',
	strict: true,
	verbose: true
});
