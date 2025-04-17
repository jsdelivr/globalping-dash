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
	import { useRouter, type RouteLocationNormalized, type NavigationGuardNext } from 'vue-router';

	const router = useRouter();
	const showNavigationConfirm = ref(false);
	const pendingNavigation = ref<NavigationGuardNext | null>(null);
	const isFormDirty = inject<Ref<boolean>>('form-dirty');

	const handleBeforeUnload = (e: BeforeUnloadEvent) => {
		if (isFormDirty?.value) {
			e.preventDefault();
			e.returnValue = '';
		}
	};

	const handleNavigation = (_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
		if (isFormDirty?.value) {
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

		if (isFormDirty) {
			isFormDirty.value = false;
		}
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
	});
</script>
