<template>
	<!-- TODO: move the input classes into template -->
	<AutoComplete
		v-model="model"
		input-id="autocompleteInput"
		:suggestions="citySuggestions"
		loader="null"
		class="relative w-full rounded-none [&>input]:w-full [&>input]:rounded-none [&>input]:rounded-r-md [&>input]:border-none"
		:class="{ '[&>input]:cursor-pointer': !isEditingCity }"
		aria-label="City name"
		:delay="0"
		@focusin="() => isEditingCity = true"
		@focusout="() => isEditingCity = false"
		@keyup.enter="(event: KeyboardEvent) => emit('confirm', event)"
		@keyup.esc="emit('cancel')"
	/>
</template>

<script setup lang="ts">

	import { customEndpoint } from '@directus/sdk';
	const { $directus } = useNuxtApp();

	const { countryCode } = defineProps({
		countryCode: {
			type: String as PropType<string>,
			default: '',
		},
	});

	const emit = defineEmits<{
		(e: 'cancel'): void;
		(e: 'confirm', ev: KeyboardEvent): void;
	}>();

	const model = defineModel<string>({ required: true });
	const inputRef = defineModel<HTMLInputElement | null>('inputRef');
	const isEditingCity = defineModel<boolean>('isEditingCity', { default: false });

	const fetchedCity = ref<string>(model.value); // for useFetch
	const citySuggestions = ref<string[]>([]);

	const { data, status } = await useAsyncData(
		'city-autocomplete',
		() => $directus.request<City[]>(customEndpoint({ path: '/city-autocomplete', params: { query: fetchedCity.value, countries: countryCode } })),
		{
			watch: [ fetchedCity ],
		},
	);

	onMounted(() => {
		inputRef.value = document.getElementById('autocompleteInput') as HTMLInputElement | null;
	});

	watchDebounced(
		model,
		(newValue) => {
			if (newValue.length) {
				fetchedCity.value = newValue;
			}
		},
		{ debounce: 200 },
	);

	watch([ data, status, model ], ([ newData, newStatus, newModel ]) => {
		if (newStatus === 'pending' || !newModel.length) {
			return;
		}

		if (Array.isArray(newData)) {
			citySuggestions.value = newData.map(el => el.name);
		} else {
			citySuggestions.value = [];
		}
	});

</script>
