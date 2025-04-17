import { onMounted, watch } from 'vue';

export function useFormDirty<T> (initialValue: T, isDirty: (current: T) => boolean) {
	onMounted(() => {
		const checkFormDirty = () => {
			Object.assign(window, { hasDirtyForm: isDirty(initialValue) });
		};

		checkFormDirty();

		watch(() => isDirty(initialValue), checkFormDirty);
	});
}
