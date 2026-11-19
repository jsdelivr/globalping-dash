<template>
	<div class="min-h-full p-4 sm:p-6">
		<h1 class="page-title">Settings</h1>

		<Tabs :value="activeTab" lazy :show-navigators="false">
			<TabList v-if="account.canManageOrg" class="mt-6 !border-b !border-surface-300 dark:!border-dark-600 [&_[data-pc-section='tablist']]:!border-none">
				<Tab
					v-for="tab in TABS"
					:key="tab.value"
					:value="tab.value"
					tabindex="0"
					class="!w-1/2 border-none !px-6 !py-2 !text-[14px] !font-bold sm:!w-auto"
					@click.capture="selectTab($event, tab.value)"
					@keydown.capture="selectTabWithKeyboard($event, tab.value)"
				>
					<i :class="tab.icon" class="mr-2 text-sm" aria-hidden="true"/>
					{{ tab.label }}
				</Tab>
			</TabList>

			<TabPanels class="!bg-transparent !p-0">
				<TabPanel value="personal" tabindex="-1">
					<SettingsPersonal/>
				</TabPanel>

				<TabPanel v-if="account.canManageOrg" value="organization" tabindex="-1">
					<SettingsOrganization/>
				</TabPanel>
			</TabPanels>
		</Tabs>
	</div>
</template>

<script setup lang="ts">
	import { useQueryTabs } from '~/composables/useQueryTabs';
	import { useAccount } from '~/store/account';

	const TABS = [
		{ value: 'personal', label: 'Personal', icon: 'pi pi-user' },
		{ value: 'organization', label: 'Organization', icon: 'pi pi-building' },
	];

	useHead({
		title: 'Settings -',
	});

	const account = useAccount();

	// Only an admin of the active org has the organization tab.
	const { activeTab, selectTab, selectTabWithKeyboard } = useQueryTabs(() => account.canManageOrg ? TABS.map(({ value }) => value) : [ 'personal' ], 'personal');
</script>
