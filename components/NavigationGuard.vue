<template>
	<GPDialog
		v-model:visible="showNavigationConfirm"
		header="Unsaved changes"
	>
		<div class="flex items-center">
			<div>
				<i class="pi pi-exclamation-triangle text-xl text-primary"/>
			</div>
			<div class="ml-3">
				<p>You have unsaved changes. Are you sure you want to leave?</p>
			</div>
		</div>
		<div class="mt-7 text-right">
			<Button class="mr-2" label="Cancel" severity="secondary" text @click="handleNavigationReject"/>
			<Button label="Leave" @click="handleNavigationAccept"/>
		</div>
	</GPDialog>
</template>

<script setup lang="ts">
	import { onMounted, onUnmounted, ref } from 'vue';
	import { useRouter, type RouteLocationNormalized, type NavigationGuardNext } from 'vue-router';

	declare global {
		interface Window {
			hasDirtyForm?: boolean;
		}
	}

	const router = useRouter();
	const showNavigationConfirm = ref(false);
	const pendingNavigation = ref<NavigationGuardNext | null>(null);

	const handleBeforeUnload = (e: BeforeUnloadEvent) => {
		if (window.hasDirtyForm) {
			e.preventDefault();
			e.returnValue = '';
		}
	};

	const handleNavigation = (_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
		if (window.hasDirtyForm) {
			pendingNavigation.value = next;
			showNavigationConfirm.value = true;
		} else {
			next();
		}
	};

	const handleNavigationAccept = () => {
		pendingNavigation.value?.();
		pendingNavigation.value = null;
		showNavigationConfirm.value = false;
		window.hasDirtyForm = false;
	};

	const handleNavigationReject = () => {
		pendingNavigation.value?.(false);
		pendingNavigation.value = null;
		showNavigationConfirm.value = false;
	};

	onMounted(() => {
		window.addEventListener('beforeunload', handleBeforeUnload);
		router.beforeEach(handleNavigation);
	});

	onUnmounted(() => {
		window.removeEventListener('beforeunload', handleBeforeUnload);
		router.beforeEach(handleNavigation);
	});
</script>
