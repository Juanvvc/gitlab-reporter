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
                Reporting email: <strong>{{ emailReportWorkTime }}</strong>.
                Report to GitLab: <strong>{{ reportHours }}</strong>.
              </span>
            </v-layout>
          </v-toolbar-title>
        </v-toolbar>

        <p>
          Comments can include <a href="https://docs.gitlab.com/ee/user/project/quick_actions.html">quick actions</a>, such as <em>/done</em> or <em>/close</em>. GitLab marks a task as done if a user comments on it. To prevent this, a <em>/todo</em> will be sent automatically after all comments, unless <em>/done</em> or <em>/close</em> is used.
        </p>

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
            <v-card flat height="800px">
              <h2>Gantt</h2>
              <search-project :token="privateToken" :url="gitlabURL() + '/projects'" @change="selectedProjectId = arguments[0]"/>
              <project-gantt :token="privateToken" :projectId="selectedProjectId" :url="gitlabURL() + '/projects'" />
            </v-card>
          </v-tab-item>

          <!-- config -->
          <v-tab-item value="tab-config">
            <v-card flat>
              <v-card-text>
                <h2>Settings</h2>
                <p>
                  These parameters are stored locally in your browser's cache, not in any server.
                  You must reload the page after changing any of these parameters.
                </p>
                <v-text-field
                  v-model="gitlab"
                  label="URL to the gitlab server"
                  hint="If empty, to not get issues and projects"
                  @change="configChanged"
                  required
                ></v-text-field>
                <v-text-field
                  v-model="privateToken"
                  label="Gitlab private token"
                  :hint="`Get the token from ${tokenURL}`"
                  required
                  @change="configChanged"
                ></v-text-field>
                <v-switch
                  label="Calendar: show milestones"
                  v-model="showMilestones"
                  @change="configChanged"
                ></v-switch>
                <v-switch
                  label="Report hours to gitlab"
                  v-model="reportHours"
                  @change="configChanged"
                ></v-switch>
                <v-text-field
                  v-model="emailReportWorkTime"
                  label="Report working hours to this email"
                  hint="If empty, do not report working hours"
                  required
                  @change="configChanged"
                ></v-text-field>
              </v-card-text>
            </v-card>
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
import {CalendarView, CalendarViewHeader} from 'vue-simple-calendar'
import Config from '@/lib/config.js'
require("vue-simple-calendar/static/css/default.css")

require("@mdi/font/css/materialdesignicons.min.css")


import 'basil.js'
const axios = require('axios')

var basil = new window.Basil({namespace: 'gitlab-reporter'});

