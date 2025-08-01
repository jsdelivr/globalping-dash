<template>
	<div class="w-full" @focusout="handleFocusOut">
		<AutoComplete
			v-model="model"
			input-id="autocompleteInput"
			:suggestions="citySuggestions"
			loader="null"
			class="relative w-full rounded-none"
			input-class="w-full md:rounded-none md:rounded-r-md rounded-md border-none focus:cursor-text cursor-pointer"
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
						<!-- TODO: display US state -->
						({{suggestions[slotProps.index].country}})
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
			class="!absolute !right-2 !top-1/2 mr-8 !h-7 w-7 !-translate-y-1/2 !rounded-md !px-2 !py-1 !text-sm !font-bold focus:!border-primary focus:!ring-primary"
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
			class="!absolute !right-2 !top-1/2 !h-7 w-7 !-translate-y-1/2 !rounded-md !px-2 !py-1 !text-sm !font-bold focus:!border-[#ef4444] focus:!ring-[#ef4444]"
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

	const { countryCode } = defineProps({
		countryCode: {
			type: String as PropType<string>,
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

	const model = defineModel<string>({ required: true });
	const inputRef = defineModel<HTMLInputElement | null>('inputRef');

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

	const handleFocusOut = (event: FocusEvent) => {
		const target = event.target as HTMLElement | null;
		const relatedTarget = event.relatedTarget as HTMLElement | null;

		if (target && !relatedTarget && target === inputRef.value) {
			event.stopPropagation();
		}
	};

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
			suggestions.value = newData;
		} else {
			suggestions.value = [];
		}
	});

</script>
