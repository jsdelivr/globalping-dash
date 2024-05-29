import FocusTrap from 'primevue/focustrap';

export default defineNuxtPlugin((nuxtApp) => {
	nuxtApp.vueApp.directive('focustrap', FocusTrap);
});
