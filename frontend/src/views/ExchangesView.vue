<template>
    <div>
        <h2 class="title is-3"><i class="fas fa-right-left"></i> Mes échanges</h2>

        <!-- Onglets -->
        <div class="tabs is-boxed is-medium">
            <ul>
                <li :class="{ 'is-active': tab === 'received' }">
                    <a @click="tab = 'received'">
                        <i class="fas fa-inbox"></i>&nbsp; Demandes reçues
                        <span v-if="pendingCount" class="tag is-danger is-rounded ml-2">
                            {{ pendingCount }}
                        </span>
                    </a>
                </li>
                <li :class="{ 'is-active': tab === 'sent' }">
                    <a @click="tab = 'sent'">
                        <i class="fas fa-paper-plane"></i>&nbsp; Mes demandes
                    </a>
                </li>
            </ul>
        </div>

        <LoadingSpinner v-if="loading" />

        <!-- ===== DEMANDES REÇUES ===== -->
        <div v-else-if="tab === 'received'">
            <div v-if="received.length === 0" class="notification is-light">
                Aucune demande reçue.
            </div>

            <div v-for="ex in received" :key="ex.id" class="box exchange-box mb-4">
                <div class="columns is-vcentered">
                    <div class="column is-2" v-if="ex.game_image">
                        <figure class="image is-4by3">
                            <img :src="ex.game_image"
                                 style="border-radius: 8px; object-fit: cover;">
                        </figure>
                    </div>
                    <div class="column">
                        <p>
                            <strong>{{ ex.game_title }}</strong>
                            ({{ ex.game_platform }})
                        </p>
                        <p class="is-size-7 has-text-grey">
                            Demandé par <strong>{{ ex.requester_username }}</strong>
                            — {{ formatDate(ex.created_at) }}
                        </p>
                        <p v-if="ex.message" class="mt-2 is-italic">"{{ ex.message }}"</p>
                    </div>
                    <div class="column is-narrow">
                        <!-- Statut déjà traité -->
                        <span v-if="ex.status !== 'en_attente'" class="tag is-medium"
                              :class="ex.status === 'accepte' ? 'is-success' : 'is-danger'">
                            {{ ex.status === 'accepte' ? 'Accepté' : 'Refusé' }}
                        </span>
                        <!-- Boutons d'action -->
                        <div v-else class="buttons">
                            <button class="button is-success is-small"
                                    @click="updateExchange(ex.id, 'accepte')">
                                <i class="fas fa-check"></i>&nbsp; Accepter
                            </button>
                            <button class="button is-danger is-small is-outlined"
                                    @click="updateExchange(ex.id, 'refuse')">
                                <i class="fas fa-times"></i>&nbsp; Refuser
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- ===== DEMANDES ENVOYÉES ===== -->
        <div v-else>
            <div v-if="sent.length === 0" class="notification is-light">
                Aucune demande envoyée.
            </div>

            <div v-for="ex in sent" :key="ex.id" class="box exchange-box mb-4">
                <div class="columns is-vcentered">
                    <div class="column is-2" v-if="ex.game_image">
                        <figure class="image is-4by3">
                            <img :src="ex.game_image"
                                 style="border-radius: 8px; object-fit: cover;">
                        </figure>
                    </div>
                    <div class="column">
                        <p>
                            <strong>{{ ex.game_title }}</strong>
                            ({{ ex.game_platform }})
                        </p>
                        <p class="is-size-7 has-text-grey">
                            Propriétaire : <strong>{{ ex.owner_username }}</strong>
                            — {{ formatDate(ex.created_at) }}
                        </p>
                    </div>
                    <div class="column is-narrow">
                        <span class="tag is-medium" :class="{
                            'is-warning': ex.status === 'en_attente',
                            'is-success': ex.status === 'accepte',
                            'is-danger':  ex.status === 'refuse'
                        }">
                            {{ statusLabel(ex.status) }}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
// ============================================================
// ExchangesView.vue — Gestion des demandes d'échange
// ============================================================
import { ref, computed, onMounted } from 'vue'
import LoadingSpinner from '../components/LoadingSpinner.vue'

const emit = defineEmits(['flash'])

const tab      = ref('received')
const received = ref([])
const sent     = ref([])
const loading  = ref(true)

// --- Nombre de demandes en attente (badge) ---
const pendingCount = computed(() =>
    received.value.filter(e => e.status === 'en_attente').length
)

// --- Libellé du statut ---
function statusLabel(status) {
    const labels = { en_attente: 'En attente', accepte: 'Accepté', refuse: 'Refusé' }
    return labels[status] || status
}

// --- Formatage de date ---
function formatDate(d) {
    return new Date(d).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric'
    })
}

// --- Charger les échanges reçus et envoyés ---
async function loadExchanges() {
    loading.value = true
    try {
        const [r1, r2] = await Promise.all([
            fetch('/api/exchanges/received'),
            fetch('/api/exchanges/sent')
        ])
        received.value = await r1.json()
        sent.value     = await r2.json()
    } catch {
        emit('flash', { type: 'is-danger', text: 'Erreur de chargement.' })
    }
    loading.value = false
}

// --- Accepter ou refuser un échange ---
async function updateExchange(id, status) {
    try {
        const res = await fetch(`/api/exchanges/${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        })
        if (res.ok) {
            const ex = received.value.find(e => e.id === id)
            if (ex) ex.status = status
            emit('flash', { type: 'is-success', text: `Échange ${statusLabel(status).toLowerCase()}.` })
        }
    } catch {
        emit('flash', { type: 'is-danger', text: 'Erreur réseau.' })
    }
}

onMounted(loadExchanges)
</script>
