<template>
	<GPDialog
		v-model:visible="showNavigationConfirm"
		header="Unsaved changes"
	>
		<div class="flex items-center gap-4">
			<div>
				<i class="pi pi-exclamation-triangle text-xl text-primary"/>
			</div>
			<div>
				<p>You have unsaved changes. Are you sure you want to leave?</p>
			</div>
		</div>
		<div class="mt-6 text-right">
			<Button class="mr-2" label="Cancel" severity="secondary" text @click="handleNavigationReject"/>
			<Button label="Leave" @click="handleNavigationAccept"/>
		</div>
	</GPDialog>
</template>

<script setup lang="ts">
	import type { RouteLocationNormalized, NavigationGuardNext } from 'vue-router';

	import { useAuth } from '~/store/auth';

	const router = useRouter();
	const auth = useAuth();
	const showNavigationConfirm = ref(false);
	const pendingConfirm = ref<((confirmed: boolean) => void) | null>(null);
	const isFormDirty = inject<Ref<boolean>>('form-dirty');

	const handleBeforeUnload = (e: BeforeUnloadEvent) => {
		if (isFormDirty?.value) {
			e.preventDefault();
			e.returnValue = '';
		}
	};

	// Once the session has ended (sign out, account deletion), unsaved changes can no longer be saved.
	const confirmLeave = () => new Promise<boolean>((resolve) => {
		if (isFormDirty?.value && auth.isLoggedIn) {
			pendingConfirm.value = resolve;
			showNavigationConfirm.value = true;
		} else {
			resolve(true);
		}
	});

	const handleNavigation = async (_to: RouteLocationNormalized, _from: RouteLocationNormalized, next: NavigationGuardNext) => {
		next(await confirmLeave());
	};

	const handleNavigationAccept = () => {
		pendingConfirm.value?.(true);
		pendingConfirm.value = null;
		showNavigationConfirm.value = false;

		if (isFormDirty) {
			isFormDirty.value = false;
		}
	};

	const handleNavigationReject = () => {
		pendingConfirm.value?.(false);
		pendingConfirm.value = null;
		showNavigationConfirm.value = false;
	};

	defineExpose({ confirmLeave });

	onMounted(() => {
		window.addEventListener('beforeunload', handleBeforeUnload);
		router.beforeEach(handleNavigation);

		const removeGuard = router.beforeEach(handleNavigation);
		const guardRemover = ref(removeGuard);

		onUnmounted(() => {
			window.removeEventListener('beforeunload', handleBeforeUnload);
			guardRemover.value();
		});
	});
</script>
