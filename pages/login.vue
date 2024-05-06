<template>
	<div>
		<h1>Login</h1>
		<Button label="Log In with Github" icon="pi pi-github" @click="onSubmitProvider"/>
		<input v-model="email" type="email" placeholder="Your E-Mail Address">
		<input v-model="password" type="password" placeholder="Your Password">
		<button @click="onSubmit">Login</button>
	</div>
</template>

<script setup lang="ts">
	definePageMeta({
		layout: false,
	});

	const { login, loginWithProvider } = useDirectusAuth();

	const email = ref('');
	const password = ref('');

	const onSubmit = async () => {
		await login({ email: email.value, password: password.value });
		navigateTo('/');
	};

	const onSubmitProvider = async () => {
		await loginWithProvider('github', '/api/cookie');
	};
</script>
