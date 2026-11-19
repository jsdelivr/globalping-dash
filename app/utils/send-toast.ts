import type { ToastMessageOptions } from 'primevue/toast';
import { useToastService } from '~/composables/useToastService';

export const sendToast = (severity: ToastMessageOptions['severity'], summary: string, detail: string = '') => {
	const toastService = useToastService();
	toastService.add({ severity, summary, detail, life: 5000 });
};

export const getErrorMessage = (error: unknown) => {
	const e = error as DashboardError;
	return String(e.errors?.[0]?.message ?? e.errors ?? e.message ?? 'Request failed');
};

export const sendErrorToast = (error: unknown) => {
	console.error(error);
	const toastService = useToastService();
	const summary = (error as DashboardError).response?.statusText ?? 'Error';

	toastService.add({ severity: 'error', summary, detail: getErrorMessage(error), life: 20000 });
};
