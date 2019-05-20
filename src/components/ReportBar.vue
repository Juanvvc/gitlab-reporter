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
      dateMenu: false
    }
  },

  computed: {
    workHours () {
      return 8
    },
  }
}
</script>
