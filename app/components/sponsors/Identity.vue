<template>
	<span class="flex min-w-0 items-center gap-1.5">
		<a
			v-if="githubLogin"
			class="min-w-0 font-semibold text-inherit underline transition-none hover:text-inherit"
			:class="wrap ? 'break-words' : 'truncate'"
			:href="`https://github.com/${githubLogin}`"
			:title="githubLogin"
			target="_blank"
			rel="noopener">{{ githubLogin }}</a>
		<span v-else class="min-w-0" :class="wrap ? 'break-words' : 'truncate'">GitHub ID {{ githubId }}</span>
		<i
			v-if="redirectTarget"
			v-tooltip.top="`Credits redirected to ${redirectTarget}`"
			class="pi pi-share-alt shrink-0 text-xs text-bluegray-400 focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
			tabindex="0"
			role="img"
			:aria-label="`Credits redirected to ${redirectTarget}`"
			@focus="forwardTooltipFocus"
			@blur="forwardTooltipFocus"/>
		<i v-if="dashboardAccountId" v-tooltip.top="'Dashboard account linked'" role="img" class="pi pi-user shrink-0 text-xs text-bluegray-400" aria-label="Dashboard account linked"/>
	</span>
</template>

<script setup lang="ts">
	// PrimeVue binds either hover or focus, so forward focus to keep both triggers.
	const forwardTooltipFocus = (event: FocusEvent) => {
		(event.currentTarget as HTMLElement).dispatchEvent(new Event(event.type === 'focus' ? 'mouseenter' : 'mouseleave'));
	};

	defineProps<{
		githubLogin: string | null;
		githubId: string;
		dashboardAccountId: string | null;
		redirectTarget?: string | null;
		wrap?: boolean;
	}>();
</script>
