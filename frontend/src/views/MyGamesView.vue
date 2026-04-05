<template>
    <div>
        <h2 class="title is-3"><i class="fas fa-boxes-stacked"></i> Ma collection</h2>

        <LoadingSpinner v-if="loading" />

        <!-- Grille de mes jeux -->
        <div v-else-if="games.length" class="columns is-multiline">
            <div class="column is-4-desktop is-6-tablet" v-for="game in games" :key="game.id">
                <GameCard
                    :title="game.title"
                    :platform="game.platform"
                    :image="game.image"
                    :rating="game.rating"
                >
                    <template #footer>
                        <a class="card-footer-item has-text-danger" @click="deleteGame(game)">
                            <i class="fas fa-trash"></i>&nbsp; Supprimer
                        </a>
                    </template>
                </GameCard>
            </div>
        </div>

        <!-- Aucun jeu -->
        <div v-else class="notification is-info is-light has-text-centered">
            <p>Vous n'avez pas encore ajouté de jeux.</p>
            <router-link to="/add-game" class="button is-primary mt-3">
                <i class="fas fa-plus"></i>&nbsp; Ajouter un jeu
            </router-link>
        </div>
    </div>
</template>

<script setup>
// ============================================================
// MyGamesView.vue — Liste des jeux de l'utilisateur connecté
// ============================================================
import { ref, onMounted } from 'vue'
import GameCard from '../components/GameCard.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const emit = defineEmits(['flash'])

const games   = ref([])
const loading = ref(true)

// --- Charger mes jeux ---
async function loadGames() {
    loading.value = true
    try {
        const res   = await fetch('/api/games/mine')
        games.value = await res.json()
    } catch {
        emit('flash', { type: 'is-danger', text: 'Erreur de chargement.' })
    }
    loading.value = false
}

// --- Supprimer un jeu ---
async function deleteGame(game) {
    if (!confirm(`Supprimer "${game.title}" ?`)) return
    try {
        const res = await fetch(`/api/games/${game.id}`, { method: 'DELETE' })
        if (res.ok) {
            games.value = games.value.filter(g => g.id !== game.id)
            emit('flash', { type: 'is-success', text: 'Jeu supprimé.' })
        }
    } catch {
        emit('flash', { type: 'is-danger', text: 'Erreur réseau.' })
    }
}

onMounted(loadGames)
</script>
