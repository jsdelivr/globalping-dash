<template>
	<div>
		<Button
			icon="pi pi-ellipsis-h"
			severity="contrast"
			text
			aria-label="Options"
			aria-haspopup="true"
			aria-controls="overlay_tmenu"
			@click="toggle"
		/>
		<TieredMenu id="overlay_tmenu" ref="menu" :model="items" popup/>
	</div>
</template>

<script setup lang="ts">
	const emit = defineEmits([ 'edit', 'regenerate', 'delete' ]);

	const menu = ref();
	const items = ref([
		{
			label: 'Edit',
			icon: 'pi pi-pencil',
			command: () => emit('edit'),
		},
		{
			label: 'Regenerate token',
			icon: 'pi pi-refresh',
			command: () => emit('regenerate'),
		},
		{
			separator: true,
		},
		{
			label: 'Delete',
			icon: 'pi pi-trash',
			command: () => emit('delete'),
			class: '!text-red-500',
			style: 'color: red;',
		},
	]);

	const toggle = (event: Event) => {
		menu.value.toggle(event);
	};
</script>
