<template>
	<div class="wrapper">
		<h1 class="title">Overview</h1>
		<div class="block">
			<p class="block__title">Summary</p>
			<div class="block__content">
				<div class="block__main-content">
					<div class="big-number"><BigIcon name="gp" border/><div><span class="number">2</span><span class="title">Probes</span></div></div>
					<div class="filler"/>
					<div class="big-number"><BigIcon name="point-online" filled/><div><span class="number">2</span><span class="title">Online</span></div></div>
					<div class="big-number"><BigIcon name="point-offline" filled/><div><span class="number">2</span><span class="title">Offline</span></div></div>
				</div>
				<div class="block__secondary-content">
					<p>Locations: <span class="summary__country">Berlin <span class="summary__country-number">2</span></span></p>
					<div class="filler"/>
					<Button severity="secondary" label="Adopt probe">
						<nuxt-icon class="p-button-icon p-button-icon-left" name="capture"/>
						<span class="p-button-label">Adopt probe</span>
					</Button>
				</div>
			</div>
		</div>
		<div class="block credits"><p class="block__title">Credits</p></div>
		<div class="block probes">
			<p class="block__title">Probes</p>
			<p>Lorem</p>
		</div>
	</div>
</template>

<script setup lang="ts">
</script>

<style scoped>
	.wrapper {
		display: grid;
		grid-template-columns: 1fr 1fr;
		column-gap: 16px;
		row-gap: 16px;
	}

	.title {
		grid-column: 1 / 3;
	}

	.block {
		border: 1px solid var(--surface-300);
		border-radius: 12px;
	}

	.block__title {
		font-weight: 600;
		padding: 12px 24px;
		border-bottom: 1px solid var(--surface-300);
		color: var(--bluegray-700);
	}

	.block__content {
		padding: 24px;
	}

	.block__main-content {
		display: flex;
	}

	.big-number {
		display: flex;
		align-items: center;
	}

	.big-number + .big-number {
		margin-left: 24px;
	}

	.big-number .number {
		font-size: 28px;
		font-weight: 600;
		margin-left: 10px;
		margin-right: 8px;
	}

	.block__secondary-content {
		display: flex;
		align-items: center;
		margin-top: 24px;
	}

	.summary__country {
		padding: 8px 12px;
		border-radius: 32px;
		border: 1px solid var(--surface-300);
		margin-left: 12px;
	}

	.summary__country-number {
		color: var(--bluegray-500);
	}

	.probes {
		grid-column: 1 / 3;
	}
</style>
