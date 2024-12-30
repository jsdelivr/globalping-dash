<template>
	<Dialog
		position="top"
		class="min-w-[700px] max-md:min-w-[95%]"
		modal
		dismissable-mask
		:draggable="false"
		@after-hide="$emit('after-hide')"
	>
		<slot/>
	</Dialog>
</template>

<script setup lang="ts">
	defineEmits([ 'after-hide' ]);
</script>
