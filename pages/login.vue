<template>
	<div>
		<h1>Login</h1>
		<input v-model="email" type="email" placeholder="Your E-Mail Address">
		<input v-model="password" type="password" placeholder="Your Password">
		<button @click="onSubmit">Login</button>
	</div>
</template>

<script setup lang="ts">
	definePageMeta({
		layout: false,
	});

	const { login } = useDirectusAuth();

	const email = ref('');
	const password = ref('');

	const onSubmit = async () => {
		try {
			await login({ email: email.value, password: password.value });
			navigateTo('/');
		} catch (e) {}
	};
</script>
