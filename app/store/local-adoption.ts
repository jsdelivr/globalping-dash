import { customEndpoint } from '@directus/sdk';
import { defineStore } from 'pinia';
import { useAuth } from '~/store/auth';

const REJECTED_TOKEN_STORAGE_KEY = 'rejected-probe-tokens';
const ACCEPTED_TOKEN_STORAGE_KEY = 'accepted-probe-tokens';

const SHORT_REFRESH_MS = 5000 as const;
const LONG_REFRESH_MS = 60000 as const;

interface HardwareProbeAdoptionState {
	fetchTimeout: ReturnType<typeof setTimeout> | undefined;
	tokenValidityCheckInterval: ReturnType<typeof setTimeout> | undefined;
	fetchTimeoutLength: typeof SHORT_REFRESH_MS | typeof LONG_REFRESH_MS;
	adoptableProbes: Map<string, number>;
	ignoredTokens: Record<string, string>;
	acceptedTokens: Record<string, string>;
	isIdlePolling: boolean;
	activeProbe: Pick<Probe, 'ip' | 'city' | 'country' | 'network'> & { token: string } | null;
	isFetchingProbes: boolean;
	localNetworkAccess: 'granted' | 'denied' | 'prompt' | undefined;
	showLocalNetworkAccessPopup: boolean;
	localNetworkAccessPopupShown: boolean;
}

