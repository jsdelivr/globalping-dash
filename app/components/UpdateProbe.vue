<template>
	<p>To update your probe, all you have to do is recreate the container.</p>
	<StartProbeCommands class="my-4" :adopt="true" :recreate="true"/>
	<p>Once this is done, your probe will be updated and ready to handle new measurements.</p>
</template>