export default {
  name: 'app',

  components: {
    IssuesTable,
    ReportBar,
    CalendarView,
    CalendarViewHeader,
    SearchProject,
    ProjectGantt
  },

  data () {
    return {
      issues: [],               // issues, as returned by gitlab (see getTasks for some extra fields)
      activeTab: null,          // identifier of the currently selected tab
      privateToken: null,       // user private token in gitlab
      calendarEvents: [],       // an array of calendar events, as vue-simple-calendar needs
      calendarDate: new Date(), // the current date in the calendar
      loggedUser: {name: 'NOT_LOGGED'}, // the user currently logged on
      currentUser: {name: 'NOT_LOGGED'}, // the user currently shown. For not admins, it is the same than loggedUser
      users: [],                // list of users
      showMilestones: true,
      loading: false,
      gitlab: '',               // URL to the gitlab server
      // manage alert messages
      showAlertMessage: false,
      alertMessage: null,
      alertType: 'success',
      emailReportWorkTime: '',
      reportHours: true,
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

    tokenURL() {
      return `${this.gitlab}/profile/personal_access_tokens`
    },

    maxTasks() {
      return Config.PROJECTS_PER_PAGE
    }
  },

  created () {
    // We do not need this field to be watchable
    this.processedMilestones = []

    // get configuration
    this.gitlab = basil.get('gitlab')
    this.showMilestones = basil.get('show-milestones')
    // get the last used token from the cache
    this.privateToken = basil.get('private-token')
    // get whether we must report hours
    this.reportHours = basil.get('report-hours')
    if(this.reportHours === null) {
      // by default: true
      this.reportHours = true
    }
    // get email address to report work time. If not provided, time won't be reported
    this.emailReportWorkTime = basil.get('email-report-work-time')

    this.getTasks()
    this.getUser()
    this.getUsers()
  },

  methods: {
    gitlabURL() {
      return `${this.gitlab}/api/v4`
    },

    showMessage(info, type='success') {
      this.showAlertMessage = true
      this.alertMessage = info
      this.alertType = type
    },

    getUser () {
      // get the the currently logged user

      if(!this.gitlab || !this.privateToken) return
      let url = this.gitlabURL() + '/user'
      axios.get(url, {headers: {'Private-Token': this.privateToken}}).then( response => {
          this.loggedUser = response.data
          this.currentUser = this.loggedUser
        }).catch( () => {
          this.showMessage(`Cannot connect to ${this.gitlab}`, 'error')
        })
    },

    getUsers () {
      // get available users. This method only works if we have an administrative token

      if(!this.gitlab) return
      axios.get(this.gitlab + '/api/v4/users', {params: {'active': 'true'}, headers: {'Private-Token': this.privateToken}}).then( response => {
          this.users = response.data
        }).catch( () => {
          this.showMessage(`Cannot connect to ${this.gitlab}`, 'error')
        })
    },

    getTasks () {
      // get issues and TODOs. This method resets arrays issues, calendarEvents and processedMilestones

      if(!this.gitlab || !this.privateToken) return
      this.issues = []
      this.calendarEvents = []
      this.processedMilestones = []

      if (this.loggedUser.is_admin) {
        // if the logged user is an admin, get issues for the current user with sudo parameter
        this.getRemoteTasks({state: 'pending', type: 'Issue', sudo: this.currentUser.username, per_page: Config.PROJECTS_PER_PAGE})
      } else {
        // if the logged user is not an admin, just get the default issues (i.e., his/her issues)
        // assigned to me
        //this.getRemoteTasks({action: 'assigned', state: 'pending', type: 'Issue'})
        // mentions
        //this.getRemoteTasks({action: 'mentioned', state: 'pending', type: 'Issue'})
        // TODOs created by me.
        // For some reason, if the todo was set as DONE but marked again, it won't appear with the other filters
        //this.getRemoteTasks({action: 'marked', state: 'pending', type: 'Issue'})
        // issues directly addressed.
        // These are mentions in the first line of the description. For some reason, they are not classified as "mentioned" or "assigned"
        //this.getRemoteTasks({action: 'directly_addressed', state: 'pending', type: 'Issue'})
        // All the above are included in this call: pending TODOs
        this.getRemoteTasks({state: 'pending', type: 'Issue', per_page: Config.PROJECTS_PER_PAGE})
        // not TODOs, but issues assinged to me. Some times this issues are not TODOs!
        // TODO: assigned-to-me is deprecated in gitlab>11. Use assigned_to_me instead
        this.getRemoteTasks({scope: 'assigned-to-me', state: 'opened', per_page: Config.PROJECTS_PER_PAGE}, this.gitlab + '/api/v4/issues')
      }
    },

    getRemoteTasks (params, url) {
      if(!this.gitlab || !this.privateToken) return

      // Add TODOs (default) or ISSUES to the list
      // - params for the request. Check https://docs.gitlab.com/ce/api/issues.html or https://docs.gitlab.com/ce/api/todos.html
      // - url for the request. Default: this.gitlab + '/api/v4/todos'. Use also this.gitlab + '/api/v4/issues'

      if(url === undefined) {
        url = this.gitlab + '/api/v4/todos'
      }
      // Get issues as todos. This method does not reset issues or calendarEvents
      // these fields are appended to every issue:
      // - project_namespace
      // - project_name (actually, it is the "project name" part of the URL. You'll only notice differentes if the name has special characters
      // - project_url : the URL to the project
      // - report_hours: time to report next time the user clicks on 'report'
      axios.get(url, {params: params, headers: {'Private-Token': this.privateToken}}).then( response => {
        let mytodos = response.data
        for(let i=0; i<mytodos.length; i++) {
          // TODOs API use target property for issues. ISSUES API includes the issue directly
          let issue = (mytodos[i].hasOwnProperty('target') ? mytodos[i].target : mytodos[i])

          // check if the issue is already in the array, and ignore if it is
          let issueAlreadyProcessed = false
          for(let j=0; j<this.issues.length; j++) {
            if(this.issues[j].id === issue.id) {
              issueAlreadyProcessed = true
            }
          }
          if(issueAlreadyProcessed) {
            continue
          }

          // build assignee names
          issue.assignee_names = issue.assignees.map( a => a.name ).join()

          // get project name
          let url_tokens = issue.web_url.split('/')
          issue.project_name = url_tokens[4]
          issue.project_namespace = url_tokens[3] + '/' + url_tokens[4]
          issue.project_url = this.gitlab + '/' + issue.project_namespace

          // timereported
          issue.report_hours = 0

          // create calendar events
          if(issue.due_date) {
            let event = {
              startDate: issue.due_date,
              title: issue.project_name + ': ' + issue.title + ' (' + issue.time_stats.human_time_estimate + ')',
              classes: 'calendar-task'
            }
            this.calendarEvents.push(event)
          }

          // manage milestones
          if(this.showMilestones && issue.milestone) {
            let milestoneStartDate = issue.milestone.start_date?issue.milestone.start_date:issue.milestone.created_at
            let milestoneEndDate = issue.milestone.due_date
            // if the milestone has an end data and it is not yet processes, add the event
            if (milestoneEndDate && this.processedMilestones.indexOf(issue.milestone.iid) == -1) {
              this.calendarEvents.push({
                startDate: milestoneStartDate,
                endDate: milestoneEndDate,
                title: issue.milestone.title,
                classes: 'calendar-milestone'
              })
              this.processedMilestones.push(issue.milestone.iid)
            }
          }

          this.issues.push(issue)
        }
      }).catch( () => {
        this.showMessage(`Cannot connect to ${this.gitlab}`, 'error')
      })
    },

    onReportHours ({date, morningStartTime, morningEndTime, eveningStartTime, eveningEndTime}) {
      /** report hours */
      let reportBody = ''
      for(let i=0; i<this.issues.length; i++) {
        let issue = this.issues[i]
        let hoursToReport = parseFloat(issue.report_hours)
        let commentToReport = issue.report_comment
        if(!isNaN(hoursToReport) && hoursToReport > 0) {
          // create the report message
          let spendTxt='/spend ' + hoursToReport + 'h ' + date
          let encodedComment = encodeURIComponent(commentToReport)
          reportBody = `${reportBody}\nproject="${issue.project_id}" issue="${issue.iid}" spend="${spendTxt}" comment="${encodedComment}"`
          let explicitelyClosed = false
          if(commentToReport) {
            spendTxt = spendTxt + '\n' + commentToReport
            // if /done or /close is used, set the flag
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
      if(this.emailReportWorkTime) {
        let subject = encodeURIComponent(`${date} ${morningStartTime}-${morningEndTime},${eveningStartTime}-${eveningEndTime}`)
        let body = encodeURIComponent(reportBody)
        if(body) {
          window.open(`mailto:${this.emailReportWorkTime}?subject=${subject}&body=${body}`)
        } else {
          window.open(`mailto:${this.emailReportWorkTime}?subject=${subject}`)
        }
      }
    },

    setCalendarDate(d) {
      // sets the date currently shown on calendar
      this.calendarDate = d;
    },

    configChanged() {
      // the configuration was changed: save new values
      basil.set('private-token', this.privateToken)
      basil.set('gitlab', this.gitlab)
      basil.set('email-report-work-time', this.emailReportWorkTime)
      basil.set('show-milestones', this.showMilestones)
      basil.set('report-hours', this.reportHours)
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
