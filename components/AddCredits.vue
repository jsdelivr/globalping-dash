<template>
	<div class="border-t p-5 pt-7">
		<div class="flex">
			<div class="mr-2 flex w-10 flex-col">
				<div class="mx-auto flex size-7 items-center justify-center rounded-full bg-primary">
					<i class="pi pi-check text-surface-0"/>
				</div>
				<div class="mt-2 grow">
					<div class="mx-auto h-full w-px bg-primary"/>
				</div>
			</div>
			<div class="w-full rounded-xl border p-4 pt-3">
				<h6 class="text-md text-base font-bold">Sign up</h6>
				<p class="mt-1 text-bluegray-500">By creating a free account you help us fight abuse while getting access to higher limits and additional features.</p>
				<div class="mt-1 rounded-xl bg-gradient-to-r from-[#F4FCF7] to-[#E5FCF6] p-2 dark:from-dark-700 dark:to-dark-700">
					<div class="flex items-center justify-between">
						<div class="ml-2">You received <span class="ml-1.5 rounded-full border bg-surface-0 px-2.5 py-1.5"><span class="mr-1 font-bold text-green-500">500 free credits</span> /hour</span></div>
						<Button
							size="small"
							disabled
							severity="secondary"
							outlined
							label="Signed up"
							icon="pi pi-check"
							class="text-primary !opacity-100"
						/>
					</div>
				</div>
			</div>
		</div>
		<div class="mt-2 flex">
			<div class="mr-2 flex w-10 flex-col">
				<div class="mx-auto flex size-7 items-center justify-center rounded-full border">
					2
				</div>
				<div class="mt-2 grow">
					<div class="mx-auto h-full w-px bg-surface-300"/>
				</div>
			</div>
			<div class="w-full rounded-xl border p-4 pt-3">
				<h6 class="text-md text-base font-bold">Host a probe</h6>
				<p class="mt-1 text-bluegray-500">Become a member of the community by hosting a probe. For each day your probe stays online, you will get additional free credits.</p>
				<div class="mt-1 rounded-xl bg-surface-50 p-2 dark:bg-dark-700">
					<div class="flex items-center justify-between">
						<div class="ml-2">You get <span class="ml-1.5 rounded-full border bg-surface-0 px-2.5 py-1.5"><span class="mr-1 font-bold">+150 credits</span> /probe /day</span></div>
						<Button size="small" label="Adopt probe"/>
					</div>
				</div>
			</div>
		</div>
		<div class="mt-2 flex">
			<div class="mr-2 flex w-10 flex-col">
				<div class="mx-auto flex size-7 items-center justify-center rounded-full border">
					3
				</div>
				<div class="mt-2 grow">
					<div class="mx-auto h-full w-px bg-surface-300"/>
				</div>
			</div>
			<div class="w-full rounded-xl border p-4 pt-3">
				<h6 class="text-md text-base font-bold">Become a sponsor</h6>
				<p class="mt-1 text-bluegray-500">Support the active development of the project by a one-time or monthly donation.</p>
				<div class="mt-1 rounded-xl bg-surface-50 p-2 dark:bg-dark-700">
					<div class="flex items-center justify-between">
						<div class="ml-2">You get <span class="ml-1.5 rounded-full border bg-surface-0 px-2.5 py-1.5"><span class="mr-1 font-bold">+2000 credits</span> /$1</span></div>
						<Button size="small" label="Become a sponsor"/>
					</div>
				</div>
			</div>
		</div>
		<div class="mt-7 flex justify-end">
			<Button label="Close" severity="secondary" outlined @click="$emit('cancel')"/>
		</div>
	</div>
</template>

<script setup lang="ts">
	defineEmits([ 'cancel' ]);
</script>
