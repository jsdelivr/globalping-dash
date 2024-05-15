<template>
	<div :class="{'big-icon__wrapper': border}">
		<nuxt-icon class="big-icon" :class="{big: border}" :name="name" :filled="filled"/>
	</div>
</template>

<script setup lang="ts">
	defineProps({
		name: {
			type: String,
			default: '',
		},
		filled: Boolean,
		border: Boolean,
	});
</script>

<style scoped>
  .big-icon__wrapper {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    border: 1px solid var(--surface-300);
  }

  .big-icon {
    color: var(--primary-color);
    font-size: 16px;
  }

.big-icon.big {
  font-size: 22px;
}
</style>
