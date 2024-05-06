<template>
	<div>
		<Button @click="auth.login">Login</Button>
		<NuxtLink to="/">Main</NuxtLink>
	</div>
</template>

<script setup>
	import { useAuth } from '~/store/auth';

	definePageMeta({
		layout: false,
	});

	const auth = useAuth();
</script>
