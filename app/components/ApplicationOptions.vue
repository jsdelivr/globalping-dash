<template>
	<div>
		<Button
			icon="pi pi-ellipsis-h"
			text
			severity="secondary"
			aria-label="Options"
			aria-haspopup="true"
			aria-controls="overlay_tmenu"
			@click="toggle"
		/>
		<TieredMenu id="overlay_tmenu" ref="menu" :model="items" popup/>
	</div>
</template>

<script setup lang="ts">
	const emit = defineEmits([ 'revoke' ]);

	const menu = ref();
	const items = ref([
		{
			label: 'Revoke access',
			icon: 'pi pi-undo',
			command: () => emit('revoke'),
			class: '!text-red-500',
			style: 'color: red;',
		},
	]);

	const toggle = (event: Event) => {
		menu.value.toggle(event);
	};
</script>
