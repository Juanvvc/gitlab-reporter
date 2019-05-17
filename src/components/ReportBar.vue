<!--

Shows a bar to manage the reporting controls:

- Pick the day you want to report
- See the current number of hours to be reported
- Report button.

Events:

- report-hours(date): date is a YYYY-MM-DD with the currently selected date.

-->

<template>
  <v-layout column>
    <v-layout row wrap align-center>
      <v-spacer></v-spacer>
      <v-flex xs12 sm6 md4>
        <v-menu
          ref="dateMenu"
          :close-on-content-click="false"
          v-model="dateMenu"
          :nudge-right="40"
          :return-value.sync="date"
          lazy
          transition="scale-transition"
          offset-y
          full-width
          min-width="290px"
        >
          <v-text-field
            slot="activator"
            v-model="date"
            label="Day to report"
            prepend-icon="event"
            readonly
          ></v-text-field>
          <v-date-picker v-model="date" @input="$refs.dateMenu.save(date)" first-day-of-week="1"></v-date-picker>

        </v-menu>
      </v-flex>
      <v-spacer></v-spacer>
      <v-flex>
        Total hours to report: <strong>{{ Number(totalHoursToReport).toFixed(2) }}</strong>.
      </v-flex>
      <v-flex>
        Total work hours: <strong>{{ Number(workHours).toFixed(2) }}</strong>.
      </v-flex>
      <v-spacer></v-spacer>
      <v-flex>
        <v-btn
            @click.native="$emit('report-hours', {date, morningStartTime, morningEndTime, eveningStartTime, eveningEndTime})"
            color="primary"
            dark >
            Report
        </v-btn>
      </v-flex>
    </v-layout>
    <v-layout row align-center>
      <v-flex sm3>
        <v-menu
          ref="morningStartTimeMenu"
          v-model="morningStartTimeMenu"
          :close-on-content-click="false"
          :nudge-right="40"
          :return-value.sync="morningStartTime"
          lazy
          transition="scale-transition"
          offset-y
          full-width
          max-width="290px"
          min-width="290px"
        >
          <template v-slot:activator="{ on }">
            <v-text-field
              v-model="morningStartTime"
              label="Morning start time"
              :prepend-icon="clockInIcon"
              readonly
              v-on="on"
            ></v-text-field>
          </template>
          <v-time-picker
            v-if="morningStartTimeMenu"
            v-model="morningStartTime"
            full-width
            format="24h"
            no-title
            @click:minute="$refs.morningStartTimeMenu.save(morningStartTime)"
          ></v-time-picker>
        </v-menu>
      </v-flex>
      <v-flex sm3>
        <v-menu
          ref="morningEndTimeMenu"
          v-model="morningEndTimeMenu"
          :close-on-content-click="false"
          :nudge-right="40"
          :return-value.sync="morningEndTime"
          lazy
          transition="scale-transition"
          offset-y
          full-width
          max-width="290px"
          min-width="290px"
        >
          <template v-slot:activator="{ on }">
            <v-text-field
              v-model="morningEndTime"
              label="Morning end time"
              :prepend-icon="clockOutIcon"
              readonly
              v-on="on"
            ></v-text-field>
          </template>
          <v-time-picker
            v-if="morningEndTimeMenu"
            v-model="morningEndTime"
            full-width
            format="24h"
            no-title
            @click:minute="$refs.morningEndTimeMenu.save(morningEndTime)"
          ></v-time-picker>
        </v-menu>
      </v-flex>
      <v-flex sm3>
        <v-menu
          ref="eveningStartTimeMenu"
          v-model="eveningStartTimeMenu"
          :close-on-content-click="false"
          :nudge-right="40"
          :return-value.sync="eveningStartTime"
          lazy
          transition="scale-transition"
          offset-y
          full-width
          max-width="290px"
          min-width="290px"
        >
          <template v-slot:activator="{ on }">
            <v-text-field
              v-model="eveningStartTime"
              label="Evening start time"
              :prepend-icon="clockInIcon"
              readonly
              v-on="on"
            ></v-text-field>
          </template>
          <v-time-picker
            v-if="eveningStartTimeMenu"
            v-model="eveningStartTime"
            full-width
            format="24h"
            no-title
            @click:minute="$refs.eveningStartTimeMenu.save(eveningStartTime)"
          ></v-time-picker>
        </v-menu>
      </v-flex>
            <v-flex sm3>
        <v-menu
          ref="eveningEndTimeMenu"
          v-model="eveningEndTimeMenu"
          :close-on-content-click="false"
          :nudge-right="40"
          :return-value.sync="eveningEndTime"
          lazy
          transition="scale-transition"
          offset-y
          full-width
          max-width="290px"
          min-width="290px"
        >
          <template v-slot:activator="{ on }">
            <v-text-field
              v-model="eveningEndTime"
              label="Evening end time"
              :prepend-icon="clockOutIcon"
              readonly
              v-on="on"
            ></v-text-field>
          </template>
          <v-time-picker
            v-if="eveningEndTimeMenu"
            v-model="eveningEndTime"
            full-width
            format="24h"
            no-title
            @click:minute="$refs.eveningEndTimeMenu.save(eveningEndTime)"
          ></v-time-picker>
        </v-menu>
      </v-flex>
    </v-layout>
  </v-layout>
</template>

<script>

import moment from 'moment'

export default {
  props: {
    totalHoursToReport: {
      type: Number,
      required: true
    }
  },

  data () {
    return {
      date: moment().format('YYYY-MM-DD'),
      dateMenu: false,
      morningStartTimeMenu: false,
      morningEndTimeMenu: false,
      eveningStartTimeMenu: false,
      eveningEndTimeMenu: false,
      morningStartTime: "09:00",
      morningEndTime: "13:00",
      eveningStartTime: "14:00",
      eveningEndTime: "18:00",
    }
  },

  computed: {
    workHours () {
      let s = moment(this.morningEndTime, 'HH:mm') - moment(this.morningStartTime, 'HH:mm') + moment(this.eveningEndTime, 'HH:mm') - moment(this.eveningStartTime, 'HH:mm')
      return s / 1000 / 60 / 60
    },

    clockInIcon () {
      // Show icons only on large screens
      switch (this.$vuetify.breakpoint.name) {
        case 'md': case 'lg': case 'xl': return 'mdi-clock-in'
      }
      return ''
    },

    clockOutIcon () {
      // Show icons only on large screens
      switch (this.$vuetify.breakpoint.name) {
        case 'md': case 'lg': case 'xl': return 'mdi-clock-out'
      }
      return ''
    }
  }
}
</script>
