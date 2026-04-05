<template>
    <div class="columns is-centered">
        <div class="column is-5-desktop is-8-tablet">
            <div class="box auth-box">
                <h2 class="title is-3 has-text-centered">
                    <i class="fas fa-sign-in-alt"></i> Connexion
                </h2>

                <form @submit.prevent="login">
                    <div class="field">
                        <label class="label">Nom d'utilisateur</label>
                        <div class="control has-icons-left">
                            <input class="input" type="text" v-model="username"
                                   placeholder="Votre pseudo" required>
                            <span class="icon is-left"><i class="fas fa-user"></i></span>
                        </div>
                    </div>

                    <div class="field">
                        <label class="label">Mot de passe</label>
                        <div class="control has-icons-left">
                            <input class="input" type="password" v-model="password"
                                   placeholder="Votre mot de passe" required>
                            <span class="icon is-left"><i class="fas fa-lock"></i></span>
                        </div>
                    </div>

                    <p v-if="error" class="help is-danger">{{ error }}</p>

                    <div class="field mt-4">
                        <button class="button is-primary is-fullwidth is-medium"
                                :class="{ 'is-loading': submitting }" type="submit">
                            Se connecter
                        </button>
                    </div>
                </form>

                <p class="has-text-centered mt-4">
                    Pas encore de compte ?
                    <router-link to="/register">S'inscrire</router-link>
                </p>
            </div>
        </div>
    </div>
</template>

<script setup>
// ============================================================
// LoginView.vue — Formulaire de connexion
// ============================================================
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const emit   = defineEmits(['flash', 'login'])
const router = useRouter()

const username   = ref('')
const password   = ref('')
const error      = ref('')
const submitting = ref(false)

async function login() {
    error.value      = ''
    submitting.value  = true
    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username.value,
                password: password.value
            })
        })
        const data = await res.json()

        if (res.ok) {
            emit('login')   // Demande au parent (App.vue) de recharger l'état auth
            emit('flash', { type: 'is-success', text: `Bienvenue ${data.user.username} !` })
            router.push('/')
        } else {
            error.value = data.error
        }
    } catch {
        error.value = 'Erreur réseau.'
    }
    submitting.value = false
}
</script>
