import { useHardwareProbeAdoption } from '~/store/local-adoption';

export default defineNuxtPlugin((nuxtApp) => {
	nuxtApp.hook('app:mounted', () => {
		useHardwareProbeAdoption().startPolling();
	});
});
