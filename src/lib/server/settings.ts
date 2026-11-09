// The app's settings, and the checks that keep each environment on its own database.
//
// Two settings, both required everywhere (see docs/services.md for where each one is set):
// - APP_ENV: `sandbox` (local, the `dev` preview and CI) or `production` (the live site).
// - DATABASE_URL: a Postgres connection string. It's a secret, so no message here ever includes it.
//
// The database name is the guard. The sandbox database is only ever called `cold_open_sandbox`
// and production's only `cold_open`, and each exists only on its own Neon branch. So a sandbox
// app given production's connection string refuses to start, rather than touching real data.
//
// Pure functions only: no environment reads, so they're unit-tested and shared by the app
// (src/env.ts, src/hooks.server.ts), the Vercel build check (vite.config.ts) and the scripts.

export const APP_ENVS = ['sandbox', 'production'] as const;
export type AppEnv = (typeof APP_ENVS)[number];

/** The only database name each environment may use. */
export const DATABASE_NAMES: Record<AppEnv, string> = {
	sandbox: 'cold_open_sandbox',
	production: 'cold_open'
};

/** What a valid connection string tells us, without the parts that are secret. */
export interface DatabaseTarget {
	database: string;
	/** Whether it goes through Neon's connection pooler (the host contains `-pooler`). */
	pooled: boolean;
}

/** The checked value of APP_ENV. Throws a message naming the allowed values. */
export function parseAppEnv(value: string | undefined): AppEnv {
	if (value === undefined || value === '')
		throw new Error(`Missing. Set it to ${APP_ENVS.join(' or ')}.`);
	if (!(APP_ENVS as readonly string[]).includes(value))
		throw new Error(`Must be ${APP_ENVS.join(' or ')}, not "${value}".`);
	return value as AppEnv;
}

/**
 * The database a connection string points at. Throws a message that never repeats the string,
 * because it holds the password.
 */
export function parseDatabaseUrl(value: string | undefined): DatabaseTarget {
	if (value === undefined || value === '')
		throw new Error('Missing. Run `npm run db:paste-url` to set it locally.');
	let url: URL;
	try {
		url = new URL(value);
	} catch {
		throw new Error("Isn't a valid connection string.");
	}
	if (url.protocol !== 'postgres:' && url.protocol !== 'postgresql:')
		throw new Error('Must start with postgres:// or postgresql://.');
	if (!url.hostname) throw new Error('Has no host.');
	// Only the settings Neon's snippet includes. Any other one could change what the driver
	// connects to behind this check's back: postgres.js passes unknown ones to the server, so
	// `?database=cold_open` would connect to cold_open whatever the path says.
	for (const key of url.searchParams.keys()) {
		if (!ALLOWED_PARAMETERS.includes(key))
			throw new Error(`Has a setting Cold Open doesn't allow: "${key}".`);
	}
	// As written, not decoded: the driver uses the path as written, so this checks the same name.
	const database = url.pathname.slice(1);
	const known = Object.values(DATABASE_NAMES);
	if (!known.includes(database))
		throw new Error(`Must name the database ${known.join(' or ')}, not "${database}".`);
	return { database, pooled: url.hostname.includes('-pooler') };
}

/** The connection string settings allowed after `?`: the ones in Neon's Copy snippet. */
const ALLOWED_PARAMETERS = ['sslmode', 'channel_binding'];

/**
 * Every problem with the settings as a whole, as readable lines; empty when they're right.
 * `vercelEnv` is Vercel's own VERCEL_ENV (`production`, `preview` or `development`), unset
 * anywhere else.
 */
export function settingsProblems(settings: {
	appEnv: string | undefined;
	databaseUrl: string | undefined;
	vercelEnv?: string | undefined;
}): string[] {
	const problems: string[] = [];
	let appEnv: AppEnv | undefined;
	let target: DatabaseTarget | undefined;
	try {
		appEnv = parseAppEnv(settings.appEnv);
	} catch (error) {
		problems.push(`APP_ENV: ${(error as Error).message}`);
	}
	try {
		target = parseDatabaseUrl(settings.databaseUrl);
	} catch (error) {
		problems.push(`DATABASE_URL: ${(error as Error).message}`);
	}
	if (appEnv && target && target.database !== DATABASE_NAMES[appEnv]) {
		problems.push(
			`DATABASE_URL: APP_ENV is ${appEnv}, so it must use the ${DATABASE_NAMES[appEnv]} database, not ${target.database}.`
		);
	}
	const expected: AppEnv | undefined =
		settings.vercelEnv === 'production'
			? 'production'
			: settings.vercelEnv === undefined || settings.vercelEnv === ''
				? undefined
				: 'sandbox';
	if (appEnv && expected && appEnv !== expected) {
		problems.push(
			`APP_ENV: this is a Vercel ${settings.vercelEnv} deployment, so it must be ${expected}, not ${appEnv}.`
		);
	}
	return problems;
}

/** Throws one clear error listing every problem, if there are any. */
export function assertSettings(settings: Parameters<typeof settingsProblems>[0]): void {
	const problems = settingsProblems(settings);
	if (problems.length > 0) {
		throw new Error(
			`Cold Open's settings are wrong:\n${problems.map((p) => `- ${p}`).join('\n')}\nSee docs/services.md for where each setting comes from.`
		);
	}
}

/**
 * The connection string as the postgres.js driver should get it. `channel_binding` is dropped:
 * it's a setting for Postgres's own client library, and postgres.js would pass it on to the server
 * as an unknown parameter. With `direct`, it's the unpooled address, for migrations, because
 * Neon's pooler doesn't keep a session, which schema changes can need. That's the same address
 * without `-pooler`.
 */
export function driverUrl(value: string, { direct = false } = {}): string {
	const url = new URL(value);
	url.searchParams.delete('channel_binding');
	if (direct) url.hostname = url.hostname.replace('-pooler', '');
	return url.toString();
}

/** A URL part decoded, or as it is if it isn't valid percent-encoding. */
function decoded(part: string): string {
	try {
		return decodeURIComponent(part);
	} catch {
		return part;
	}
}

/**
 * Replaces every appearance of the connection string's host and password in a message, so an
 * error from the database driver can be shown safely.
 */
export function redact(message: string, databaseUrl: string): string {
	let url: URL;
	try {
		url = new URL(databaseUrl);
	} catch {
		return message;
	}
	const secrets = [databaseUrl, url.password, decoded(url.password), url.hostname]
		.concat(url.hostname.includes('-pooler') ? [url.hostname.replace('-pooler', '')] : [])
		.filter((s) => s.length > 0)
		.sort((a, b) => b.length - a.length);
	return secrets.reduce((text, secret) => text.split(secret).join('[hidden]'), message);
}
