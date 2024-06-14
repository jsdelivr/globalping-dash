<template>
	<div class="text-bluegray-700 border-t px-5 py-7">
		<p>Token name</p>
		<InputText
			v-model="name"
			class="mt-2 w-full"
		/>
		<p class="mt-1 text-xs">A unique name for this token</p>
		<p class="mt-6">Expiration</p>
		<Button label="Secondary" severity="secondary" rounded/>
	</div>
</template>

<script setup lang="ts">
	const name = ref('');
</script>
