<template>
    <!-- ========== NAVBAR ========== -->
    <nav class="navbar is-dark is-fixed-top" role="navigation">
        <div class="container">
            <div class="navbar-brand">
                <router-link to="/" class="navbar-item brand-logo">
                    <i class="fas fa-gamepad"></i>&nbsp;&nbsp;GameSwap
                </router-link>
                <a class="navbar-burger" :class="{ 'is-active': menuOpen }" @click="menuOpen = !menuOpen">
                    <span></span><span></span><span></span><span></span>
                </a>
            </div>

            <div class="navbar-menu" :class="{ 'is-active': menuOpen }">
                <div class="navbar-start">
                    <router-link to="/" class="navbar-item" @click="menuOpen = false">
                        <i class="fas fa-house"></i>&nbsp; Catalogue
                    </router-link>
                    <router-link v-if="user" to="/add-game" class="navbar-item" @click="menuOpen = false">
                        <i class="fas fa-plus-circle"></i>&nbsp; Ajouter un jeu
                    </router-link>
                    <router-link v-if="user" to="/my-games" class="navbar-item" @click="menuOpen = false">
                        <i class="fas fa-boxes-stacked"></i>&nbsp; Mes jeux
                    </router-link>
                    <router-link v-if="user" to="/exchanges" class="navbar-item" @click="menuOpen = false">
                        <i class="fas fa-right-left"></i>&nbsp; Échanges
                    </router-link>
                </div>

                <div class="navbar-end">
                    <div class="navbar-item" v-if="user">
                        <span class="tag is-info is-medium">
                            <i class="fas fa-user"></i>&nbsp; {{ user.username }}
                        </span>
                    </div>
                    <div class="navbar-item">
                        <div class="buttons">
                            <template v-if="!user">
                                <router-link to="/register" class="button is-primary" @click="menuOpen = false">
                                    <i class="fas fa-user-plus"></i>&nbsp; Inscription
                                </router-link>
                                <router-link to="/login" class="button is-light" @click="menuOpen = false">
                                    <i class="fas fa-sign-in-alt"></i>&nbsp; Connexion
                                </router-link>
                            </template>
                            <button v-else class="button is-danger is-outlined" @click="logout">
                                <i class="fas fa-sign-out-alt"></i>&nbsp; Déconnexion
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </nav>

    <!-- ========== NOTIFICATION FLASH ========== -->
    <div v-if="flash" class="notification flash-notification" :class="flash.type">
        <button class="delete" @click="flash = null"></button>
        {{ flash.text }}
    </div>

    <!-- ========== CONTENU PRINCIPAL ========== -->
    <section class="section main-content">
        <div class="container">
            <router-view :user="user" @flash="showFlash" @login="checkAuth" />
        </div>
    </section>

    <!-- ========== FOOTER ========== -->
    <footer class="footer">
        <div class="content has-text-centered">
            <p>
                <strong>GameSwap</strong> — Projet BTS SIO SLAM
                &nbsp;|&nbsp; Développé avec
                <i class="fab fa-vuejs" style="color: #42b883"></i> Vue.js &amp;
                <i class="fab fa-node-js" style="color: #68a063"></i> Node.js
            </p>
        </div>
    </footer>
</template>

<script setup>
// ============================================================
// App.vue — Composant racine de l'application
// ============================================================
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// --- État global ---
const user     = ref(null)
const flash    = ref(null)
const menuOpen = ref(false)

// --- Vérifier si l'utilisateur est connecté ---
async function checkAuth() {
    try {
        const res  = await fetch('/api/auth/me')
        const data = await res.json()
        user.value = data.authenticated ? data.user : null
    } catch {
        user.value = null
    }
}

// --- Déconnexion ---
async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    user.value = null
    menuOpen.value = false
    router.push('/')
    showFlash({ type: 'is-info', text: 'Vous êtes déconnecté.' })
}

// --- Afficher une notification ---
function showFlash(msg) {
    flash.value = msg
    setTimeout(() => { flash.value = null }, 4000)
}

// --- Au montage : vérifier la session ---
onMounted(checkAuth)
</script>
