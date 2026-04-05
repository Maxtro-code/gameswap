<template>
    <div class="has-text-centered py-6">
        <span class="icon is-large">
            <i class="fas fa-spinner fa-spin fa-2x"></i>
        </span>
        <p class="mt-3" v-if="message">{{ message }}</p>
    </div>
</template>

<script setup>
// ============================================================
// LoadingSpinner.vue — Indicateur de chargement
// ============================================================
defineProps({
    message: { type: String, default: 'Chargement...' }
})
</script>
