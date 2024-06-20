<template>
	<div class="bg-surface-50 flex h-full flex-col p-6">
		<div>
			<h1 class="col-span-2 text-2xl font-bold">Settings</h1>
		</div>
		<div class="bg-surface-0 mt-6 flex rounded-xl border p-6">
			<div class="w-2/5">
				<h5 class="text-lg font-bold">Account details</h5>
			</div>
			<div class="grow">
				<p class="font-bold">First Name</p>
				<InputText v-model="me.first_name" class="mt-3 w-full"/>
				<p class="mt-6 font-bold">Last Name</p>
				<InputText v-model="me.last_name" class="mt-3 w-full"/>
				<p class="mt-6 font-bold">Username</p>
				<InputText v-model="me.github_username" disabled class="!bg-surface-0 mt-3 w-full"/>
			</div>
		</div>
		<div class="bg-surface-0 mt-6 flex rounded-xl border p-6">
			<div class="w-2/5">
				<h5 class="text-lg font-bold">Interface</h5>
			</div>
			<div class="grow">
				<p class="font-bold">Theme</p>
			</div>
		</div>
		<div class="bg-surface-0 mt-6 flex rounded-xl border p-6">
			<div class="w-2/5">
				<h5 class="text-lg font-bold">Other</h5>
			</div>
			<div class="grow">
				<p class="font-bold">Email</p>
				<InputText v-model="me.email" class="mt-3 w-full"/>
				<p class="mt-6 font-bold">Organizations</p>
				<InputText v-model="me.github_organizations" disabled class="!bg-surface-0 mt-3 w-full"/>
				<p class="mt-6 font-bold">User type</p>
				<InputText v-model="me.user_type" disabled class="!bg-surface-0 mt-3 w-full"/>
			</div>
		</div>
		<div class="bg-surface-0 mt-6 flex rounded-xl border p-6">
			<div class="w-2/5">
				<h5 class="text-lg font-bold">Data removal</h5>
			</div>
			<div class="grow">
				<p class="font-bold">Delete account</p>
				<Button class="mt-3" severity="secondary" outlined label="Delete account"/>
			</div>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { readMe } from '@directus/sdk';

	const { $directus } = useNuxtApp();

	const { data: me } = await useAsyncData('me', () => {
		return $directus.request(readMe());
	}, {
		default: () => ({
			first_name: '',
			last_name: '',
			email: '',
			github_username: '',
			github_organizations: [],
			user_type: '',
		}),
	});

	console.log('me', me.value);
</script>
