<template>
	<div class="big-icon__wrapper">
		<nuxt-icon class="pi big-icon" name="gp"/>
	</div>
</template>

<script setup lang="ts"></script>

<style scoped>
  .big-icon__wrapper {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid var(--surface-300);
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .big-icon {
    display: block;
    color: var(--primary-color);
    font-size: 24px;

  }
</style>
