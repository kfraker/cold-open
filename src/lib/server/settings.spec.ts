import { describe, expect, it } from 'vitest';
import {
	assertSettings,
	driverUrl,
	parseAppEnv,
	parseDatabaseUrl,
	redact,
	settingsProblems
} from './settings';

// Made-up connection strings in Neon's format. None of them is real.
const SANDBOX =
	'postgresql://owner:s3cret-Pa55@ep-test-123-pooler.us-east-1.aws.neon.tech/cold_open_sandbox?sslmode=require';
const PRODUCTION =
	'postgresql://owner:s3cret-Pa55@ep-test-456-pooler.us-east-1.aws.neon.tech/cold_open?sslmode=require';

describe('parseAppEnv', () => {
	it('accepts sandbox and production', () => {
		expect(parseAppEnv('sandbox')).toBe('sandbox');
		expect(parseAppEnv('production')).toBe('production');
	});

	it('refuses a missing or empty value, naming the allowed ones', () => {
		expect(() => parseAppEnv(undefined)).toThrow('Missing. Set it to sandbox or production.');
		expect(() => parseAppEnv('')).toThrow('Missing.');
	});

	it('refuses anything else', () => {
		expect(() => parseAppEnv('dev')).toThrow('Must be sandbox or production, not "dev".');
	});
});

describe('parseDatabaseUrl', () => {
	it('reads the database name and whether the pooler is used', () => {
		expect(parseDatabaseUrl(SANDBOX)).toEqual({ database: 'cold_open_sandbox', pooled: true });
		expect(parseDatabaseUrl('postgres://ci@127.0.0.1:5432/cold_open')).toEqual({
			database: 'cold_open',
			pooled: false
		});
	});

	it('refuses a missing value, saying how to set it', () => {
		expect(() => parseDatabaseUrl(undefined)).toThrow('npm run db:paste-url');
		expect(() => parseDatabaseUrl('')).toThrow('Missing.');
	});

	it('refuses something that is not a Postgres connection string', () => {
		expect(() => parseDatabaseUrl('not a url')).toThrow("Isn't a valid connection string.");
		expect(() => parseDatabaseUrl('mysql://h/cold_open')).toThrow('Must start with postgres://');
		expect(() => parseDatabaseUrl('postgres:///cold_open')).toThrow('Has no host.');
	});

	it('refuses any other database, such as Neon’s default', () => {
		expect(() => parseDatabaseUrl(SANDBOX.replace('cold_open_sandbox', 'neondb'))).toThrow(
			'Must name the database cold_open_sandbox or cold_open, not "neondb".'
		);
	});

	it('accepts the settings in Neon’s snippet', () => {
		expect(parseDatabaseUrl(`${SANDBOX}&channel_binding=require`).database).toBe(
			'cold_open_sandbox'
		);
	});

	it('refuses any other setting, which could change the database actually used', () => {
		expect(() => parseDatabaseUrl(`${SANDBOX}&database=cold_open`)).toThrow(
			`Has a setting Cold Open doesn't allow: "database".`
		);
		expect(() => parseDatabaseUrl(`${SANDBOX}&options=-c%20search_path%3Dx`)).toThrow('"options"');
	});

	it('checks the database name as written, since that is what the driver uses', () => {
		expect(() => parseDatabaseUrl(SANDBOX.replace('cold_open_sandbox', 'cold%5Fopen'))).toThrow(
			'not "cold%5Fopen"'
		);
	});

	it('never repeats the connection string or password in a message', () => {
		const bad = SANDBOX.replace('cold_open_sandbox', 'other');
		expect(() => parseDatabaseUrl(bad)).toThrow(expect.not.stringContaining('s3cret'));
	});
});

