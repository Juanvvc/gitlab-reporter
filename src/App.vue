<!-- The main component in the application -->

<template>
  <v-app>
    <v-content>
      <v-container>

        <v-snackbar
          v-model="showAlertMessage"
          :color="alertType"
          :timeout="6000"
          bottom
          >
          {{ alertMessage}}
        </v-snackbar>

        <v-toolbar app dark color="primary darken-2">
          <v-toolbar-title>
            <v-layout column>
              <v-layout row align-center>
                GitLab reporter for:&nbsp;&nbsp;
                <span v-if="loggedUser.is_admin">
                  <v-select
                    :items="users"
                    v-model="currentUser"
                    @change="changeUser"
                  >
                    <template slot="item" slot-scope="prop">
                      {{ prop.item.name }}
                    </template>
                    <template slot="selection" slot-scope="prop">
                      {{ prop.item.name }}
                    </template>
                  </v-select>
                </span>
                <span v-else>
                  {{ currentUser.name }}
                </span>
              </v-layout>
              <span class="caption">
                Server: <strong>{{ gitlab }}</strong>.
                Reporting email: <strong>{{ emailReportHours }}</strong>.
                Report to GitLab: <strong>{{ reportHours }}</strong>.
              </span>
            </v-layout>
          </v-toolbar-title>
        </v-toolbar>

        <p>
          Comments can include <a href="https://docs.gitlab.com/ee/user/project/quick_actions.html">quick actions</a>, such as <em>/done</em> or <em>/close</em>. GitLab marks a task as done if a user comments on it. To prevent this, a <em>/todo</em> will be sent automatically after all comments, unless <em>/done</em> or <em>/close</em> is used.
        </p>

        <session-control />

        <v-tabs
          v-model="activeTab"
          color="primary"
          dark
          icons-and-text
          centered >

          <v-tab href="#tab-reporter">Reporter<v-icon>mdi-account-clock</v-icon></v-tab>
          <v-tab href="#tab-calendar">Calendar<v-icon>calendar_today</v-icon></v-tab>
          <v-tab href="#tab-gantt">Gantt<v-icon>mdi-file-tree</v-icon></v-tab>
          <v-tab href="#tab-config">Settings<v-icon>settings</v-icon></v-tab>
        </v-tabs>

        <v-tabs-items v-model="activeTab" >
          <!-- reporter -->
          <v-tab-item value="tab-reporter">
            <v-card flat>
              <v-card-text>
                <h2>Open issues and TODOs for {{ currentUser.name }}</h2>

                <v-tooltip top>
                  <p slot="activator">Number of tasks: {{ issues.length }}.</p>
                  <span>This list includes issues assigned to you and issues where you are mentioned.</span>
                </v-tooltip>

                <v-alert v-if="issues.length >= maxTasks" type="warning">
                  At most, only {{maxTasks}} random issues are shown. Do you really have more than {{maxTasks}} open issues?
                </v-alert>

                <issues-table :issues="issues" :loading="loading" />

                <report-bar @report-hours="onReportHours" :total-hours-to-report="totalHoursToReport" />
              </v-card-text>
            </v-card>
          </v-tab-item>

          <!-- calendar -->
          <v-tab-item value="tab-calendar">
            <v-card flat height="800px">
              <h2>Calendar</h2>

              <p>The calendar only shows open tasks</p>
              <calendar-view
                :starting-day-of-week="1"
                class="theme-default"
                :events="calendarEvents"
                :show-date="calendarDate"
                @show-date-change="setCalendarDate" >
                <calendar-view-header
                  slot="header"
                  slot-scope="t"
                  :header-props="t.headerProps"
                  @input="setCalendarDate" />
              </calendar-view>
            </v-card>
          </v-tab-item>

          <!-- Gantt -->
          <v-tab-item value="tab-gantt">
            <!--v-card flat height="800px">
              <h2>Gantt</h2>
              <search-project :token="privateToken" :url="gitlabURL + '/projects'" @change="selectedProjectId = arguments[0]"/>
              <project-gantt :token="privateToken" :projectId="selectedProjectId" :url="gitlabURL + '/projects'" />
            </v-card-->
          </v-tab-item>

          <!-- config -->
          <v-tab-item value="tab-config">
            <config-tab />
          </v-tab-item>
        </v-tabs-items>
      </v-container>

      <v-footer class="pa-3">
        <v-spacer></v-spacer>
        <div>&copy; Juan Vera, {{ new Date().getFullYear() }}</div>
      </v-footer>
    </v-content>
  </v-app>
</template>

<script>

import IssuesTable from '@/components/IssuesTable.vue'
import ReportBar from '@/components/ReportBar.vue'
import SearchProject from '@/components/SearchProject.vue'
import ProjectGantt from '@/components/ProjectGantt.vue'
import SessionControl from '@/components/SessionControl.vue'
import ConfigTab from '@/components/ConfigTab.vue'
import {CalendarView, CalendarViewHeader} from 'vue-simple-calendar'
import Config from '@/lib/config.js'
import { mapState } from 'vuex'
require("vue-simple-calendar/static/css/default.css")
require("@mdi/font/css/materialdesignicons.min.css")

