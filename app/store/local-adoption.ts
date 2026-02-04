import { customEndpoint } from '@directus/sdk';
import { defineStore } from 'pinia';
import { useAuth } from '~/store/auth';

const TOKEN_STORAGE_KEY = 'rejected-probe-tokens';

const SHORT_REFRESH_MS = 5000 as const;
const LONG_REFRESH_MS = 60000 as const;

interface HardwareProbeAdoptionState {
	fetchTimeout: NodeJS.Timeout | undefined;
	fetchTimeoutLength: typeof SHORT_REFRESH_MS | typeof LONG_REFRESH_MS;
	adoptableProbes: Map<string, number>;
	ignoredTokens: Record<string, string>;
	adoptionModalOpen: boolean;
	activeProbe: Pick<Probe, 'ip' | 'city' | 'country' | 'network'> & { token: string } | null;
}

export const useHardwareProbeAdoption = defineStore('hardware-probe-adoption', {
	state: (): HardwareProbeAdoptionState => ({
		fetchTimeout: undefined,
		fetchTimeoutLength: LONG_REFRESH_MS,
		adoptableProbes: new Map(),
		ignoredTokens: useLocalStorage<Record<string, string>>(TOKEN_STORAGE_KEY, Object.create(null)).value,
		adoptionModalOpen: false,
		activeProbe: null,
	}),

	actions: {
		async checkProbes () {
			const auth = useAuth();
			const { $directus } = useNuxtApp();
			const config = useRuntimeConfig().public;

			if (!auth.isLoggedIn) {
				return;
			}

			this.clearOldTokens();

			try {
				const localProbeIps = await $directus.request(customEndpoint<string[]>({
					method: 'GET',
					path: '/unadopted-probes/',
				}));

				await Promise.all(localProbeIps.map(async (probeIp) => {
					try {
						const safeIp = probeIp.includes(':') ? `[${probeIp}]` : probeIp;

						const { token } = await $fetch<{ token: string }>(`http://${safeIp}:${config.probeAdoptionPort}/`, {
							timeout: 2000,
						});

						if (token && !Object.hasOwn(this.ignoredTokens, token)) {
							this.adoptableProbes.set(token, Date.now());
						}
					} catch (e) {
						console.error('Error fetching probe token:', e);
					}
				}));
			} catch (e) {
				console.error('Error fetching unadopted probes:', e);
			}

			await this.updateCurrentProbe();
		},

		async adoptProbe (token: string) {
			const { $directus } = useNuxtApp();

			const probe = await $directus.request<Probe>(customEndpoint({
				method: 'POST',
				path: '/unadopted-probes/adopt',
				body: JSON.stringify({ token }),
			}));

			refreshNuxtData('gp_probes');
			return probe;
		},

		async onConfirmAdoption (token: string) {
			const newProbe = await this.adoptProbe(token);
			this.adoptableProbes.delete(token);
			this.ignoreToken(token);
			this.updateCurrentProbe();

			return newProbe;
		},

		onRejectAdoption (token: string) {
			this.adoptableProbes.delete(token);
			this.ignoreToken(token);
			this.updateCurrentProbe();
		},

		ignoreToken (token: string) {
			this.ignoredTokens[token] = new Date().toISOString();
			const storage = useLocalStorage<Record<string, string>>(TOKEN_STORAGE_KEY, Object.create(null));
			storage.value = this.ignoredTokens;
		},

		onAdoptionModalChange (isOpen: boolean) {
			this.fetchTimeoutLength = isOpen ? SHORT_REFRESH_MS : LONG_REFRESH_MS;
			this.adoptionModalOpen = isOpen;
			this.startPolling();
		},

		startPolling () {
			if (this.fetchTimeout) {
				clearTimeout(this.fetchTimeout);
			}

			this.checkProbes().finally(() => {
				this.fetchTimeout = setTimeout(() => {
					this.startPolling();
				}, this.fetchTimeoutLength);
			}).catch(console.error);
		},

		clearOldTokens () {
			// first, clear local storage data
			const storage = useLocalStorage<Record<string, string>>(TOKEN_STORAGE_KEY, {});
			const now = Date.now();
			const validTokens: Record<string, string> = {};

			for (const [ token, timestamp ] of Object.entries(storage.value)) {
				if (now - Date.parse(timestamp) < 1000 * 60 * 60) {
					validTokens[token] = timestamp;
				}
			}

			storage.value = validTokens;

			// next, clear local map data
			const tokensToRemove: string[] = [];

			this.adoptableProbes.forEach((fetchedAt, key) => {
				if (now - fetchedAt >= 1000 * 60) {
					tokensToRemove.push(key);
				}
			});

			tokensToRemove.forEach(t => this.adoptableProbes.delete(t));
		},

		async updateCurrentProbe () {
			if (this.activeProbe && this.adoptableProbes.has(this.activeProbe.token)) {
				return;
			}

			if (!this.adoptableProbes.size) {
				this.activeProbe = null;
				return;
			}

			const { $directus } = useNuxtApp();
			const token = this.adoptableProbes.keys().next().value!;

			try {
				const probe = await $directus.request<Pick<Probe, 'ip' | 'city' | 'country' | 'network'>>(customEndpoint({ path: `/unadopted-probes/${token}` }));
				this.activeProbe = { ...probe, token };
			} catch (e) {
				console.error('Error fetching probe details:', e);
				this.activeProbe = null;
			}
		},
	},
});
