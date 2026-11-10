import type { InjectionKey, Ref } from 'vue';
import { useAccount } from '~/store/account';
import { useAuth } from '~/store/auth';

// PROBE_ACCOUNT_KEY is passed from probe page to identify if current account is the owner of the probe.
export const PROBE_ACCOUNT_KEY: InjectionKey<Ref<string | null | undefined>> = Symbol('probeAccount');

export const useProbeEditing = (probeAccountId = inject(PROBE_ACCOUNT_KEY, ref())) => {
	const auth = useAuth();
	const account = useAccount();

	const foreign = computed(() => !!probeAccountId.value && probeAccountId.value !== account.current.id && !auth.adminMode);
	const hint = computed(() => foreign.value || account.canManageProbes ? null : 'Only organization admins can do this');

	return {
		hint,
		disabled: computed(() => foreign.value || !!hint.value),
	};
};
