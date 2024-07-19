<template>
	<p>To join the Globalping probe network all you have to do is run our container.</p>
	<div class="mt-4">
		<Button
			class="rounded-r-none"
			label="Docker"
			:severity="platform === 'docker' ? undefined : 'secondary'"
			:outlined="platform === 'docker' ? false : true"
			@click="togglePlatform"
		/>
		<Button
			class="rounded-l-none"
			label="Podman"
			:severity="platform === 'podman' ? undefined : 'secondary'"
			:outlined="platform === 'podman' ? false : true"
			@click="togglePlatform"
		/>
	</div>
	<div class="dark:bg-dark-900 relative mt-4 rounded-xl border p-4 pr-0">
		<!-- TODO: P1: the expand effect and the modal resize must be animated (and probably it'll have to be just downwards, not in both directions) -->
		<!-- TODO: P1: related ^ all the modals may work better if they are closer to the top, not fully vertically centered -->
		<pre v-if="(size === 'compact')" class="no-scrollbar overflow-scroll"><code class="mr-16">{{ commands[platform][size] }}</code></pre>
		<div v-if="size === 'expanded'" class="no-scrollbar overflow-scroll">
			<pre v-for="line in commands[platform][size]" :key="line.toString()"><code>{{ line[0] }}</code><code class="text-bluegray-300 mr-16">{{ line[1] }}</code></pre>
		</div>
		<div class="!absolute right-2 top-2">
			<Button
				icon="pi pi-copy"
				severity="secondary"
				aria-label="Copy"
				outlined
				@click="copyCommand"
			/>
			<div v-if="copyTooltip" class="bg-bluegray-700 text-surface-0 absolute left-1/2 top-[-40px] -translate-x-1/2 rounded-md p-2">
				Copied!
			</div>
		</div>
	</div>
	<div class="flex justify-center">
		<Button
			class="size-6 rounded-t-none border-t-0"
			size="small"
			outlined
			severity="secondary"
			aria-label="Toggle expand"
			@click="toggleSize"
		>
			<i class="pi text-xs" :class="{'pi-chevron-down': size === 'compact', 'pi-chevron-up': size === 'expanded'}"/>
		</Button>
	</div>
	<p class="mt-4">Once you connect, you will become part of the global community that powers the Globalping Platform. The container works on both x86 and ARM architectures.</p>
</template>

<script setup lang="ts">
	const commands = {
		docker: {
			compact: 'docker run -d --log-driver local --network host --restart=always --name globalping-probe globalping/globalping-probe',
			expanded: [
				[ 'docker run -d \\', ' # Make sure the container runs on boot' ],
				[ '--log-driver local \\', ' # Use the modern logging driver to ensure old logs are deleted' ],
				[ '--network host \\', ' # Bypass overlay and mesh networking to ensure they dont impact latency tests' ],
				[ '--restart=always \\', ' # Restart the container in case it crashes' ],
				[ '--name globalping-probe globalping/globalping-probe' ],
			],
		},
		podman: {
			compact: 'sudo podman run -d --cap-add=NET_RAW --network host --restart=always --name globalping-probe globalping/globalping-probe',
			expanded: [
				[ 'sudo \\', ' # Allows the --cap-add=NET_RAW option to work properly' ],
				[ 'podman run -d \\', ' # The container will NOT start on boot. You need to create a systemd service first.' ],
				[ '--cap-add=NET_RAW \\', ' # Network permissions to run ping' ],
				[ '--network host \\', ' # Bypass overlay and mesh networking to ensure they dont impact latency tests' ],
				[ '--restart=always \\', ' # Restart the container in case it crashes' ],
				[ '--name globalping-probe globalping/globalping-probe' ],
			],
		},
	};

	const platform: Ref<'docker' | 'podman'> = ref('docker');
	const size: Ref<'compact' | 'expanded'> = ref('compact');

	const togglePlatform = () => platform.value = platform.value === 'docker' ? 'podman' : 'docker';
	const toggleSize = () => size.value = size.value === 'compact' ? 'expanded' : 'compact';

	const copyTooltip = ref(false);
	const copyCommand = async () => {
		let content = commands[platform.value][size.value];

		if (Array.isArray(content)) {
			content = content.map(parts => parts.join('')).join('\n');
		}

		await navigator.clipboard.writeText(content);
		copyTooltip.value = true;
		setTimeout(() => copyTooltip.value = false, 1000);
	};
</script>
