import { storeToRefs } from 'pinia';
import { useAuth } from '~/store/auth';

export function useUserFilter () {
	const auth = useAuth();
	const { user } = storeToRefs(auth);

	const getUserFilter = (filterField: string): Record<string, { _eq: string } | undefined> => {
		if (auth.isAdmin && auth.adminMode) {
			return {};
		}

		if (!user?.value) {
			throw new Error('User not found');
		}

		if (filterField === 'github_id') {
			return {
				github_id: { _eq: user.value.external_identifier || 'admin' },
			};
		}

		return {
			[filterField]: { _eq: user.value.id },
		};
	};

	return {
		getUserFilter,
	};
}
