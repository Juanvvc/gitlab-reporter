<!--

Shows a bar to manage the reporting controls:

- Pick the day you want to report
- See the current number of hours to be reported
- Report button.

Events:

- report-hours(date): date is a YYYY-MM-DD with the currently selected date.
- change-date(date): date is a YYYY-MM-DD with the currently selected date.

-->

<template>
  <v-column>
    <v-row   align="center">
      <v-spacer></v-spacer>
      <v-col cols="12" sm="6" md="4">
        <v-menu
          ref="dateMenu"
          :close-on-content-click="false"
          v-model="dateMenu"
          :nudge-right="40"
          :return-value.sync="date"
          transition="scale-transition"
          offset-y
          full-width
          min-width="290px"
        >
          <template v-slot:activator="{ on }">
            <v-text-field
              v-on="on"
              v-model="date"
              label="Day to report"
              prepend-icon="mdi-calendar-blank"
              readonly
            ></v-text-field>
          </template>
          <v-date-picker v-model="date" @input="changeDate(date)" first-day-of-week="1"></v-date-picker>

        </v-menu>
      </v-col>
      <v-spacer></v-spacer>
      <v-col>
        Total hours to report: <strong>{{ Number(totalHoursToReport).toFixed(2) }}</strong>.
      </v-col>
      <v-spacer></v-spacer>
      <v-col>
        <v-btn
            @click.native="$emit('report-hours', {date})"
            color="primary"
            dark >
            Report
        </v-btn>
      </v-col>
    </v-row>
  </v-column>
</template>

<script>

import moment from 'moment'
import { mapState } from 'vuex'
import Console from '@/lib/Console'


export default {
  data () {
    return {
      date: moment().format('YYYY-MM-DD'),
      dateMenu: false
    }
  },

  computed: {
    totalHoursToReport () {
      // get the total number of hours to be reported now
      let rh = 0;
      for(let i=0; i<this.issues.length; i++) {
        rh += parseFloat(this.issues[i].report_hours);
      }
      return rh;
    },

    ...mapState('gitlab', ['issues'])
  },

  methods: {
    changeDate(date) {
      this.$refs.dateMenu.save(date)
      this.$emit('change-date', {date})
    }
  }
}
</script>
