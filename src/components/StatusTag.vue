<template>
  <v-chip small label :color="color" :text-color="textColor" class="compact-form">
  {{ text }}
  </v-chip>
</template>

<script>

import Console from '@/lib/Console.js'
import moment from 'moment'

/** Shows a tag with the status of an issue as a error (open and overdue), warning (today), success (closed).
* @module components/StatusTag
* @vue-prop {Object} issue - The information about an issue.
*/
export default {
  props: {
    issue: {
        mandatory: true,
        type: Object
    }
  },

  computed: {
    textColor() {
      if(this.color !== '') {
        return 'white'
      }
      return 'black'
    },

    color() {
      if(!this.issue) {
        return ''
      }
      if(this.issue.state === 'closed') {
        return 'success'
      } else if (this.issue.state === 'opened') {
        let daysDiff = moment().diff(moment(this.issue.due_date), 'days')
        if(daysDiff === 0) {
          return 'warning'
        } else if(daysDiff > 0) {
          return 'error'
        }
        return ''
      }
    },

    text() {
      if(this.issue) {
        return this.issue.state
      }
    }
  }
}
</script>