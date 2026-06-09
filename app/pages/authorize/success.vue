<template>
	<div class="my-4">
		<div>
			<Message severity="success" class="font-normal">
				Success! You may close this tab and return to your application.
			</Message>
		</div>
	</div>
</template>

<script setup lang="ts">
	definePageMeta({
		layout: 'info',
	});

	useHead({
		title: `Authentication Successful -`,
	});
</script>
