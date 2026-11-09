// Saves the sandbox connection string from the clipboard into .env, without ever showing it.
//
//   1. In Neon, open the `dev` branch > Connect, choose the cold_open_sandbox database with
//      connection pooling on, and click Copy snippet.
//   2. npm run db:paste-url
//
// It refuses anything but the pooled sandbox database, sets APP_ENV=sandbox too, clears the
// clipboard, and checks the database answers. Nothing it prints includes the connection string,
// host or password. Works on Windows and macOS, and on Linux with wl-clipboard or xclip.
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import postgres from 'postgres';
import { extractDatabaseUrl, setEnvValues } from '#lib/server/env-file.ts';
import { DATABASE_NAMES, driverUrl, parseDatabaseUrl, redact } from '#lib/server/settings.ts';

const ENV_FILE = '.env';

/** Runs a clipboard command and returns what it printed, without echoing it. */
function run(command: string, args: string[]): string {
	return execFileSync(command, args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
}

/**
 * Runs a command that sets or clears the clipboard. Its output is ignored, not captured: xclip
 * and wl-copy leave a background process holding the clipboard, which would keep a captured
 * output open and make this wait forever.
 */
function runWithoutOutput(command: string, args: string[], input = ''): void {
	execFileSync(command, args, { input, stdio: ['pipe', 'ignore', 'ignore'] });
}

function readClipboard(): string {
	if (process.platform === 'win32')
		return run('powershell', ['-NoProfile', '-Command', 'Get-Clipboard -Raw']);
	if (process.platform === 'darwin') return run('pbpaste', []);
	try {
		return run('wl-paste', ['--no-newline']);
	} catch {
		return run('xclip', ['-o', '-selection', 'clipboard']);
	}
}

function clearClipboard(): void {
	if (process.platform === 'win32')
		runWithoutOutput('powershell', [
			'-NoProfile',
			'-Command',
			'Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.Clipboard]::Clear()'
		]);
	else if (process.platform === 'darwin') runWithoutOutput('pbcopy', []);
	else {
		try {
			runWithoutOutput('wl-copy', ['--clear']);
		} catch {
			runWithoutOutput('xclip', ['-selection', 'clipboard']);
		}
	}
}

function fail(message: string): never {
	console.error(message);
	process.exit(1);
}

let snippet: string;
try {
	snippet = readClipboard();
} catch {
	fail("Couldn't read the clipboard on this computer.");
}
const databaseUrl = extractDatabaseUrl(snippet);
if (!databaseUrl) {
	fail(
		"The clipboard doesn't hold a connection string. In Neon, open the dev branch > Connect, choose the cold_open_sandbox database, and click Copy snippet. Then run this again."
	);
}

// A connection string has been read, so clear it off the clipboard whatever happens next.
try {
	clearClipboard();
} catch {
	console.warn('Couldn’t clear the clipboard. Copy something else over it.');
}

let database: string;
let pooled: boolean;
try {
	({ database, pooled } = parseDatabaseUrl(databaseUrl));
} catch (error) {
	fail(`That connection string won't work: ${(error as Error).message} Nothing was saved.`);
}
if (database !== DATABASE_NAMES.sandbox) {
	fail(
		`That's the production database (${database}). Local work only ever uses the sandbox: open the dev branch in Neon and choose ${DATABASE_NAMES.sandbox}. Nothing was saved.`
	);
}
if (!pooled) {
	fail(
		"That's the direct connection. Turn on connection pooling in Neon's Connect dialog, copy the snippet again, and rerun. Nothing was saved."
	);
}

// One read, with a missing file treated as empty, so nothing can change between a check and the read.
let before = '';
try {
	before = readFileSync(ENV_FILE, 'utf8');
} catch (error) {
	if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
}
let after: string;
try {
	after = setEnvValues(before, { APP_ENV: 'sandbox', DATABASE_URL: databaseUrl });
} catch (error) {
	fail(
		`${(error as Error).message} Reset the database password in Neon and copy it again. Nothing was saved.`
	);
}
// A new .env is readable only by its owner (on macOS and Linux; Windows ignores the mode).
writeFileSync(ENV_FILE, after, { mode: 0o600 });
console.log(
	`Saved to .env: APP_ENV=sandbox, and DATABASE_URL for ${database} (pooled). The clipboard was cleared.`
);

// Checks the saved string works. `prepare: false` because Neon's pooler doesn't keep sessions.
const sql = postgres(driverUrl(databaseUrl), { max: 1, prepare: false, connect_timeout: 15 });
try {
	const [{ name }] = await sql`select current_database() as name`;
	console.log(`Connected: the ${name} database answered.`);
} catch (error) {
	console.error(
		`Saved, but couldn't connect: ${redact(String((error as Error).message ?? error), databaseUrl)}`
	);
	process.exitCode = 1;
} finally {
	await sql.end({ timeout: 5 });
}
