import { usePrimeVue } from 'primevue/config';

export default defineNuxtPlugin(() => {
	const primevue = usePrimeVue();

	if (primevue?.config?.locale) {
		primevue.config.locale.firstDayOfWeek = 1;
	}
});
