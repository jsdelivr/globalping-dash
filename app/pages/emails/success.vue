<template>
	<div>
		<div>
			<Message severity="success" class="font-normal">
				{{ unsubscribeMessage }}
				<p class="mt-4">You can configure your notifications on the <NuxtLink to="/settings" class="underline">settings page</NuxtLink>.</p>
			</Message>
		</div>
	</div>
</template>

<script setup lang="ts">
	definePageMeta({
		layout: 'info',
	});

	useHead({
		title: `Unsubscribed -`,
	});

	const route = useRoute();
	const emailType = computed(() => typeof route.query.type === 'string' ? formatEmailTypeLabel(route.query.type) : '');
	const unsubscribeMessage = computed(() => emailType.value
		? `Successfully unsubscribed from "${emailType.value}" emails.`
		: 'Successfully unsubscribed from probe emails.');

	function formatEmailTypeLabel (type: string) {
		type = type.trim();

		if (type === '') {
			return '';
		}

		const normalized = type.split(/[_-]+/).filter(Boolean).map(word => word.toLowerCase()).join('\u00A0');
		return normalized ? normalized.charAt(0).toUpperCase() + normalized.slice(1) : '';
	}
</script>
