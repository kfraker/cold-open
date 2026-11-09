// Applies the migrations in drizzle/ to the database in DATABASE_URL.
//
//   npm run db:migrate
//
// Reads APP_ENV and DATABASE_URL from the environment, or from .env locally. It only runs on the
// sandbox: production migrations get their own guarded process before the first table reaches
// production (see docs/releasing.md). Running it again applies nothing new.
// Nothing it prints includes the connection string, host or password.
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import { assertSettings, driverUrl, parseDatabaseUrl, redact } from '#lib/server/settings.ts';

const appEnv = process.env.APP_ENV;
const databaseUrl = process.env.DATABASE_URL ?? '';

try {
	assertSettings({ appEnv, databaseUrl, vercelEnv: process.env.VERCEL_ENV });
} catch (error) {
	console.error((error as Error).message);
	process.exit(1);
}
if (appEnv !== 'sandbox') {
	console.error(
		'Migrations only run on the sandbox for now. Production migrations get their own guarded process before the first table reaches production (see docs/releasing.md).'
	);
	process.exit(1);
}

const { database } = parseDatabaseUrl(databaseUrl);
// Direct, not pooled: a migration can need a session, which Neon's pooler doesn't keep.
const sql = postgres(driverUrl(databaseUrl, { direct: true }), { max: 1, onnotice: () => {} });

/** How many migrations the database has recorded as applied. */
async function appliedCount(): Promise<number> {
	const [{ exists }] =
		await sql`select to_regclass('drizzle.__drizzle_migrations') is not null as exists`;
	if (!exists) return 0;
	const [{ count }] = await sql`select count(*)::int as count from drizzle.__drizzle_migrations`;
	return count;
}

try {
	const before = await appliedCount();
	await migrate(drizzle(sql), { migrationsFolder: 'drizzle' });
	const after = await appliedCount();
	console.log(
		`Migrations on ${database}: ${after - before} applied now, ${after} applied in total.`
	);
} catch (error) {
	console.error(
		`Migration failed: ${redact(String((error as Error).message ?? error), databaseUrl)}`
	);
	process.exitCode = 1;
} finally {
	await sql.end({ timeout: 5 });
}
