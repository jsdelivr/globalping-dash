
export const errorHandler = (e: any) => {
	const toastService = useToastService();

	const summary = e?.response?.statusText ?? 'Error';
	const detail = e.errors?.[0]?.message ?? e.errors ?? e.message ?? 'Request failed';
	toastService.add({ severity: 'error', summary, detail, life: 20000 });
};
