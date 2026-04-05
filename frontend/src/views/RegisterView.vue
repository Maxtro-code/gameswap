<template>
    <div class="columns is-centered">
        <div class="column is-5-desktop is-8-tablet">
            <div class="box auth-box">
                <h2 class="title is-3 has-text-centered">
                    <i class="fas fa-user-plus"></i> Inscription
                </h2>

                <form @submit.prevent="register">
                    <div class="field">
                        <label class="label">Nom d'utilisateur</label>
                        <div class="control has-icons-left">
                            <input class="input" type="text" v-model="username"
                                   placeholder="Pseudo (3-50 car.)" required minlength="3" maxlength="50">
                            <span class="icon is-left"><i class="fas fa-user"></i></span>
                        </div>
                    </div>

                    <div class="field">
                        <label class="label">Mot de passe</label>
                        <div class="control has-icons-left">
                            <input class="input" type="password" v-model="password"
                                   placeholder="6 caractères minimum" required minlength="6">
                            <span class="icon is-left"><i class="fas fa-lock"></i></span>
                        </div>
                    </div>

                    <div class="field">
                        <label class="label">Confirmer le mot de passe</label>
                        <div class="control has-icons-left">
                            <input class="input" type="password" v-model="confirmPassword"
                                   placeholder="Répétez le mot de passe" required>
                            <span class="icon is-left"><i class="fas fa-lock"></i></span>
                        </div>
                    </div>

                    <p v-if="error" class="help is-danger">{{ error }}</p>

                    <div class="field mt-4">
                        <button class="button is-primary is-fullwidth is-medium"
                                :class="{ 'is-loading': submitting }" type="submit">
                            Créer mon compte
                        </button>
                    </div>
                </form>

                <p class="has-text-centered mt-4">
                    Déjà un compte ?
                    <router-link to="/login">Se connecter</router-link>
                </p>
            </div>
        </div>
    </div>
</template>

<script setup>
// ============================================================
// RegisterView.vue — Formulaire d'inscription
// ============================================================
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const emit   = defineEmits(['flash'])
const router = useRouter()

const username        = ref('')
const password        = ref('')
const confirmPassword = ref('')
const error           = ref('')
const submitting      = ref(false)

async function register() {
    error.value = ''

    // Validation côté client
    if (password.value !== confirmPassword.value) {
        error.value = 'Les mots de passe ne correspondent pas.'
        return
    }

    submitting.value = true
    try {
        const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: username.value,
                password: password.value
            })
        })
        const data = await res.json()

        if (res.ok) {
            emit('flash', { type: 'is-success', text: 'Compte créé ! Connectez-vous.' })
            router.push('/login')
        } else {
            error.value = data.error
        }
    } catch {
        error.value = 'Erreur réseau.'
    }
    submitting.value = false
}
</script>