const axios = require('axios')

export default {
  name: 'app',

  components: {
    IssuesTable,
    ReportBar,
    CalendarView,
    CalendarViewHeader,
    SearchProject,
    ProjectGantt,
    SessionControl,
    ConfigTab
  },

  data () {
    return {
      activeTab: null,          // identifier of the currently selected tab
      calendarDate: new Date(), // the current date in the calendar
      // manage alert messages
      showAlertMessage: false,
      alertMessage: null,
      alertType: 'success',
      selectedProjectId: undefined // selected project id in the projects view
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

    gitlabURL() {
      return `${this.gitlab}/api/v4`
    },

    maxTasks() {
      return Config.PROJECTS_PER_PAGE
    },

    ...mapState(['loading', 'loggedUser', 'currentUser', 'issues', 'emailReportHours', 'emailSessionTime', 'gitlab', 'reportHours', 'calendarEvents'])
  },

  created () {
    this.$store.commit('loadConfiguration')
    this.$store.dispatch('login')
    this.$store.dispatch('getUsers')
    this.$store.dispatch('getTasks')
  },

  methods: {
    showMessage(info, type='success') {
      this.showAlertMessage = true
      this.alertMessage = info
      this.alertType = type
    },

    onReportHours ({date, morningStartTime, morningEndTime, eveningStartTime, eveningEndTime}) {
      /** report hours */
      let reportBody = []
      for(let i=0; i<this.issues.length; i++) {
        let issue = this.issues[i]
        let hoursToReport = parseFloat(issue.report_hours)
        let commentToReport = issue.report_comment
        if(!isNaN(hoursToReport) && hoursToReport > 0) {
          // create the report message
          let spendTxt='/spend ' + hoursToReport + 'h ' + date
          // this will the appended to the mail body
          reportBody.push(
            {
              project_id: issue.project_id,
              project_name: issue.project_name,
              iid: issue.iid,
              title: issue.title,
              spendTxt: spendTxt,
              comment: commentToReport
            }
          )
          // Append the comment fo the reporting text, if any
          let explicitelyClosed = false
          if(commentToReport) {
            spendTxt = spendTxt + '\n' + commentToReport
            // if /done or /close is used, set the explicitelyClose flag
            explicitelyClosed = (commentToReport.indexOf("/done") + commentToReport.indexOf("/close") !== -2)
          }          

          // report hours, only if a private toke is defined
          if(this.reportHours) {
            let reportURL = '/api/v4/projects/' + issue.project_id + '/issues/' + issue.iid + '/notes'
            axios.post(this.gitlab + reportURL, {body: spendTxt}, {headers: {'Private-Token': this.privateToken}}).then( () => {
              // comments that only report hours, i.e. without a commentToReport, are not real comments and they return HTTP 400.
              // if we get a 200 response from the server, it was a real comment.
              // Now: for some reason, GitLab marks a TODO as done if the user comments on an issue. We don't want it.
              // Unless the user explicitely used /done or /close, send a /todo to the issue.
              if(!explicitelyClosed) {
                axios.post(this.gitlab + reportURL, {body: "/todo"}, {headers: {'Private-Token': this.privateToken}});
                // the result from this POST command is ignored
              }
            }).catch( () => {
              this.showMessage(`Cannot connect to ${this.gitlab}`, 'error')
            })
          }
        }
        issue.report_hours = 0;
        issue.report_comment = '';
      }

      if(!this.reportHours) {
        this.showMessage('Hours won\'t be reported to gitlab', 'warning')
      }

      /** report work times */
      if(this.emailReportHours) {
        let subject = encodeURIComponent(`${date} ${morningStartTime}-${morningEndTime},${eveningStartTime}-${eveningEndTime}`)
        let body = encodeURIComponent(JSON.stringify(reportBody, null, 4))
        if(body) {
          window.open(`mailto:${this.emailReportHours}?subject=${subject}&body=${body}`)
        } else {
          window.open(`mailto:${this.emailReportHours}?subject=${subject}`)
        }
      }
    },

    setCalendarDate(d) {
      // sets the date currently shown on calendar
      this.calendarDate = d;
    },

    changeUser(user) {
      this.currentUser = user
      this.getTasks()
    }
  },

}
</script>

<style>
div#app {
  background-color: #eee;
}

.pointable{
    cursor: pointer;
}

.theme-default .cv-event.calendar-milestone {
	background-color: #ffe7d0;
	border-color: #f7e0c7;
}
.theme-default .cv-event.calendar-task {
	background-color:#e7e7ff;
	border-color: #e0e0f0;
}
</style>
