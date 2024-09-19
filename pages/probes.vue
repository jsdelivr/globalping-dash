<template>
	<!-- TODO: P1: @MartinKolarik - review including all texts after the design update. -->
	<div class="min-h-full p-6" :class="{'min-w-[1024px]': probes?.length}">
		<div class="mb-4 flex">
			<h1 class="page-title">Probes</h1>
			<Button class="ml-auto" @click="adoptProbeDialog = true">
				<nuxt-icon class="pi" name="capture"/>
				<span class="font-bold">Adopt a probe</span>
			</Button>
		</div>
		<div v-if="probes.length || loading">
			<DataTable
				:value="probes"
				lazy
				:rows="itemsPerPage"
				data-key="id"
				:total-records="probesCount"
				:loading="loading"
				:row-class="() => 'cursor-pointer hover:bg-surface-50 dark:hover:bg-dark-700'"
				:pt="{footer: '!pt-0 border-t-0'}"
				:pt-options="{ mergeProps: true }"
			>
				<template #header>
					<h3 class="px-2">List of probes</h3>
				</template>
				<Column class="w-96" body-class="!p-0 h-16">
					<template #header>
						Name <i v-tooltip.top="'Private name of the probe, visible only to you'" class="pi pi-info-circle"/>
					</template>

					<template #body="slotProps">
						<NuxtLink :to="`/probes/${slotProps.data.id}`" class="flex h-full items-center" @click="openProbeDetails(slotProps.data.id)">
							<div class="grid grid-cols-[auto_1fr] grid-rows-[auto_auto] gap-x-3 px-2 py-3">
								<BigIcon class="col-span-1 row-span-2" :name="slotProps.data.hardwareDevice ? 'gp' : 'docker'" border :status="slotProps.data.status"/>
								<p class="col-start-2 col-end-3 flex items-center font-bold">{{ slotProps.data.name || slotProps.data.city }}</p>
								<p class="col-start-2 col-end-3 row-start-2 row-end-3 text-[13px] text-bluegray-900 dark:text-bluegray-400">{{ slotProps.data.ip }}</p>
							</div>
						</NuxtLink>
					</template>
				</Column>
				<Column header="Location" class="w-96" body-class="!p-0 h-16">
					<template #body="slotProps">
						<NuxtLink :to="`/probes/${slotProps.data.id}`" class="flex h-full items-center" @click="openProbeDetails(slotProps.data.id)">
							<div class="px-2 py-3">
								<div class="mb-1 flex items-center">
									<CountryFlag :country="slotProps.data.country" size="small"/>
									<p class="ml-2 font-bold">{{ slotProps.data.city }}, {{ slotProps.data.country }}</p>
								</div>
								<p>{{ slotProps.data.network }}, AS{{ slotProps.data.asn }}</p>
							</div>
						</NuxtLink>
					</template>
				</Column>
				<Column header="Tags" body-class="!p-0 h-16">
					<template #body="slotProps">
						<NuxtLink :to="`/probes/${slotProps.data.id}`" class="flex h-full items-center" @click="openProbeDetails(slotProps.data.id)">
							<div class="flex h-full flex-wrap items-center">
								<Tag v-for="tag in slotProps.data.tags.slice(0, 50)" :key="tag" class="my-0.5 mr-1 flex text-nowrap bg-surface-0 py-0.5 font-normal dark:bg-dark-800" severity="secondary" :value="`u-${tag.prefix}-${tag.value}`"/>
								<Tag v-if="slotProps.data.tags.length > 5" key="other" class="my-0.5 mr-1 flex text-nowrap bg-surface-0 py-0.5 font-normal dark:bg-dark-800" severity="secondary" :value="`+${slotProps.data.tags.length - 5}`"/>
							</div>
						</NuxtLink>
					</template>
				</Column>
				<template v-if="!loading" #footer>
					<div class="flex h-14 items-center rounded-b-xl border-t bg-gradient-to-r from-[#F4FCF7] to-[#E5FCF6] px-3 dark:from-dark-700 dark:to-dark-700">
						<div class="flex items-center">
							<span>Credits gained past month:</span>
							<Tag class="ml-2 flex items-center border bg-surface-0 !text-sm" severity="success">
								<nuxt-icon class="mr-1" name="coin"/>+{{ totalCredits }}
							</Tag>
						</div>
						<div class="ml-8">
							<span>Number of probes:</span>
							<Tag class="ml-2 flex items-center border bg-surface-0 !text-sm" severity="success">{{ probesCount }}</Tag>
						</div>
						<Button
							class="ml-auto"
							severity="secondary"
							outlined
							label="Start a probe"
							icon="pi pi-question-circle"
							@click="startProbeDialog = true"
						/>
					</div>
				</template>
			</DataTable>
			<Paginator
				v-if="probes.length !== probesCount"
				class="mt-9"
				:rows="itemsPerPage"
				:total-records="probesCount"
				template="PrevPageLink PageLinks NextPageLink"
				@page="onPage($event)"
			/>
		</div>
		<div v-else class="flex grow flex-col overflow-hidden rounded-xl border bg-surface-0 dark:bg-dark-800">
			<p class="flex border-b px-6 py-3 font-bold text-bluegray-700 dark:text-dark-0">List of probes</p>
			<div class="m-6 flex grow flex-col items-center justify-center rounded-xl bg-surface-50 p-6 text-center dark:bg-dark-600">
				<img class="mx-auto w-24" src="~/assets/images/hw-probe.png" alt="Hardware probe">
				<p class="mt-6 leading-tight">
					<b>You don't have any probes yet.</b><br><br>
					Get started in 30 seconds by running a Docker container with our probe.  It's free and simple.<br>
					Each probe will generate additional credits for you to use. Nowhere to run the container?<br>
					<NuxtLink class="font-semibold text-primary hover:underline" to="https://github.com/sponsors/jsdelivr">Become a GitHub Sponsor</NuxtLink> and get a hardware ARM powered probe delivered to you.<br>
					Plug-and-play simplicity guaranteed.
				</p>
				<Button class="mt-6" label="Start a probe" @click="startProbeDialog = true"/>
			</div>
		</div>
		<NuxtPage
			v-if="probeDetails"
			:credits="credits[probeDetails!.id] || 0"
			:probe="probeDetails"
			:gmaps-loaded="gmapsLoaded"
			@save="loadLazyData"
		/>
		<GPDialog
			v-model:visible="startProbeDialog"
			header="Start a probe"
		>
			<StartProbe/>
		</GPDialog>
		<GPDialog
			v-model:visible="adoptProbeDialog"
			header="Adopt a probe"
			content-class="!p-0"
		>
			<AdoptProbe @cancel="adoptProbeDialog = false" @adopted="loadLazyData"/>
		</GPDialog>
	</div>
