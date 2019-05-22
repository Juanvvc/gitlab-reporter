import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

import gitlab from './modules/gitlab.js'
import sessions from './modules/sessions.js'


export default new Vuex.Store({
  modules: {
    gitlab,
    sessions
  }
})
