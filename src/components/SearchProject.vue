<template>
  <v-autocomplete
    label="Project Name"
    v-model="selectedProject"
    :loading="isLoading"
    :items="projects"
    item-text="name"
    item-value="id"
    :search-input.sync="search"
    @change="$emit('change', selectedProject)"
  ></v-autocomplete>
</template>

<script>
const axios = require('axios')
import Config from '@/lib/config.js'
import Console from '@/lib/Console.js'

export default {
  props: {
    token: {
      mandatory: true,
      type: String
    },
    url: {
      mandatory: true,
      type: String
    }
  },

  watch: {
    search (val) {
      // Items have already been requested
      if (this.isLoading) return
      this.isLoading = true

      // Lazily load input items
      axios.get(this.url, {params: {'simple': 'true', 'archived': 'true', 'order_by': 'name', 'sort': 'asc', 'per_page': Config.PROJECTS_PER_PAGE, 'search': val}, headers: {'Private-Token': this.token}})
        .then(res => {
          this.projects = res.data.map(p => {return {name: p.name, id: p.id}})
        })
        .catch(err => {
          Console.log(err)
        })
        .finally(() => (this.isLoading = false))
    }
  },

  data () {
    return {
      search: '',
      isLoading: false,
      projects: [],
      selectedProject: undefined
    }
  }
}
</script>