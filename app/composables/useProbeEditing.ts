import type { InjectionKey, Ref } from 'vue';
import { useAccount } from '~/store/account';
import { useAuth } from '~/store/auth';

// PROBE_ACCOUNT_KEY is passed from probe page to identify if current account is the owner of the probe.
export const PROBE_ACCOUNT_KEY: InjectionKey<Ref<string | null | undefined>> = Symbol('probeAccount');

export const useProbeEditing = (probeAccountId = inject(PROBE_ACCOUNT_KEY, ref())) => {
	const auth = useAuth();
	const account = useAccount();

	const hint = computed(() => {
		const ownerId = probeAccountId.value;

		if (ownerId && ownerId !== account.current.id && !auth.adminMode) {
			return ownerId === account.personal.id
				? 'This is your personal probe, switch to your personal account'
				: 'This is an organization probe, switch to the organization account';
		}

		return account.canManageProbes ? null : 'Only organization admins can do this';
	});

	return {
		hint,
		disabled: computed(() => !!hint.value),
	};
};
