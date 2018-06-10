<!-- The main component in the application -->

<template>
  <v-app>
    <v-content>
      <v-container>
        <h1>Task viewer and reporter</h1>

        <v-tabs
          v-model="activeTab"
          color="primary"
          dark
        >
          <v-tab href="#tab-reporter"><v-icon>timer</v-icon> Reporter</v-tab>
          <v-tab href="#tab-calendar"><v-icon>calendar_today</v-icon> Calendar</v-tab>
          <v-tab href="#tab-config"><v-icon>settings</v-icon> Settings</v-tab>

          <!-- reporter -->
            <v-tab-item id="tab-reporter">
              <v-card flat>
                <v-card-text>
                  <h2>Open issues assigned to me</h2>

                  <p>Number of tasks: {{ issues.length }}</p>

                  <v-alert v-model="issues.length >= 20" type="warning">
                    At most, only 20 random issues are shown. Do you really have more than 20 open issues?
                  </v-alert>

                  <issues-table :issues="issues" />

                  <report-bar @report-hours="reportHours" :total-hours-to-report="totalHoursToReport" />
                </v-card-text>
              </v-card>
            </v-tab-item>

            <!-- calendar -->
            <v-tab-item id="tab-calendar">
              <v-card flat height="800px">
                  <calendar-view
                    :starting-day-of-week="1"
                    class="theme-default"
                    :events="calendarEvents"
                    :show-date="calendarDate"
                    @show-date-change="setCalendarDate"
                  />
              </v-card>
            </v-tab-item>

            <!-- config -->
            <v-tab-item id="tab-config">
              <v-card flat>
                <v-card-text>
                  <v-text-field
                    v-model="privateToken"
                    label="Gitlab private token"
                    required
                    @change="tokenChanged"
                  ></v-text-field>
                </v-card-text>
              </v-card>
            </v-tab-item>
        </v-tabs>
      </v-container>

      <v-footer class="pa-3">
        <v-spacer></v-spacer>
        <div>&copy; Juan Vera, {{ new Date().getFullYear() }}</div>
      </v-footer>
    </v-content>
  </v-app>
</template>

<script>

import IssuesTable from './IssuesTable.vue'
import ReportComponent from './ReportBar.vue'
import CalendarView from 'vue-simple-calendar'
require("vue-simple-calendar/dist/static/css/default.css")

import 'basil.js';

let GITLAB = 'http://gitlab.incide.es'

var basil = new window.Basil({namespace: 'gitlab-reporter'});

export default {
  name: 'app',

  components: {
    'issues-table': IssuesTable,
    'report-bar': ReportComponent,
    'calendar-view': CalendarView
  },

  data () {
    return {
      issues: [],               // issues, as returned by gitlab (see getIssues for some extra fields)
      activeTab: null,          // identifier of the currently selected tab
      privateToken: null,       // user private token in gitlab
      calendarEvents: [],       // an array of calendar events, as vue-simple-calendar needs
      calendarDate: new Date()  // the current date in the calendar
    }
  },

  computed: {
    totalHoursToReport () {
      // get the total number of hours to be reported now
      let rh = 0;
      for(let i=0; i<this.issues.length; i++) {
        rh += parseFloat(this.issues[i].time_reported);
      }
      return rh;
    }
  },

  created () {
    // get the lat used token
    this.privateToken = basil.get('private-token')
    if(!this.privateToken) {
      this.activeTab = 'tab-config'
    } else {
      this.getIssues()
      this.activeTab = 'tab-reporter'
    }
  },

  methods: {
    getIssues () {
      // Get issues assinged to the user in gitlab
      // these fields are appende to every issue:
      // - project_namespace
      // - project_name (actually, it is the "project name" part of the URL. You'll only notice differentes if the name has special characters
      // - project_url : the URL to the project
      // - time_reported: time to report next time the user clicks on 'report'

      /* note: scope can be:
      - created_by_me (created-by-me if version<11) This is the default value
      - assigned_to_me (assigned-to-me if version<11)
      - all
      */
      this.$http.get(GITLAB + '/api/v4/issues', {params: {scope: 'assigned-to-me', state: 'opened'}, headers: {'Private-Token': this.privateToken}}).then( response => {
        let myissues = response.body
        this.calendarEvents = []
        let processedMilestones = []
        for(let i=0; i<myissues.length; i++) {
          let issue = myissues[i]
          // build assignee names
          issue.assignee_names = issue.assignees.map( a => a.name ).join()

          // get project name
          let url_tokens = issue.web_url.split('/')
          issue.project_name = url_tokens[4]
          issue.project_namespace = url_tokens[3] + '/' + url_tokens[4]
          issue.project_url = GITLAB + '/' + issue.project_namespace

          // timereported
          issue.time_reported = 0

          // create calendar events
          if(issue.due_date) {
            let event = {
              startDate: issue.due_date,
              title: issue.project_name + ': ' + issue.title + ' (' + issue.time_stats.human_time_estimate + ')'
            }
            this.calendarEvents.push(event)
          }

          // manage milestones
          if(issue.milestone) {
            let milestoneStartDate = issue.milestone.start_date?issue.milestone.start_date:issue.milestone.created_at
            let milestoneEndDate = issue.milestone.due_date
            // if the milestone has an end data and it is not yet processes, add the event
            if (milestoneEndDate && processedMilestones.indexOf(issue.milestone.iid) == -1) {
              this.calendarEvents.push({
                startDate: milestoneStartDate,
                endDate: milestoneEndDate,
                title: issue.milestone.title,
                classes: ['orange']
              })
              processedMilestones.push(issue.milestone.iid)
            }
          }
        }
        this.issues = myissues
      })
    },

    reportHours (date) {
      /** report hours */
      for(let i=0; i<this.issues.length; i++) {
        let issue = this.issues[i]
        let hoursToReport = parseFloat(issue.time_reported)
        if(!isNaN(hoursToReport) && hoursToReport > 0) {
          let spendTxt = '/spend ' + hoursToReport + 'h ' + date
          let reportURL = '/api/v4/projects/' + issue.project_id+ '/issues/' + issue.iid + '/notes'
          this.$http.post(GITLAB + reportURL, {body: spendTxt}, {headers: {'Private-Token': this.privateToken}})
          // Since we are reporting, we are not really creating a real note. The previous request will return 404 always
        }
        issue.time_reported = 0;
      }
    },

    setCalendarDate(d) {
      // sets the date currently shown on calendar
      this.calendarDate = d;
    },

    tokenChanged(token) {
      // when a new token is configured, load issues
      basil.set('private-token', this.privateToken)
      this.getIssues()
      this.activeTab = 'tab-reporter'
    }
  },

}
</script>

<style>

</style>
