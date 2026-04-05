// ============================================================
// main.js — Point d'entrée de l'application Vue.js
// ============================================================
import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/style.css'

const app = createApp(App)
app.use(router)
app.mount('#app')
