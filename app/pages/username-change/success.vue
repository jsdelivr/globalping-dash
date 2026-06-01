<template>
	<div>
		<div>
			<Message severity="success" class="font-normal">
				Success! Your default probe tag prefix change has been confirmed. You may close this tab.
			</Message>
		</div>
	</div>
</template>

<script setup lang="ts">
	definePageMeta({
		layout: 'info',
	});

	useHead({
		title: `Confirmed -`,
	});
</script>
