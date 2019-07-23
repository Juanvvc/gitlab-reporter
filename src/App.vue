<!-- The main component in the application -->

<template>
  <v-app>
    <v-content>
      <v-container>
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
                Clocking email: <strong>{{ emailSessionTime }}</strong>.
                Reporting email: <strong>{{ emailReportHours }}</strong>.
                Report to GitLab: <strong>{{ reportHours }}</strong>.
              </span>
            </v-layout>
          </v-toolbar-title>
        </v-toolbar>

        <p  class="hidden-sm-and-down">
          Comments can include <a href="https://docs.gitlab.com/ee/user/project/quick_actions.html">quick actions</a>, such as <em>/done</em> or <em>/close</em>. GitLab marks a task as done if a user comments on it. To prevent this, a <em>/todo</em> will be sent automatically after all comments, unless <em>/done</em> or <em>/close</em> is used.
        </p>

        <session-control :current-date="currentDate" />

        <v-tabs
          v-model="activeTab"
          color="primary"
          dark
          icons-and-text
          centered
          @change="tabChanged">

          <v-tab v-if="gitlabConfigured" href="#tab-reporter">Reporter<v-icon>mdi-account-clock</v-icon></v-tab>
          <v-tab v-if="gitlabConfigured" href="#tab-calendar">Calendar<v-icon>calendar_today</v-icon></v-tab>
          <v-tab v-if="gitlabConfigured" href="#tab-project">Project<v-icon>mdi-file-tree</v-icon></v-tab>
          <v-tab href="#tab-config">Settings<v-icon>settings</v-icon></v-tab>
        </v-tabs>

        <v-tabs-items v-model="activeTab" >
          <!-- reporter -->
          <v-tab-item v-if="gitlabConfigured" value="tab-reporter">
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

                <issues-table />

                <report-bar @report-hours="$store.dispatch('gitlab/reportHours', $event)" @change-date="currentDate=$event.date"/>
              </v-card-text>
            </v-card>
          </v-tab-item>

          <!-- calendar -->
          <v-tab-item v-if="gitlabConfigured" value="tab-calendar">
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
          <v-tab-item v-if="gitlabConfigured" value="tab-project">
          <v-card flat>
              <v-card-text>
                <h2>Project information</h2>
                <search-project @change="changeSelectedProject(arguments[0])"/>
                <issues-table />
                <project-gantt :projectId="selectedProjectId" height="800px"/>
              </v-card-text>
            </v-card>
          </v-tab-item>

          <!-- config -->
          <v-tab-item value="tab-config">
            <config-tab />
          </v-tab-item>
        </v-tabs-items>

        <message-bar />
      </v-container>

      <v-footer class="pa-3">
        <v-spacer></v-spacer>
        <div>GitLab reporter v{{ app_version }}. &copy; Juan Vera, {{ new Date().getFullYear() }}</div>
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
import MessageBar from '@/components/MessageBar.vue'
import {CalendarView, CalendarViewHeader} from 'vue-simple-calendar'
import Config from '@/lib/config.js'
import Console from '@/lib/Console.js'
import { mapState, mapGetters } from 'vuex'
require("vue-simple-calendar/static/css/default.css")
require("@mdi/font/css/materialdesignicons.min.css")

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
    MessageBar,
    ConfigTab
  },

  data () {
    return {
      activeTab: null,          // identifier of the currently selected tab
      calendarDate: new Date(), // the current date in the calendar
      currentDate: new Date(),  // the current date in the report and sessions bar (changed in report bar)
      selectedProjectId: undefined // selected project id in the projects view
    }
  },

  computed: {
    app_version() {
      if(process.env.NODE_ENV === 'production') {
        return process.env.VUE_APP_VERSION
      }
      return `${process.env.VUE_APP_VERSION}-${process.env.NODE_ENV}`
    },

    gitlabConfigured() {
      return this.gitlab && this.privateToken
    },

    maxTasks() {
      return Config.PROJECTS_PER_PAGE
    },

    ...mapState('gitlab', ['loggedUser', 'currentUser', 'issues', 'calendarEvents', 'reportHours', 'emailReportHours', 'gitlab', 'users', 'privateToken', 'gitlabURL']),
    ...mapState('sessions', ['emailSessionTime']),
    ...mapGetters('gitlab', ['gitlabURL'])
  },

  mounted () {
    this.$store.dispatch('gitlab/login')
    this.$store.dispatch('gitlab/getUsers')

    if(this.privateToken && this.gitlab) {
      this.activeTab = 'tab-reporter'
    } else {
      this.activeTab = 'tab-config'
    }
  },

  methods: {
    /** Set the date currently shown on calendar */
    setCalendarDate(d) {
      this.calendarDate = d;
    },

    /** Change the current user */
    changeUser(user) {
      this.$store.commit('gitlab/currentUser', user)
      this.$store.dispatch('gitlab/getTasks')
    },

    /** Change the currently selected project.
    * @param {String} projectId - The identifier of the project to be selected.
    */
    changeSelectedProject(projectId) {
      this.selectedProjectId = projectId
      this.$store.dispatch('gitlab/getProjectTasks', {projectId: this.selectedProjectId})
    },

    /** The tab has changed.
    * @param {Strong} newTab - The name of the tab to be shown */
    tabChanged(newTab) {
      if(newTab === 'tab-reporter') {
        this.$store.dispatch('gitlab/getUserTasks')
      } else if(newTab === 'tab-project') {
        this.$store.dispatch('gitlab/getProjectTasks')
      }
    }
  },

}
</script>

<style>
div#app {
  background-color: #eee;
}

/* Utility classes */
.pointable{
    cursor: pointer;
}
.compact-form {
    transform: scale(0.875);
    transform-origin: left;
}

/* Calendar themes */
.theme-default .cv-event.calendar-milestone {
	background-color: #ffe7d0;
	border-color: #f7e0c7;
}
.theme-default .cv-event.calendar-task {
	background-color:#e7e7ff;
	border-color: #e0e0f0;
}
</style>
