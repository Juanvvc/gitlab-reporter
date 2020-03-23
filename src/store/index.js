import Vue from 'vue'
import Vuex from 'vuex'

Vue.use(Vuex)

import gitlab from './modules/gitlab.js'
import sessions from './modules/sessions.js'
import messages from './modules/messages.js'
import Config from '@/lib/config.js'

export default new Vuex.Store({
  modules: {
    gitlab,
    sessions,
    messages
  },
  state: {
    /** The config object {@link config} */
    config: Config
  }
})
