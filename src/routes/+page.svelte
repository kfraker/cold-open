<script lang="ts">
	import { APP_NAME, pageTitle } from '#lib';
</script>

<svelte:head>
	<title>{pageTitle()}</title>
</svelte:head>

<main>
	<h1>{APP_NAME}</h1>
	<p>A script-writing app, in development.</p>
	<p><a href="https://github.com/kfraker/cold-open">Follow along on GitHub</a></p>
</main>
