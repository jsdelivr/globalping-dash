import { useAccount } from '~/store/account';
import { useAuth } from '~/store/auth';

export function useUserFilter () {
	const auth = useAuth();
	const account = useAccount();

	const getUserFilter = (filterField: 'account_id' | 'github_id'): Record<string, { _eq: string } | undefined> => {
		if (auth.adminMode) {
			return {};
		}

		switch (filterField) {
			case 'account_id':
				return { account_id: { _eq: account.current.id } };
			case 'github_id':
				return { github_id: { _eq: account.current.github_id } };
		}
	};

	const getAccountIdOrAll = () => auth.adminMode ? 'all' : account.current.id;

	return {
		getUserFilter,
		getAccountIdOrAll,
	};
}
