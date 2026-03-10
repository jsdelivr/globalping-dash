import { customEndpoint } from '@directus/sdk';
import { defineStore } from 'pinia';
import { useAuth } from '~/store/auth';

export const LINK_TOKEN_STORAGE_KEY = 'token-from-link';
const REJECTED_PROBES_STORAGE_KEY = 'rejected-probes';
const ACCEPTED_PROBES_STORAGE_KEY = 'accepted-probes';

const SHORT_REFRESH_MS = 5000 as const;
const LONG_REFRESH_MS = 60000 as const;

type UnadoptedProbe = {
	city: string;
	country: string;
	network: string;
	publicIp: string;
	localIps: string[];
};

type AdoptableProbe = {
	city: string;
	country: string;
	network: string;
	publicIp: string;
	localIp: string;
};

interface HardwareProbeAdoptionState {
	fetchTimeout: ReturnType<typeof setTimeout> | undefined;
	tokenValidityCheckInterval: ReturnType<typeof setTimeout> | undefined;
	fetchTimeoutLength: typeof SHORT_REFRESH_MS | typeof LONG_REFRESH_MS;
	adoptableProbes: Map<string, { fetchedAt: number; probe: AdoptableProbe; token: string | null }>; // key == token or ip
	rejectedProbes: Record<string, string>;
	acceptedProbes: Record<string, string>;
	isIdlePolling: boolean;
	activeProbe: AdoptableProbe & { token: string | null } | null;
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
		rejectedProbes: useLocalStorage<Record<string, string>>(REJECTED_PROBES_STORAGE_KEY, Object.create(null)) as unknown as Record<string, string>,
		acceptedProbes: useLocalStorage<Record<string, string>>(ACCEPTED_PROBES_STORAGE_KEY, Object.create(null)) as unknown as Record<string, string>,
		isIdlePolling: true,
		activeProbe: null,
		isFetchingProbes: false,
		localNetworkAccess: undefined,
		showLocalNetworkAccessPopup: false,
		localNetworkAccessPopupShown: false,
	}),

	actions: {
		async findLocalProbes () {
			const { $directus } = useNuxtApp();
			const config = useRuntimeConfig().public;

			this.clearExpiredData();

			try {
				let localProbes = await $directus.request(customEndpoint<UnadoptedProbe[]>({
					path: '/local-adoption/',
				}));

				localProbes = localProbes
					.filter(probe => probe.localIps.length > 1 || (probe.localIps.length === 1 && !this.isKnownIdentifier(probe.localIps[0])));

				if (localProbes.length > 0 && this.localNetworkAccess === 'prompt' && !this.localNetworkAccessPopupShown && this.isIdlePolling) {
					this.localNetworkAccessPopupShown = true;
					this.showLocalNetworkAccessPopup = true;
				}

				// for each probe, try to get its token directly, if we cannot make background HTTP requests in the LAN and the probe only has
				// one private IP, save it -- its token can be accessed via a redirect in the browser
				await Promise.all(localProbes.map(async (probe) => {
					let tokenFound = false;

					try {
						const fetchPromises = probe.localIps.map(async (probeIp) => {
							const safeIp = probeIp.includes(':') ? `[${probeIp}]` : probeIp;

							const { token } = await $fetch<{ token: string }>(`http://${safeIp}:${config.probeAdoptionPort}/`, {
								timeout: 2000,
							});

							return { token, ip: safeIp };
						});

						const { token, ip } = await Promise.any(fetchPromises);

						if (!Object.hasOwn(this.acceptedProbes, token)
							&& !Object.hasOwn(this.acceptedProbes, ip)
							&& ((!Object.hasOwn(this.rejectedProbes, token) && !Object.hasOwn(this.rejectedProbes, ip)) || !this.isIdlePolling)
						) {
							const probeDetails = {
								localIp: ip,
								city: probe.city,
								country: probe.country,
								network: probe.network,
								publicIp: probe.publicIp,
							};

							this.adoptableProbes.set(token, { fetchedAt: Date.now(), probe: probeDetails, token });
						}

						tokenFound = true;
					} catch (e) {
						console.error('Failed to fetch probe token from all local IPs:', e);
					}

					if (!tokenFound && probe.localIps.length === 1 && this.localNetworkAccess === 'granted') {
						const localIp = probe.localIps[0]!;

						if (!Object.hasOwn(this.acceptedProbes, localIp) && (!Object.hasOwn(this.rejectedProbes, localIp) || !this.isIdlePolling)) {
							const probeDetails = {
								localIp,
								city: probe.city,
								country: probe.country,
								network: probe.network,
								publicIp: probe.publicIp,
								token: null,
							};

							this.adoptableProbes.set(localIp, { fetchedAt: Date.now(), probe: probeDetails, token: null });
						}
					}
				}));
			} catch (e) {
				console.error('Error fetching unadopted probes:', e);
			}

			await this.updateActiveProbe();
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

		async onConfirmAdoption (token: string, ip: string) {
			const newProbe = await this.adoptProbe(token);
			this.adoptableProbes.delete(token);
			this.adoptableProbes.delete(ip);
			this.acceptProbe(token, ip);
			void this.updateActiveProbe();

			return newProbe;
		},

		onRejectAdoption (token: string | null, ip: string) {
			token && this.adoptableProbes.delete(token);
			this.adoptableProbes.delete(ip);
			this.rejectProbe(token, ip);
			void this.updateActiveProbe();
		},

		rejectProbe (...identifiers: (string | null)[]) {
			identifiers.forEach(id => id && (this.rejectedProbes[id] = new Date().toISOString()));
		},

		acceptProbe (...identifiers: (string | null)[]) {
			identifiers.forEach(id => id && (this.acceptedProbes[id] = new Date().toISOString()));
		},

		enforceRejectedProbes () {
			if (!this.isIdlePolling) {
				return;
			}

			this.adoptableProbes.forEach((_, id) => {
				if (this.isKnownIdentifier(id)) {
					this.adoptableProbes.delete(id);
				}
			});

			if (!this.isActiveProbeValid()) {
				this.activeProbe = null;
				void this.updateActiveProbe();
			}
		},

		enableIdlePolling () {
			this.fetchTimeoutLength = LONG_REFRESH_MS;
			this.isIdlePolling = true;

			this.enforceRejectedProbes();
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

			// regularly check if accepted tokens/ips changed (e.g., via another browser tab)
			this.tokenValidityCheckInterval = setInterval(() => {
				this.adoptableProbes.forEach((_, id) => {
					if (Object.hasOwn(this.acceptedProbes, id)) {
						this.adoptableProbes.delete(id);
					}
				});

				if (!this.isActiveProbeValid()) {
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

			this.findLocalProbes().finally(() => {
				this.isFetchingProbes = false;

				this.fetchTimeout = setTimeout(() => {
					this.startPolling();
				}, this.fetchTimeoutLength);
			}).catch(console.error);
		},

		clearExpiredData () {
			const now = Date.now();

			// first, clear local storage data
			for (const [ token, timestamp ] of Object.entries(this.rejectedProbes)) {
				if (now - Date.parse(timestamp) >= 1000 * 60 * 60) {
					Reflect.deleteProperty(this.rejectedProbes, token);
				}
			}

			for (const [ token, timestamp ] of Object.entries(this.acceptedProbes)) {
				if (now - Date.parse(timestamp) >= 1000 * 60 * 10) {
					Reflect.deleteProperty(this.acceptedProbes, token);
				}
			}

			// next, clear local map data
			this.adoptableProbes.forEach((entry, key) => {
				if (now - entry.fetchedAt >= 1000 * 61) {
					this.adoptableProbes.delete(key);
				}
			});

			// check if the active probe is still valid
			if (!this.isActiveProbeValid()) {
				this.activeProbe = null;
			}
		},

		async updateActiveProbe () {
			if (this.isActiveProbeValid()) {
				return;
			}

			if (!this.adoptableProbes.size) {
				this.activeProbe = null;
				return;
			}

			const { probe, token } = this.adoptableProbes.values().next().value!;
			this.activeProbe = { ...probe, token };
		},

		isKnownIdentifier (id: string | null | undefined) {
			return id && ((this.rejectedProbes[id] && this.isIdlePolling) || this.acceptedProbes[id]);
		},

		isActiveProbeValid () {
			return this.activeProbe && !this.isKnownIdentifier(this.activeProbe?.token) && !this.isKnownIdentifier(this.activeProbe?.localIp);
		},

		// https://wicg.github.io/local-network-access/
		async setupLocalNetworkAccess () {
			// https://www.reddit.com/r/webdev/comments/1qiz2p1/fun_fact_running_navigatorpermissionsquery_name/
			const match = navigator.userAgent.match(/Chrome\/(\d+)/);
			const version = match ? Number.parseInt(match[1]!) : 0;

			if (match && version < 137) {
				this.localNetworkAccess = 'granted';
				return;
			}

			// https://wicg.github.io/local-network-access/#integration-with-permissions
			const setNetworkAccessWithPermission = async (name: string) => {
				return navigator.permissions.query({ name: name as PermissionName }).then((status) => {
					this.localNetworkAccess = status.state;

					if (status.state !== 'prompt') {
						this.showLocalNetworkAccessPopup = false;
					}

					status.onchange = () => {
						this.localNetworkAccess = status.state;

						if (status.state === 'granted') {
							this.startPolling();
						}

						if (status.state !== 'prompt') {
							this.showLocalNetworkAccessPopup = false;
						}
					};
				});
			};

			return setNetworkAccessWithPermission('local-network')
				.catch(() => setNetworkAccessWithPermission('local-network-access'))
				.catch(() => {
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
			this.rejectedProbes = Object.create(null);
			this.acceptedProbes = Object.create(null);
			this.isIdlePolling = true;
			this.localNetworkAccessPopupShown = false;
			this.isFetchingProbes = false;
			this.fetchTimeoutLength = LONG_REFRESH_MS;
		},

		// When we receive a token via a probe redirect, save it into localStorage and continue in the original window
		setTokenFromLink () {
			const token = useRoute().query.adopt as string | undefined;

			if (token) {
				localStorage.setItem(LINK_TOKEN_STORAGE_KEY, token);
				window.close();
			}
		},
	},
});
