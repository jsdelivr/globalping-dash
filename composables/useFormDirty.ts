export function useFormDirty<T> (initialValue: T, isDirty: (current: T) => boolean) {
	const isFormDirty = inject<Ref<boolean>>('form-dirty');

	if (!isFormDirty) {
		throw new Error('useFormDirty must be used within a component that provides form-dirty state');
	}

	onMounted(() => {
		const checkFormDirty = () => {
			isFormDirty.value = isDirty(initialValue);
		};

		checkFormDirty();

		watch(() => isDirty(initialValue), () => {
			checkFormDirty();
		}, { deep: true });
	});

	return () => {
		isFormDirty.value = false;
	};
}
