import { useHardwareProbeAdoption } from '~/store/local-adoption';

export default defineNuxtPlugin((nuxtApp) => {
	nuxtApp.hook('app:mounted', () => {
		const store = useHardwareProbeAdoption();
		store.setTokenFromLink();
		store.setupLocalNetworkAccess().then(() => store.startPolling()).catch(console.error);
	});
});
