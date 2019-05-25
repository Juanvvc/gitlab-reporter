<template>
  <v-container fluid>
    <v-layout row align-center justify-start wrap>
      <v-flex xs1 class="hidden-sm-and-down">Sessions:</v-flex>
      <v-tooltip top>
         <v-btn slot="activator" color="green" class="white--text" @click="$store.dispatch('sessions/startSession')"><v-icon>mdi-clock-in</v-icon> Start session</v-btn>
        Start a session and (optionally) send the email inmediately
      </v-tooltip>
      <v-tooltip top>
        <v-btn slot="activator" color="red" class="white--text" @click="$store.dispatch('sessions/stopSession')"><v-icon>mdi-clock-out</v-icon> End session</v-btn>
        Stop a session and (optionally) send the email inmediately
      </v-tooltip>
      <v-tooltip top>
        <v-btn slot="activator" color="primary" class="white--text" @click="customSessions"><v-icon>mdi-clock</v-icon> Custom sessions</v-btn>
        Enter the session information manyllay and (optionally) the email inmediately
      </v-tooltip>
      <v-flex>
        {{ sessionText }}
      </v-flex>
    </v-layout>

    <edit-data-dialog ref="editDataDialog" save="Send"/>
  </v-container>
</template>

<script>

/**
* A container to control sessions.
*/

import EditDataDialog from './EditDataDialog.vue'
import { mapState } from 'vuex'


export default {
  components: {
    EditDataDialog
  },

  data() {
    return {
      sessions: undefined,
      duration: "0"
    }
  },

  computed: {
    sessionText() {
      if(!this.sessions) {
        return 'No sessions detected on this computer'
      } else {
        return `Sessions: ${this.sessions}. Total ${this.duration} hours.`
      }
    },
    ...mapState('sessions', ['activeSessions'])
  },

  watch: {
    activeSessions() {
      this.updateSessions()
    }
  },

  mounted() {
    this.updateSessions()
  },

  methods: {
    async customSessions() {
      let params = {
        title: 'Custom sessions',
        fields: [
          {label: 'Sessions', name: 'sessions', value: this.$store.getters['sessions/todaySessions'].sessions , type: 'textfield', hint: 'Example: 9:00-13:00,14:00-15:00'},
        ]
      }

      let newMetadata = await this.$refs.editDataDialog.edit(params)
      if(newMetadata && newMetadata.sessions) {
        this.$store.dispatch('sessions/customSessions', newMetadata)
      }
    },

    /** Update the session information text */
    updateSessions() {
      let todaySessions = this.$store.getters['sessions/todaySessions']
      this.sessions = todaySessions.sessions
      this.duration = Number(todaySessions.duration).toFixed(2)
    }
  }
}
</script>