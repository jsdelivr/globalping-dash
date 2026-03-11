<template>
	<Dialog
		v-model:visible="showLocalNetworkAccessPopup"
		modal
		class="w-[90vw] max-w-lg"
		:draggable="false"
	>
		<template #header>
			<div class="flex items-center gap-3">
				<i class="pi pi-info-circle text-xl text-primary"/>
				<span class="text-xl font-bold">
					New hardware probe detected
				</span>
			</div>
		</template>

		<div class="flex flex-col gap-5">
			<p>
				A new Globalping hardware probe is available on your network.<br>
				To initiate an automated adoption process, we need permission to communicate with the probe via your local area network (LAN).
			</p>

			<div class="flex flex-col gap-3 rounded-lg border border-surface-200 bg-surface-50 p-4 dark:border-dark-500 dark:bg-dark-800">
				<ul class="flex flex-col gap-3 text-sm">
					<li class="flex items-start gap-2 border-b pb-2">
						<i class="pi pi-check mt-1 text-primary"/>
						<span>
							<strong>To enable automated adoption</strong><br>
							Click <strong>Allow</strong> in the browser or system permission prompt.
						</span>
					</li>
					<li class="flex items-start gap-2">
						<i class="pi pi-times mt-1 text-surface-500"/>
						<span>
							<strong>To disable automated adoption</strong><br>
							Click <strong>Block</strong> or <strong>Disable</strong>.
							You can always adopt the probe manually.
						</span>
					</li>
				</ul>
			</div>

			<p>
				You can change this later in your browser settings.
			</p>
		</div>
	</Dialog>
</template>

<script setup lang="ts">
	import { storeToRefs } from 'pinia';
	import { useHardwareProbeAdoption } from '~/store/local-adoption';

	const store = useHardwareProbeAdoption();
	const { showLocalNetworkAccessPopup } = storeToRefs(store);
</script>
