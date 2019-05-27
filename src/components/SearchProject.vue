<template>
  <v-autocomplete
    label="Project Name"
    v-model="selectedProject"
    hint="Enter at least three characters to search for projects"
    :loading="isLoading"
    :items="projects"
    item-text="name"
    item-value="id"
    :disabled="disabled"
    :search-input.sync="search"
    @change="$emit('change', selectedProject)"
  ></v-autocomplete>
</template>

<script>
const axios = require('axios')
import {mapState, mapGetters} from 'vuex'
import Config from '@/lib/config.js'
import Console from '@/lib/Console.js'

/**
* Shows a selection controller to select a project. Projects are consulted dynamically.
* The Gantt diagram dependes on the gitlab vuex module, but does not use its methods.
* @vue-computed {String} privateToken - store.gitlab.privateToken
* @vue-computed {String} gitlab - store.gitlab.gitlab
* @vue-computed {Boolean} disabed - True if the component must be disabled
* @vue-data {String} search - temporal string with the current input, to be used in lazy load.
* @vue-data {Array} projects - an array with the names of the projects matching current search
* @vue-data {String} selectedProject - the currently selected project
* @vue-event {String} change - the information about the currently selected project
*/
export default {
  data () {
    return {
      search: '',
      isLoading: false,
      projects: [],
      selectedProject: undefined
    }
  },

  computed: {
    disabled() {
      return !this.gitlab || !this.privateToken
    },
    ...mapState('gitlab', ['gitlab', 'privateToken']),
    ...mapGetters('gitlab', ['gitlabURL'])
  },

  watch: {
    /** Search possible matching projects when the user enters some initial characters */
    async search (val) {
      // Items have already been requested
      if (this.isLoading || !this.gitlab || !this.privateToken) return
      if(!val || val.length < 3) {
        // if the search string is very short, return
        this.projects = []
        return
      }

      // Lazy load input items
      this.isLoading = true
      try{
        let res = await axios.get(`${this.gitlabURL}/projects`, {params: {'simple': 'true', 'archived': 'true', 'order_by': 'name', 'sort': 'asc', 'per_page': Config.PROJECTS_PER_PAGE, 'search': val}, headers: {'Private-Token': this.privateToken}})
        if(res) {
            this.projects = res.data.map(p => {return {name: p.name, id: p.id}})
        }
      } catch(msg) {
        this.$store.commit('messages/message', {type: 'error', message: msg}, {root: true})
      }
      this.isLoading = false
    }
  },
}
</script>
