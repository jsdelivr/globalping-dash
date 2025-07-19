<template>
	<Dialog
		v-model:visible="visible"
		position="top"
		class="w-auto max-w-[95%]"
		modal
		dismissable-mask
		:draggable="false"
		@after-hide="afterHide()"
	>
		<slot/>
	</Dialog>
</template>

<script setup lang="ts">
	const emit = defineEmits([
		'after-hide',
	]);

	const visible = defineModel('visible', {
		type: Boolean,
		default: false,
	});

	const afterHide = () => {
		emit('after-hide');
	};
</script>
