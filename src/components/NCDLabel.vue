<template>
  <v-chip small label :color="color" :text-color="textColor" class="compact-form">
  {{ label }}
  </v-chip>
</template>

<script>

import Console from '@/lib/Console.js'

/** Shows a tag with the status of an issue as a error (open and overdue), warning (today), success (closed).
* @module components/StatusTag
* @vue-prop {Object} issue - The information about an issue.
*/
export default {
  props: {
    label: {
        mandatory: true,
        type: String
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
      if(!this.label) {
        return ''
      }
      if(['Prioridad Alta'].includes(this.label)) {
        return 'error'
      } else if (['Prioridad Media'].includes(this.label)) {
        return 'warning'
      } else if (['Done'].includes(this.label)) {
        return 'success'
      } else if (['Waiting', 'Review'].includes(this.label)) {
        return '#0000ff'
      } else if (['To Do', 'Doing'].includes(this.label)) {
        return '#aaff00'
      }
      return ''
    },

    text() {
      if(this.issue) {
        return this.issue.state
      }
      return ''
    }
  }
}
</script>