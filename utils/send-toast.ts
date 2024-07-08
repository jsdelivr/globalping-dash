export const sendToast = (error: unknown) => {
	const toastService = useToastService();
	const e = error as DashboardError;

	const summary = e.response?.statusText ?? 'Error';
	const detail = e.errors?.[0]?.message ?? e.errors ?? e.message ?? 'Request failed';
	toastService.add({ severity: 'error', summary, detail, life: 20000 });
};
