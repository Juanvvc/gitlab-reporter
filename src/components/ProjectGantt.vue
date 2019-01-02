<template>
  <svg ref="mygantt"></svg>
</template>

<script>

const axios = require('axios')
import Gantt from 'frappe-gantt'

export default {
  props: {
    projectId: {
      mandatory: true,
      type: Number
    },
    url: {
      mandatory: true,
      type: String
    },
    token: {
      mandatory: true,
      type: String
    },
  },

  data () {
    return {
      isLoading: false,
      gantt: undefined
    }
  },

  watch: {
    projectId (val) {
      if(this.projectId === undefined) return
      if(this.isLoading) return

      this.isLoading = true
      axios.get(`${this.url}/${this.projectId}/milestones`, {headers: {'Private-Token': this.token}})
        .then(response => {
          let milestones = response.data.map( m => {
            return {
              'start': m.start_date?m.start_date:m.created_at,
              'end': m.due_date?m.due_date:new Date(),
              'name': m.title,
              'id': `milestone-${m.id}`
            }
          })
          let gantt = new Gantt(this.$refs['mygantt'], milestones)
          gantt.change_view_mode('Week')
        })
        .finally(() => {this.isLoading = false})
    }
  }
}
</script>
