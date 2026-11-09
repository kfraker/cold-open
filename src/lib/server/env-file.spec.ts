import { describe, expect, it } from 'vitest';
import { extractDatabaseUrl, setEnvValues } from './env-file';

// A made-up connection string in Neon's format.
const URL =
	'postgresql://owner:abc123@ep-test-pooler.aws.neon.tech/cold_open_sandbox?sslmode=require';

describe('extractDatabaseUrl', () => {
	it('finds the string however Neon formatted the snippet', () => {
		expect(extractDatabaseUrl(URL)).toBe(URL);
		expect(extractDatabaseUrl(`DATABASE_URL=${URL}\n`)).toBe(URL);
		expect(extractDatabaseUrl(`DATABASE_URL="${URL}"`)).toBe(URL);
		expect(extractDatabaseUrl(`psql '${URL}'`)).toBe(URL);
		expect(extractDatabaseUrl(`  ${URL.replace('postgresql', 'postgres')}  `)).toBe(
			URL.replace('postgresql', 'postgres')
		);
	});

	it('finds nothing when the clipboard holds something else', () => {
		expect(extractDatabaseUrl('')).toBeUndefined();
		expect(extractDatabaseUrl('https://console.neon.tech')).toBeUndefined();
	});
});

describe('setEnvValues', () => {
	it('creates the file text from nothing', () => {
		expect(setEnvValues('', { APP_ENV: 'sandbox' })).toBe('APP_ENV=sandbox\n');
	});

	it('replaces a setting in place and keeps every other line', () => {
		const before = '# Local settings\nAPP_ENV=production\nOTHER=1\n';
		expect(setEnvValues(before, { APP_ENV: 'sandbox' })).toBe(
			'# Local settings\nAPP_ENV=sandbox\nOTHER=1\n'
		);
	});

	it('replaces exported and spaced settings, and Windows line endings', () => {
		expect(setEnvValues('export APP_ENV = x\r\nOTHER=1\r\n', { APP_ENV: 'sandbox' })).toBe(
			'APP_ENV=sandbox\nOTHER=1\n'
		);
	});

	it('adds new settings at the end', () => {
		expect(setEnvValues('A=1', { DATABASE_URL: URL })).toBe(`A=1\nDATABASE_URL=${URL}\n`);
	});

	it('refuses a value .env would misread, without repeating it', () => {
		for (const bad of ['pa$word', 'a#b', "a'b", 'a"b', 'a`b', 'a b', 'a\nb']) {
			expect(() => setEnvValues('', { DATABASE_URL: bad })).toThrow(
				"DATABASE_URL contains a character .env files can't hold safely"
			);
			expect(() => setEnvValues('', { DATABASE_URL: bad })).toThrow(
				expect.not.stringContaining(bad)
			);
		}
	});

	it('drops a later copy of a setting, since the last copy is the one that counts', () => {
		expect(setEnvValues('A=1\nB=2\nA=3\n', { A: '4' })).toBe('A=4\nB=2\n');
	});
});
