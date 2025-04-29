import { storeToRefs } from 'pinia';
import { injectAdminFunctionality } from './useAdminFunctionality';
import { useAuth } from '~/store/auth';

export function useUserFilter () {
	const auth = useAuth();
	const { user } = storeToRefs(auth);
	const { adminMode, debouncedImpersonatedUser } = injectAdminFunctionality();

	const getUserFilter = () => {
		if (adminMode.value) {
			return {};
		}

		if (debouncedImpersonatedUser.value) {
			return {
				userId: { _eq: debouncedImpersonatedUser.value },
			};
		}

		return {
			userId: { _eq: user.value.id },
		};
	};

	return {
		getUserFilter,
		adminMode,
		debouncedImpersonatedUser,
	};
}