describe('settingsProblems', () => {
	it('has none for a matching sandbox or production setup', () => {
		expect(settingsProblems({ appEnv: 'sandbox', databaseUrl: SANDBOX })).toEqual([]);
		expect(
			settingsProblems({ appEnv: 'sandbox', databaseUrl: SANDBOX, vercelEnv: 'preview' })
		).toEqual([]);
		expect(
			settingsProblems({ appEnv: 'production', databaseUrl: PRODUCTION, vercelEnv: 'production' })
		).toEqual([]);
	});

	it('lists every missing setting', () => {
		expect(settingsProblems({ appEnv: undefined, databaseUrl: undefined })).toEqual([
			'APP_ENV: Missing. Set it to sandbox or production.',
			'DATABASE_URL: Missing. Run `npm run db:paste-url` to set it locally.'
		]);
	});

	it('refuses a sandbox app pointed at the production database', () => {
		expect(settingsProblems({ appEnv: 'sandbox', databaseUrl: PRODUCTION })).toEqual([
			'DATABASE_URL: APP_ENV is sandbox, so it must use the cold_open_sandbox database, not cold_open.'
		]);
	});

	it('refuses a production app pointed at the sandbox database', () => {
		expect(settingsProblems({ appEnv: 'production', databaseUrl: SANDBOX })).toEqual([
			'DATABASE_URL: APP_ENV is production, so it must use the cold_open database, not cold_open_sandbox.'
		]);
	});

	it('refuses a preview that claims to be production', () => {
		expect(
			settingsProblems({ appEnv: 'production', databaseUrl: PRODUCTION, vercelEnv: 'preview' })
		).toEqual([
			'APP_ENV: this is a Vercel preview deployment, so it must be sandbox, not production.'
		]);
	});

	it('refuses a production deployment that claims to be the sandbox', () => {
		expect(
			settingsProblems({ appEnv: 'sandbox', databaseUrl: SANDBOX, vercelEnv: 'production' })
		).toEqual([
			'APP_ENV: this is a Vercel production deployment, so it must be production, not sandbox.'
		]);
	});

	it('treats an empty VERCEL_ENV as not on Vercel', () => {
		expect(
			settingsProblems({ appEnv: 'production', databaseUrl: PRODUCTION, vercelEnv: '' })
		).toEqual([]);
	});
});

describe('assertSettings', () => {
	it('passes quietly when the settings are right', () => {
		expect(() => assertSettings({ appEnv: 'sandbox', databaseUrl: SANDBOX })).not.toThrow();
	});

	it('throws one message listing every problem and where to look', () => {
		expect(() => assertSettings({ appEnv: 'staging', databaseUrl: undefined })).toThrow(
			[
				"Cold Open's settings are wrong:",
				'- APP_ENV: Must be sandbox or production, not "staging".',
				'- DATABASE_URL: Missing. Run `npm run db:paste-url` to set it locally.',
				'See docs/services.md for where each setting comes from.'
			].join('\n')
		);
	});
});

describe('driverUrl', () => {
	const SNIPPET = `${SANDBOX}&channel_binding=require`;

	it('drops channel_binding, which postgres.js would pass to the server', () => {
		expect(driverUrl(SNIPPET)).toBe(SANDBOX);
	});

	it('for migrations, also drops -pooler from a Neon host', () => {
		expect(driverUrl(SNIPPET, { direct: true })).toBe(SANDBOX.replace('-pooler', ''));
	});

	it('leaves a plain local address alone', () => {
		const local = 'postgres://ci@127.0.0.1:5432/cold_open_sandbox';
		expect(driverUrl(local)).toBe(local);
		expect(driverUrl(local, { direct: true })).toBe(local);
	});
});

describe('redact', () => {
	it('hides the password and both forms of the host', () => {
		const message = `connect to ep-test-123-pooler.us-east-1.aws.neon.tech failed; retried ep-test-123.us-east-1.aws.neon.tech with s3cret-Pa55`;
		expect(redact(message, SANDBOX)).toBe(
			'connect to [hidden] failed; retried [hidden] with [hidden]'
		);
	});

	it('hides the whole connection string', () => {
		expect(redact(`bad url ${SANDBOX}`, SANDBOX)).toBe('bad url [hidden]');
	});

	it('hides a password written with escapes, in either form', () => {
		const url = 'postgres://u:p%40ss@db.example/cold_open';
		expect(redact('p%40ss and p@ss', url)).toBe('[hidden] and [hidden]');
	});

	it('copes with a password that isn’t valid percent-encoding', () => {
		const url = 'postgres://u:ab%zz@db.example/cold_open';
		expect(redact('failed for ab%zz', url)).toBe('failed for [hidden]');
	});

	it('works without a password', () => {
		expect(redact('no route to 127.0.0.1', 'postgres://ci@127.0.0.1/cold_open')).toBe(
			'no route to [hidden]'
		);
	});

	it('returns the message unchanged when the connection string cannot be read', () => {
		expect(redact('some error', 'not a url')).toBe('some error');
	});
});
