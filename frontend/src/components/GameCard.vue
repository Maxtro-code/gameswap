<template>
    <div class="card game-card" :class="{ 'is-clickable': clickable, 'selected-card': selected }">
        <div class="card-image" @click="$emit('click')">
            <figure class="image is-16by9">
                <img :src="image || '/img/no-image.svg'" :alt="title" loading="lazy">
            </figure>
        </div>

        <div class="card-content" @click="$emit('click')">
            <p class="title is-5 mb-2">{{ title }}</p>
            <p class="subtitle is-6 mb-2" v-if="platform">
                <span class="tag is-info is-light">
                    <i class="fas fa-gamepad"></i>&nbsp; {{ platform }}
                </span>
            </p>
            <p v-if="rating" class="mb-2">
                <i class="fas fa-star" style="color: #f1c40f"></i> {{ rating }}/5
            </p>
            <p v-if="owner" class="is-size-7 has-text-grey">
                <i class="fas fa-user"></i> Proposé par <strong>{{ owner }}</strong>
            </p>
        </div>

        <!-- Slot pour les actions en pied de carte -->
        <footer class="card-footer" v-if="$slots.footer">
            <slot name="footer" />
        </footer>
    </div>
</template>

<script setup>
// ============================================================
// GameCard.vue — Carte de jeu réutilisable
// ============================================================

defineProps({
    title:     { type: String, required: true },
    platform:  { type: String, default: '' },
    image:     { type: String, default: '' },
    rating:    { type: [Number, String], default: null },
    owner:     { type: String, default: '' },
    clickable: { type: Boolean, default: false },
    selected:  { type: Boolean, default: false }
})

defineEmits(['click'])
</script>