export const useHardwareProbeAdoption = defineStore('hardware-probe-adoption', {
	state: (): HardwareProbeAdoptionState => ({
		fetchTimeout: undefined,
		tokenValidityCheckInterval: undefined,
		fetchTimeoutLength: LONG_REFRESH_MS,
		adoptableProbes: new Map(),
		ignoredTokens: useLocalStorage<Record<string, string>>(REJECTED_TOKEN_STORAGE_KEY, Object.create(null)) as unknown as Record<string, string>,
		acceptedTokens: useLocalStorage<Record<string, string>>(ACCEPTED_TOKEN_STORAGE_KEY, Object.create(null)) as unknown as Record<string, string>,
		isIdlePolling: true,
		activeProbe: null,
		isFetchingProbes: false,
		localNetworkAccess: undefined,
		showLocalNetworkAccessPopup: false,
		localNetworkAccessPopupShown: false,
	}),

	actions: {
		async checkProbes () {
			const { $directus } = useNuxtApp();
			const config = useRuntimeConfig().public;

			this.clearOldTokens();

			try {
				const localProbeIps = await $directus.request(customEndpoint<string[]>({
					method: 'GET',
					path: '/local-adoption/',
				}));

				if (localProbeIps.length > 0 && this.localNetworkAccess === 'prompt' && !this.localNetworkAccessPopupShown) {
					this.localNetworkAccessPopupShown = true;
					this.showLocalNetworkAccessPopup = true;
				}

				await Promise.all(localProbeIps.map(async (probeIp) => {
					try {
						const safeIp = probeIp.includes(':') ? `[${probeIp}]` : probeIp;

						const { token } = await $fetch<{ token: string }>(`http://${safeIp}:${config.probeAdoptionPort}/`, {
							timeout: 2000,
						});

						if (token && !Object.hasOwn(this.acceptedTokens, token) && (!Object.hasOwn(this.ignoredTokens, token) || !this.isIdlePolling)) {
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
				path: '/local-adoption/adopt',
				body: JSON.stringify({ token }),
			}));

			refreshNuxtData('gp_probes');
			return probe;
		},

		async onConfirmAdoption (token: string) {
			const newProbe = await this.adoptProbe(token);
			this.adoptableProbes.delete(token);
			this.acceptToken(token);
			void this.updateCurrentProbe();

			return newProbe;
		},

		onRejectAdoption (token: string) {
			this.adoptableProbes.delete(token);
			this.ignoreToken(token);
			void this.updateCurrentProbe();
		},

		ignoreToken (token: string) {
			this.ignoredTokens[token] = new Date().toISOString();
		},

		acceptToken (token: string) {
			this.acceptedTokens[token] = new Date().toISOString();
		},

		enforceIgnoredTokens () {
			if (!this.isIdlePolling) {
				return;
			}

			this.adoptableProbes.forEach((_, token) => {
				if (Object.hasOwn(this.ignoredTokens, token) || Object.hasOwn(this.acceptedTokens, token)) {
					this.adoptableProbes.delete(token);
				}
			});

			if (this.activeProbe && (Object.hasOwn(this.ignoredTokens, this.activeProbe.token) || Object.hasOwn(this.acceptedTokens, this.activeProbe.token))) {
				this.activeProbe = null;
				void this.updateCurrentProbe();
			}
		},

		enableIdlePolling () {
			this.fetchTimeoutLength = LONG_REFRESH_MS;
			this.isIdlePolling = true;

			this.enforceIgnoredTokens();
			this.startPolling();
			this.stopBackgroundTokenCheck();
		},

		disableIdlePolling () {
			this.fetchTimeoutLength = SHORT_REFRESH_MS;
			this.isIdlePolling = false;
			this.startPolling();
			this.startBackgroundTokenCheck();
		},

		startBackgroundTokenCheck () {
			clearInterval(this.tokenValidityCheckInterval);

			// regularly check if accepted tokens changed (e.g., via another browser tab)
			this.tokenValidityCheckInterval = setInterval(() => {
				this.adoptableProbes.forEach((_, token) => {
					if (Object.hasOwn(this.acceptedTokens, token)) {
						this.adoptableProbes.delete(token);
					}
				});

				if (this.activeProbe && !this.adoptableProbes.has(this.activeProbe.token)) {
					this.activeProbe = null;
				}
			}, 1000);
		},

		stopBackgroundTokenCheck () {
			clearInterval(this.tokenValidityCheckInterval);
		},

		startPolling () {
			if (this.localNetworkAccess === 'denied' || !useAuth().isLoggedIn) {
				return;
			}

			if (this.fetchTimeout) {
				clearTimeout(this.fetchTimeout);
			}

			// let checkProbes finish, it will set a new timeout
			if (this.isFetchingProbes) {
				return;
			}

			this.isFetchingProbes = true;

			this.checkProbes().finally(() => {
				this.isFetchingProbes = false;

				this.fetchTimeout = setTimeout(() => {
					this.startPolling();
				}, this.fetchTimeoutLength);
			}).catch(console.error);
		},

		clearOldTokens () {
			const now = Date.now();

			// first, clear local storage data
			for (const [ token, timestamp ] of Object.entries(this.ignoredTokens)) {
				if (now - Date.parse(timestamp) >= 1000 * 60 * 60) {
					Reflect.deleteProperty(this.ignoredTokens, token);
				}
			}

			for (const [ token, timestamp ] of Object.entries(this.acceptedTokens)) {
				if (now - Date.parse(timestamp) >= 1000 * 60 * 60) {
					Reflect.deleteProperty(this.acceptedTokens, token);
				}
			}

			// next, clear local map data
			const tokensToRemove: string[] = [];

			this.adoptableProbes.forEach((fetchedAt, key) => {
				if (now - fetchedAt >= 1000 * 61) {
					tokensToRemove.push(key);
				}
			});

			tokensToRemove.forEach(t => this.adoptableProbes.delete(t));

			// check if the active probe is still valid
			if (this.activeProbe && !this.adoptableProbes.has(this.activeProbe.token)) {
				this.activeProbe = null;
			}
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
				const probe = await $directus.request<Pick<Probe, 'ip' | 'city' | 'country' | 'network'>>(customEndpoint({ path: `/local-adoption/${token}` }));
				this.activeProbe = { ...probe, token };
			} catch (e) {
				console.error('Error fetching probe details:', e);
				this.activeProbe = null;
				this.adoptableProbes.delete(token);
			}
		},

		async setupLocalNetworkAccess () {
			// https://www.reddit.com/r/webdev/comments/1qiz2p1/fun_fact_running_navigatorpermissionsquery_name/
			const match = navigator.userAgent.match(/Chrome\/(\d+)/);
			const version = match ? Number.parseInt(match[1]!) : 0;

			if (match && version < 137) {
				this.localNetworkAccess = 'granted';
				return;
			}

			return navigator.permissions.query({ name: 'local-network' as PermissionName }).then((status) => {
				this.localNetworkAccess = status.state;

				if (status.state !== 'prompt') {
					this.showLocalNetworkAccessPopup = false;
				}

				status.onchange = () => {
					this.localNetworkAccess = status.state;

					if (status.state !== 'denied') {
						this.startPolling();
					}

					if (status.state !== 'prompt') {
						this.showLocalNetworkAccessPopup = false;
					}
				};
			}).catch(() => {
				this.localNetworkAccess = 'granted';
				this.showLocalNetworkAccessPopup = false;
			});
		},

		reset () {
			clearTimeout(this.fetchTimeout);
			clearInterval(this.tokenValidityCheckInterval);
			this.adoptableProbes.clear();
			this.activeProbe = null;
			this.showLocalNetworkAccessPopup = false;
			this.ignoredTokens = Object.create(null);
			this.acceptedTokens = Object.create(null);
			this.isIdlePolling = true;
			this.localNetworkAccessPopupShown = false;
			this.isFetchingProbes = false;
			this.fetchTimeoutLength = LONG_REFRESH_MS;
		},
	},
});
