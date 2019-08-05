<template>
  <v-container fluid>
    <v-layout row align-center justify-start wrap>
      <v-flex xs1 class="hidden-sm-and-down">Sessions:</v-flex>
      <v-tooltip top>
        <template v-slot:activator="{ on }">
         <v-btn v-on="on" text color="green" class="white--text" @click="$store.dispatch('sessions/startSession')"><v-icon>mdi-clock-in</v-icon> Start session</v-btn>
        </template>
        <span>Start a session and (optionally) send the email inmediately</span>
      </v-tooltip>
      <v-tooltip top>
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" text color="red" class="white--text" @click="$store.dispatch('sessions/stopSession')"><v-icon>mdi-clock-out</v-icon> End session</v-btn>
        </template>
        <span>Stop a session and (optionally) send the email inmediately</span>
      </v-tooltip>
      <v-tooltip top>
        <template v-slot:activator="{ on }">
          <v-btn v-on="on" text color="primary" class="white--text" @click="customSessions"><v-icon>mdi-clock</v-icon> Custom sessions</v-btn>
        </template>
        <span>Enter the session information manually and send inmediately an email</span>
      </v-tooltip>
      <v-spacer />
      <v-flex>
        {{ sessionText }}
      </v-flex>
    </v-layout>

    <edit-data-dialog ref="editDataDialog" save="Send"/>
  </v-container>
</template>

<script>

import EditDataDialog from './EditDataDialog.vue'
import { mapState } from 'vuex'
import Config from '@/lib/config'
import moment from 'moment'
import Console from '@/lib/Console'

/** Get information about today's sessions.
* @param {Array} activeSessions - The activeSessions array in the Vuex module sessions state.
* @returns An object. duration is the total hours of today's sessions. sessions is a readable text describing today's sessions
*/
function todaySessions(activeSessions) {
  let currentSession = {start: '?', end: '?'}
  let duration = 0
  let sessions = []
  for(let i=0; i<activeSessions.length; i++) {
    let s = activeSessions[i]
    if(s.action === 'start') {
      currentSession.start = s.time
    } else {
      currentSession.end = s.time
      if(currentSession.start !== '?') {
        // we calculate difference in minutes because if we set hours, we only get full hours
        duration += moment(currentSession.end, ['H:m']).diff(moment(currentSession.start, ['H:m']), 'minutes')
      }
      sessions.push(`${currentSession.start}-${currentSession.end}`)
      currentSession = {start: '?', end: '?'}
    }
  }
  // manage the last session if it is open
  if(currentSession.start !== '?') {
    sessions.push(`${currentSession.start}-?`)
    duration += moment().diff(moment(currentSession.start, ['H:m']), 'minutes')
  }
  return {duration: duration / 60, sessions: sessions.join(',')}
}

/**
* A container to stop and start sessions.
* @module components/SessionControl
*/
export default {
  components: {
    EditDataDialog
  },

  props: {
    currentDate: moment()
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
        return 'No sessions detected in this computer'
      } else {
        return `Sessions: ${this.sessions}. Total ${this.duration} hours.`
      }
    },

    /** Returns the last session action, or undefined if there is not any session.
    * @returns Either "start", "stop" or undefined
    */
    lastSessionAction() {
      if(!this.sessions) {
        return undefined
      }
      return this.activeSessions[this.activeSessions.length - 1].action
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
    // update the duration every UPDATE_TIMEOUT milliseconds
    this.interval = setInterval(() => this.updateSessions(), Config.UPDATE_DURATION)
  },

  beforeDestroy() {
    if(this.interval) {
      clearInterval(this.interval)
      this.interval = undefined
    }
  },

  methods: {
    async customSessions() {
      let params = {
        title: 'Custom sessions',
        fields: [
          {label: 'Sessions', name: 'sessions', value: todaySessions(this.activeSessions).sessions , type: 'textfield', hint: 'Example: 9:00-13:00,14:00-15:00'},
          {label: 'Date', name: 'date', value:  moment(this.currentDate).format('YYYY-MM-DD'), type: 'textfield', hint: 'Example: 2019-08-31'}
        ]
      }

      let newMetadata = await this.$refs.editDataDialog.edit(params)
      if(newMetadata) {
        this.$store.dispatch('sessions/customSessions', newMetadata)
        this.updateSessions()
      }
    },

    /** Update the session information text */
    updateSessions() {
      let ts = todaySessions(this.activeSessions)
      this.sessions = ts.sessions
      this.duration = Number(ts.duration).toFixed(2)
    }
  }
}
</script>
