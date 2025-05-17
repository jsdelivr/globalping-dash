import { storeToRefs } from 'pinia';
import { useAuth } from '~/store/auth';

export function useUserFilter () {
	const auth = useAuth();
	const { user } = storeToRefs(auth);

	const getUserFilter = (filterField: string) => {
		if (auth.isAdmin && auth.adminMode) {
			return {};
		}

		if (!user?.value) {
			throw new Error('User not found');
		}

		return {
			[filterField]: { _eq: filterField === 'github_id' ? user.value.external_identifier : user.value.id },
		};
	};

	return {
		getUserFilter,
	};
}
