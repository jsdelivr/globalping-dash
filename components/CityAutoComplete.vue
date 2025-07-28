<template>
	<!-- TODO: move the input classes into template -->
	<AutoComplete
		v-model="model"
		input-id="autocompleteInput"
		:suggestions="citySuggestions"
		loader="null"
		class="relative w-full rounded-none [&>input]:w-full [&>input]:rounded-none [&>input]:rounded-r-md [&>input]:border-none"
		:class="{ 'cursor-pointer': !isEditingCity }"
		aria-label="City name"
		:delay="0"
		@keyup.enter="(event: KeyboardEvent) => emit('confirm', event)"
		@keyup.esc="emit('cancel')"
	/>
</template>

<script setup lang="ts">

	defineProps({
		isEditingCity: {
			type: Boolean as PropType<boolean>,
			required: true,
		},
	});

	const emit = defineEmits<{
		(e: 'cancel'): void;
		(e: 'confirm', ev: KeyboardEvent): void;
	}>();

	const model = defineModel<string>({ required: true });
	const inputRef = defineModel<HTMLInputElement | null>('inputRef', { required: true }); // TODO probably remove the required prop
	const debouncedCity = ref<string>(''); // for useFetch
	const citySuggestions = ref<string[]>([]);

	// TODO: add new city EP when ready
	const { data, status } = await useFetch('TODO', {
		query: { name: debouncedCity, country: model },
	});

	onMounted(() => {
		inputRef.value = document.getElementById('autocompleteInput') as HTMLInputElement | null;
	});

	watchDebounced(
		model,
		() => { debouncedCity.value = model.value; },
		{ debounce: 300 },
	);

	watch([ data, status ], ([ newData, newStatus ]) => {
		if (newStatus === 'pending') {
			return;
		}

		if (Array.isArray(newData)) {
			citySuggestions.value = newData.map(el => el.name);
		} else {
			citySuggestions.value = [];
		}
	});

</script>
