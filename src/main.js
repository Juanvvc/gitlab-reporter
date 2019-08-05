import '@babel/polyfill'
import Vue from 'vue'
import vuetify from '@/plugins/vuetify.js'
import App from './App.vue'
import store from './store'

Vue.config.productionTip = false
store.dispatch('loadState')

new Vue({
  store,
  render: h => h(App),
  vuetify
}).$mount('#app')
