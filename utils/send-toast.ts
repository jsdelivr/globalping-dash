import type { ToastMessageOptions } from 'primevue/toast';
import { useToastService } from '~/composables/useToastService';

export const sendToast = (severity: ToastMessageOptions['severity'], summary: string, detail: string = '') => {
	const toastService = useToastService();
	toastService.add({ severity, summary, detail, life: 5000 });
};

export const sendErrorToast = (error: unknown) => {
	console.error(error);
	const toastService = useToastService();
	const e = error as DashboardError;

	const summary = e.response?.statusText ?? 'Error';
	const detail = e.errors?.[0]?.message ?? e.errors ?? e.message ?? 'Request failed';
	toastService.add({ severity: 'error', summary, detail, life: 20000 });
};
