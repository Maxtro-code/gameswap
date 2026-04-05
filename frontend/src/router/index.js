// ============================================================
// router/index.js — Configuration du routeur Vue
// ============================================================
import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import AddGameView from '../views/AddGameView.vue'
import MyGamesView from '../views/MyGamesView.vue'
import ExchangesView from '../views/ExchangesView.vue'

const routes = [
    {
        path: '/',
        name: 'home',
        component: HomeView
    },
    {
        path: '/login',
        name: 'login',
        component: LoginView
    },
    {
        path: '/register',
        name: 'register',
        component: RegisterView
    },
    {
        path: '/add-game',
        name: 'addGame',
        component: AddGameView,
        meta: { requiresAuth: true }
    },
    {
        path: '/my-games',
        name: 'myGames',
        component: MyGamesView,
        meta: { requiresAuth: true }
    },
    {
        path: '/exchanges',
        name: 'exchanges',
        component: ExchangesView,
        meta: { requiresAuth: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

// Navigation guard : vérification de l'authentification
router.beforeEach(async (to, from, next) => {
    if (to.meta.requiresAuth) {
        try {
            const res = await fetch('/api/auth/me')
            const data = await res.json()
            if (!data.authenticated) {
                next({ name: 'login' })
            } else {
                next()
            }
        } catch {
            next({ name: 'login' })
        }
    } else {
        next()
    }
})

export default router
