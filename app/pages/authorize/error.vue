<template>
	<div class="my-4">
		<div>
			<Message severity="error" class="font-normal">
				Authentication failed! Please return to your application for more details.
			</Message>
		</div>
	</div>
</template>

<script setup lang="ts">
	definePageMeta({
		layout: 'info',
	});

	useHead({
		title: `Authentication Failed -`,
	});
</script>