</template>

<script setup lang="ts">
	import { aggregate, readItem, readItems } from '@directus/sdk';
	import type { PageState } from 'primevue/paginator';
	import CountryFlag from 'vue-country-flag-next';
	import { useAuth } from '~/store/auth';
	import { sendErrorToast } from '~/utils/send-toast';

	const auth = useAuth();
	const user = auth.getUser as User;

	const config = useRuntimeConfig();

	const { $directus } = useNuxtApp();
	const route = useRoute();

	const itemsPerPage = config.public.itemsPerTablePage;
	const startProbeDialog = ref(false);
	const adoptProbeDialog = ref(false);
	const loading = ref(false);
	const probesCount = ref(0);
	const probes = ref<Probe[]>([]);
	const credits = ref<Record<string, number>>({});
	const first = ref(0);
	const totalCredits = ref(0);
	const gmapsLoaded = ref(false);

	useHead(() => {
		return {
			title: 'Probes -',
			script: [{
				src: `https://maps.googleapis.com/maps/api/js?key=${config.public.googleMapsKey}&loading=async&callback=googleMapsLoadCallback`,
				async: true,
			}],
		};
	});

	const googleMapsLoadCallback = () => { gmapsLoaded.value = true; };
	window.googleMapsLoadCallback = googleMapsLoadCallback;

	onMounted(async () => {
		await loadLazyData();
	});

	onMounted(async () => {
		const probeId = route.params.id as string;

		if (probeId) {
			await loadProbeData(probeId);
		}
	});

	watch(() => route.path, async () => {
		const probeId = route.params.id as string;

		if (probeId) {
			await loadProbeData(probeId);
		}
	});

	const loadLazyData = async (event?: PageState) => {
		loading.value = true;

		try {
			const [ adoptedProbes, [{ count }], creditsAdditions ] = await Promise.all([
				$directus.request(readItems('gp_adopted_probes', {
					filter: { userId: { _eq: user.id } },
					sort: [ 'name' ],
					offset: event?.first || first.value,
					limit: itemsPerPage,
				})),
				$directus.request<[{count: number}]>(aggregate('gp_adopted_probes', {
					query: { filter: { userId: { _eq: user.id } } },
					aggregate: { count: '*' },
				})),
				$directus.request(readItems('gp_credits_additions', {
					filter: {
						github_id: { _eq: user.external_identifier || 'admin' },
						adopted_probe: { _null: false },
						// @ts-ignore
						date_created: { _gte: '$NOW(-1 month)' },
					},
				})),
			]);

			const creditsAdditionsFromProbes = creditsAdditions as (CreditsAddition & {adopted_probe: number})[];
			const creditsByProbeId: Record<number, number> = {};

			for (const addition of creditsAdditionsFromProbes) {
				const { adopted_probe: adoptedProbe, amount } = addition;

				totalCredits.value += amount;
				creditsByProbeId[adoptedProbe] = creditsByProbeId[adoptedProbe] ? creditsByProbeId[adoptedProbe] + amount : amount;
			}

			credits.value = creditsByProbeId;
			probes.value = adoptedProbes;
			probesCount.value = count;
		} catch (e) {
			sendErrorToast(e);
		}

		loading.value = false;
	};

	const loadProbeData = async (id: string) => {
		try {
			const probe = await $directus.request(readItem('gp_adopted_probes', id));

			probeDetails.value = probe;
		} catch (e) {
			sendErrorToast(e);
		}
	};

	const onPage = async (event: PageState) => {
		first.value = event.first;
		await loadLazyData(event);
	};

	// PROBE DETAILS

	const probeDetails = ref<Probe | null>(null);

	const openProbeDetails = (id: string) => {
		const probe = probes.value.find(probe => probe.id === id);

		if (probe) {
			probeDetails.value = { ...probe };
		}
	};
</script>
