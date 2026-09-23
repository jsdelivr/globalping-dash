<template>
	<span class="flex min-w-0 items-center gap-1.5">
		<a
			v-if="githubLogin"
			class="min-w-0 truncate font-semibold text-inherit underline transition-none hover:text-inherit"
			:href="`https://github.com/${githubLogin}`"
			:title="githubLogin"
			target="_blank"
			rel="noopener">{{ githubLogin }}</a>
		<span v-else class="min-w-0 truncate">GitHub ID {{ githubId }}</span>
		<i v-if="dashboardUserId" v-tooltip.top="'Dashboard account linked'" class="pi pi-user shrink-0 text-xs text-bluegray-400" aria-label="Dashboard account linked"/>
	</span>
</template>

<script setup lang="ts">
	defineProps<{
		githubLogin: string | null;
		githubId: string;
		dashboardUserId: string | null;
	}>();
</script>
