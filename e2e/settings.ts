// The settings the browser tests run the app with: the sandbox, on a local address that has no
// real data. Shared by playwright.config.ts and the startup tests.
export const E2E_SETTINGS = {
	APP_ENV: 'sandbox',
	DATABASE_URL: 'postgres://ci@127.0.0.1:5432/cold_open_sandbox'
};
