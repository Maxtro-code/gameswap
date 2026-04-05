<template>
    <div>
        <h2 class="title is-3"><i class="fas fa-plus-circle"></i> Ajouter un jeu</h2>
        <p class="subtitle">Recherchez un jeu via la base RAWG puis ajoutez-le à votre collection.</p>

        <!-- ===== RECHERCHE RAWG ===== -->
        <div class="field">
            <div class="control has-icons-left is-medium">
                <input class="input is-medium" type="text" v-model="query"
                       @input="debouncedSearch"
                       placeholder="Rechercher un jeu (ex: Zelda, FIFA, GTA...)">
                <span class="icon is-left"><i class="fas fa-search"></i></span>
            </div>
        </div>

        <!-- Loader recherche -->
        <LoadingSpinner v-if="searching" message="Recherche en cours..." />

        <!-- Résultats RAWG -->
        <div v-if="results.length" class="columns is-multiline mt-3">
            <div class="column is-4-desktop is-6-tablet" v-for="game in results" :key="game.rawg_id">
                <GameCard
                    :title="game.name"
                    :platform="game.platforms"
                    :image="game.image"
                    :rating="game.rating"
                    :clickable="true"
                    :selected="selected?.rawg_id === game.rawg_id"
                    @click="selectGame(game)"
                />
            </div>
        </div>

        <!-- ===== CONFIRMATION ===== -->
        <div v-if="selected" class="box mt-5 confirmation-box">
            <h3 class="title is-4">
                <i class="fas fa-check-circle has-text-success"></i> Confirmer l'ajout
            </h3>
            <div class="columns is-vcentered">
                <div class="column is-3" v-if="selected.image">
                    <figure class="image is-4by3">
                        <img :src="selected.image" :alt="selected.name"
                             style="border-radius: 8px; object-fit: cover;">
                    </figure>
                </div>
                <div class="column">
                    <p><strong>{{ selected.name }}</strong></p>
                    <p><i class="fas fa-gamepad"></i> {{ selected.platforms }}</p>
                    <p v-if="selected.released">
                        <i class="fas fa-calendar"></i> Sortie : {{ selected.released }}
                    </p>
                    <p v-if="selected.rating">
                        <i class="fas fa-star" style="color: #f1c40f"></i> {{ selected.rating }}/5
                    </p>
                    <div class="buttons mt-3">
                        <button class="button is-success" :class="{ 'is-loading': adding }"
                                @click="addGame">
                            <i class="fas fa-plus"></i>&nbsp; Ajouter à ma collection
                        </button>
                        <button class="button is-light" @click="selected = null">
                            <i class="fas fa-times"></i>&nbsp; Annuler
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- ===== AJOUT MANUEL ===== -->
        <div class="box mt-5">
            <h3 class="title is-5"><i class="fas fa-pen"></i> Ajout manuel</h3>
            <p class="subtitle is-6">Le jeu n'apparaît pas ? Ajoutez-le manuellement.</p>

            <form @submit.prevent="addManual">
                <div class="field">
                    <label class="label">Titre du jeu *</label>
                    <input class="input" v-model="manual.title" required
                           placeholder="Ex: Super Mario Bros.">
                </div>
                <div class="field">
                    <label class="label">Plateforme(s)</label>
                    <input class="input" v-model="manual.platform"
                           placeholder="Ex: Nintendo Switch, PS5">
                </div>
                <div class="field">
                    <label class="label">URL de l'image (optionnel)</label>
                    <input class="input" v-model="manual.image" placeholder="https://...">
                </div>
                <button class="button is-info" :class="{ 'is-loading': adding }" type="submit">
                    <i class="fas fa-plus"></i>&nbsp; Ajouter manuellement
                </button>
            </form>
        </div>
    </div>
</template>

<script setup>
// ============================================================
// AddGameView.vue — Ajout de jeu (recherche RAWG + manuel)
// ============================================================
import { ref } from 'vue'
import GameCard from '../components/GameCard.vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const props = defineProps({ user: Object })
const emit  = defineEmits(['flash'])

// --- Variables réactives ---
const query     = ref('')
const results   = ref([])
const selected  = ref(null)
const searching = ref(false)
const adding    = ref(false)
const manual    = ref({ title: '', platform: '', image: '' })

let timeout = null

// --- Recherche avec délai (debounce 400ms) ---
function debouncedSearch() {
    clearTimeout(timeout)
    const q = query.value.trim()
    if (q.length < 2) {
        results.value = []
        return
    }
    timeout = setTimeout(() => searchGames(q), 400)
}

// --- Appel API de recherche RAWG ---
async function searchGames(q) {
    searching.value = true
    selected.value  = null
    try {
        const res     = await fetch(`/api/games/search?q=${encodeURIComponent(q)}`)
        results.value = await res.json()
    } catch {
        results.value = []
    }
    searching.value = false
}

// --- Sélectionner un jeu dans les résultats ---
function selectGame(game) {
    selected.value = game
    results.value  = []
    query.value    = ''
}

// --- Ajouter le jeu sélectionné (RAWG) ---
async function addGame() {
    if (!selected.value) return
    adding.value = true
    try {
        const res = await fetch('/api/games', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title:    selected.value.name,
                platform: selected.value.platforms,
                image:    selected.value.image,
                rating:   selected.value.rating,
                released: selected.value.released
            })
        })
        if (res.ok) {
            emit('flash', { type: 'is-success', text: `"${selected.value.name}" ajouté !` })
            selected.value = null
        }
    } catch {
        emit('flash', { type: 'is-danger', text: 'Erreur réseau.' })
    }
    adding.value = false
}

// --- Ajouter manuellement ---
async function addManual() {
    if (!manual.value.title) return
    adding.value = true
    try {
        const res = await fetch('/api/games', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(manual.value)
        })
        if (res.ok) {
            emit('flash', { type: 'is-success', text: `"${manual.value.title}" ajouté !` })
            manual.value = { title: '', platform: '', image: '' }
        }
    } catch {
        emit('flash', { type: 'is-danger', text: 'Erreur réseau.' })
    }
    adding.value = false
}
</script>
