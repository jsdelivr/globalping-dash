import { useDebounce } from '@vueuse/core';
import { ref, provide, inject, type ComputedRef, type Ref, shallowRef } from 'vue';

const ADMIN_FUNCTIONALITY_KEY = Symbol('admin-functionality');

export interface AdminFunctionality {
	adminMode: Ref<boolean>;
	impersonatedUser: string;
	debouncedImpersonatedUser: ComputedRef<string>;
	setImpersonatedUser: (username: string) => void;
}

export const useAdminFunctionality = () => {
	const adminMode = ref(false);
	const impersonatedUser = shallowRef('');

	const debouncedImpersonatedUser = useDebounce(impersonatedUser, 500);

	const setImpersonatedUser = (username: string) => {
		impersonatedUser.value = username;
	};

	return {
		adminMode,
		impersonatedUser,
		setImpersonatedUser,
		debouncedImpersonatedUser,
	};
};

export const provideAdminFunctionality = () => {
	const { adminMode, impersonatedUser, debouncedImpersonatedUser, setImpersonatedUser } = useAdminFunctionality();

	provide(ADMIN_FUNCTIONALITY_KEY, { adminMode, impersonatedUser, debouncedImpersonatedUser, setImpersonatedUser });

	return { adminMode, impersonatedUser, debouncedImpersonatedUser, setImpersonatedUser };
};

export const injectAdminFunctionality = () => {
	const adminFunctionality = inject<AdminFunctionality>(ADMIN_FUNCTIONALITY_KEY);

	if (!adminFunctionality) {
		throw new Error('Admin functionality not provided');
	}

	return adminFunctionality;
};
