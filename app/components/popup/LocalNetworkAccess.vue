<template>
	<Dialog
		v-model:visible="showLocalNetworkAccessPopup"
		modal
		class="w-[90vw] max-w-lg"
		:draggable="false"
	>
		<template #header>
			<div class="flex items-center gap-3">
				<i class="pi pi-info-circle text-2xl text-primary"/>
				<span class="text-xl font-bold">
					New hardware probe detected
				</span>
			</div>
		</template>

		<div class="flex flex-col gap-5 pt-2">
			<p>
				A new Globalping hardware probe is available on your network. To initiate the adoption process, this application requires direct communication with the device via your local area network (LAN).
			</p>

			<div class="flex flex-col gap-3 rounded-lg border border-surface-200 bg-surface-50 p-4">
				<ul class="flex flex-col gap-3 text-sm">
					<li class="flex items-start gap-2">
						<i class="pi pi-check mt-1 text-primary"/>
						<span>
							<strong>To enable automatic adoption:</strong> Click <strong>Allow</strong> on the browser or system permission prompt.
						</span>
					</li>
					<li class="flex items-start gap-2">
						<i class="pi pi-times mt-1 text-surface-500"/>
						<span>
							<strong>To disable this feature:</strong> Click <strong>Block</strong> or <strong>Disable</strong> in the prompt. You can change this later in your browser settings.
						</span>
					</li>
				</ul>
			</div>
		</div>
	</Dialog>
</template>

<script setup lang="ts">
	import { storeToRefs } from 'pinia';
	import { useHardwareProbeAdoption } from '~/store/local-adoption';

	const store = useHardwareProbeAdoption();
	const { showLocalNetworkAccessPopup } = storeToRefs(store);
</script>
