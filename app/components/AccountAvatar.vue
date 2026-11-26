<template>
	<span class="inline-flex shrink-0 items-center justify-center overflow-hidden" aria-hidden="true">
		<img
			v-if="githubId && /^\d+$/.test(githubId) && failedId !== githubId"
			:key="githubId"
			ref="image"
			:src="`${config.public.gpSiteUrl}/avatar/github/${avatarId}?size=80`"
			class="size-full object-cover"
			alt=""
			@error="onImageError"
		>
		<i v-else :class="icon"/>
	</span>
</template>

<script setup lang="ts">
	const props = defineProps<{ githubId?: string; icon?: string }>();
	const config = useRuntimeConfig();

	// Show sample avatars for the synthetic IDs in the Directus development seeds.
	const developmentAvatarIds: Partial<Record<string, string>> = {
		1234567890: '583231', // john → Octocat
		1234567892: '1', // turk → mojombo
		2000000002: '480938', // teammate → Hubot
		9000000001: '6191378', // admin-org → jsDelivr
		9000000002: '102991324', // member-org → Globalping
		9000000003: '6128107', // viewer-org → Vue.js
		9000000010: '6078720', // unclaimed-org → npm
	};

	const avatarId = computed(() => {
		const id = props.githubId;
		return import.meta.dev && id ? developmentAvatarIds[id] ?? id : id;
	});

	const image = useTemplateRef<HTMLImageElement>('image');
	const failedId = ref<string>();

	const onImageError = (event: Event) => {
		if (event.currentTarget === image.value) {
			failedId.value = props.githubId;
		}
	};

	// the error event may fire inside a pending Suspense, before the template ref is set
	onMounted(() => {
		if (image.value?.complete && !image.value.naturalWidth) {
			failedId.value = props.githubId;
		}
	});
</script>
