<template>
	<form @submit.prevent="login">
		<Message v-if="error" type="error" class="mb-4"> Error: {{ error }} </Message>
		<div v-if="loading" class="flex items-center justify-center flex-1">
			<ProgressSpinner class="w-24 h-24 text-primary-600"/>
		</div>
		<div v-if="!loading" class="space-y-4">
			<InputText
				v-model="email"
				name="email"
				type="email"
				label="Email address"
				placeholder="john@example.com"
				required
			/>
			<InputText
				v-model="password"
				name="password"
				type="password"
				label="Password"
				required
			/>
			<div class="flex items-center justify-end space-x-4">
				<Button
					type="submit"
					variant="primary"
					:disabled="!email || !password"
				>
					<span>Login</span>
				</Button>
			</div>
		</div>
	</form>
</template>

<script setup>
	import { useAuth } from '~/store/auth';

	definePageMeta({
		layout: false,
	});

	const auth = useAuth();

	const email = ref('');
	const password = ref('');
	const error = ref(null);
	const loading = ref(false);

	async function login () {
		loading.value = true;
		error.value = null;

		try {
			// Login
			await auth.login({
				email: email.value,
				password: password.value,
			});

			// Clear the form
			email.value = '';
			password.value = '';
		} catch (e) {
			error.value = e.message;
		} finally {
			loading.value = false;
		}
	}
</script>
