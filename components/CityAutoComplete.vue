<template>
	<div class="w-full" @focusout="handleFocusOut">
		<AutoComplete
			v-model="model"
			input-id="autocompleteInput"
			:suggestions="citySuggestions"
			loader="null"
			class="relative w-full rounded-none"
			input-class="w-full md:rounded-none md:rounded-r-md rounded-md border-none focus:cursor-text cursor-pointer dark:!bg-dark-800"
			aria-label="City name"
			:delay="0"
			@keyup.enter.stop="(event: KeyboardEvent) => emit('confirm', event)"
			@keyup.esc="emit('cancel')"
		>
			<template #option="slotProps">
				<span class="flex items-center gap-1">
					<span>
						{{slotProps.option}}
					</span>
					<span v-if="countryCode === 'US'" class="text-bluegray-400">
						({{suggestions[slotProps.index].state}})
					</span>
				</span>
			</template>
		</AutoComplete>

		<i v-if="!active" class="pi pi-pencil text-md pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer" aria-hidden="true"/>

		<Button
			v-if="dirty"
			v-tooltip.top="'Save'"
			variant="text"
			severity="secondary"
			icon="pi pi-check"
			class="!absolute right-1 top-0.5 mr-8 !size-7 rounded-md !px-2 !py-1 focus:!border-primary focus:!ring-primary"
			:loading="loading"
			:disabled="loading"
			aria-label="Save"
			@click="(event: MouseEvent) => emit('confirm', event)"
		/>

		<Button
			v-if="active || dirty"
			v-tooltip.top="'Cancel'"
			variant="text"
			severity="secondary"
			icon="pi pi-times"
			class="!absolute right-1 top-0.5 !size-7 rounded-md focus:!border-[#ef4444] focus:!ring-[#ef4444]"
			:disabled="loading"
			aria-label="Cancel"
			@keyup.enter="emit('cancel')"
			@click.stop="emit('cancel')"
		/>
	</div>
</template>

<script setup lang="ts">
	import { customEndpoint } from '@directus/sdk';
	const { $directus } = useNuxtApp();

	const model = defineModel<string>({ required: true });
	const inputRef = defineModel<HTMLInputElement | null>('inputRef');

	const { countryCode } = defineProps({
		countryCode: {
			type: String,
			default: '',
		},
		active: {
			type: Boolean,
			default: true,
		},
		dirty: {
			type: Boolean,
			default: true,
		},
		loading: {
			type: Boolean,
			default: false,
		},
	});

	const emit = defineEmits<{
		(e: 'cancel'): void;
		(e: 'confirm', ev: KeyboardEvent | MouseEvent): void;
	}>();

	const fetchedCity = ref<string>(model.value);
	const suggestions = ref<City[]>([]);
	const citySuggestions = computed(() => suggestions.value.map(el => el.name));

	const { data, status } = await useAsyncData(
		'city-autocomplete',
		() => $directus.request<City[]>(customEndpoint({ path: '/city-autocomplete', params: { query: fetchedCity.value, countries: countryCode } })),
		{
			watch: [ fetchedCity, () => countryCode ],
		},
	);

	watch([ data, status, model ], ([ newData, newStatus, newModel ]) => {
		if (newStatus === 'pending' || !newModel.length) {
			return;
		}

		if (Array.isArray(newData)) {
			suggestions.value = newData;
		} else {
			suggestions.value = [];
		}
	});

	watchDebounced(model, (newCity) => {
		if (newCity.length) {
			fetchedCity.value = newCity;
		}
	}, { debounce: 200 });

	onMounted(() => {
		inputRef.value = document.getElementById('autocompleteInput') as HTMLInputElement | null;
	});

	const handleFocusOut = (event: FocusEvent) => {
		const target = event.target;
		const relatedTarget = event.relatedTarget;

		if (target && !relatedTarget && target === inputRef.value) {
			event.stopPropagation();
		}
	};

</script>
