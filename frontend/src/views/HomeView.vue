<template>
    <div>
        <!-- Hero -->
        <div class="hero-section mb-5">
            <h1 class="title is-2"><i class="fas fa-gamepad"></i> Catalogue des jeux</h1>
            <p class="subtitle">Parcourez les jeux disponibles et proposez un échange !</p>
        </div>

        <!-- Barre de filtre -->
        <div class="field has-addons mb-5">
            <div class="control has-icons-left is-expanded">
                <input
                    class="input is-medium"
                    type="text"
                    v-model="search"
                    placeholder="Filtrer les jeux par titre ou plateforme..."
                >
                <span class="icon is-left"><i class="fas fa-search"></i></span>
            </div>
        </div>

        <!-- Loader -->
        <LoadingSpinner v-if="loading" message="Chargement des jeux..." />

        <!-- Grille de jeux -->
        <div v-else-if="filteredGames.length" class="columns is-multiline">
            <div
                class="column is-4-desktop is-6-tablet"
                v-for="game in filteredGames"
                :key="game.id"
            >
                <GameCard
                    :title="game.title"
                    :platform="game.platform"
                    :image="game.image"
                    :rating="game.rating"
                    :owner="game.owner_username"
                >
                    <template #footer v-if="user && user.id !== game.owner_id">
                        <a class="card-footer-item has-text-primary" @click="requestExchange(game)">
                            <i class="fas fa-right-left"></i>&nbsp; Proposer un échange
                        </a>
                    </template>
                </GameCard>
            </div>
        </div>

        <!-- Aucun jeu -->
        <div v-else class="notification is-warning is-light has-text-centered">
            <i class="fas fa-ghost fa-2x mb-3"></i>
            <p>Aucun jeu disponible pour le moment.</p>
        </div>
    </div>
</template>

<script setup>
// ============================================================
// HomeView.vue — Catalogue de tous les jeux disponibles
// ============================================================
import { ref, computed, onMounted } from 'vue'
import GameCard from '../components/GameCard.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const props = defineProps({ user: Object })
const emit  = defineEmits(['flash'])

// --- Variables réactives ---
const games   = ref([])
const search  = ref('')
const loading = ref(true)

// --- Valeur calculée : filtre local ---
const filteredGames = computed(() => {
    const q = search.value.toLowerCase()
    if (!q) return games.value
    return games.value.filter(g =>
        g.title.toLowerCase().includes(q) ||
        (g.platform && g.platform.toLowerCase().includes(q))
    )
})

// --- Charger les jeux depuis l'API ---
async function loadGames() {
    loading.value = true
    try {
        const res   = await fetch('/api/games')
        games.value = await res.json()
    } catch {
        emit('flash', { type: 'is-danger', text: 'Erreur de chargement.' })
    }
    loading.value = false
}

// --- Proposer un échange ---
async function requestExchange(game) {
    const message = prompt('Message pour le propriétaire (optionnel) :')
    try {
        const res = await fetch('/api/exchanges', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ game_id: game.id, message })
        })
        const data = await res.json()
        if (res.ok) {
            emit('flash', { type: 'is-success', text: data.message })
        } else {
            emit('flash', { type: 'is-warning', text: data.error })
        }
    } catch {
        emit('flash', { type: 'is-danger', text: 'Erreur réseau.' })
    }
}

// --- Cycle de vie ---
onMounted(loadGames)
</script>
