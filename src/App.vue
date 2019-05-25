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

          <v-tab v-if="privateToken && gitlab" href="#tab-reporter">Reporter<v-icon>mdi-account-clock</v-icon></v-tab>
          <v-tab v-if="privateToken && gitlab" href="#tab-calendar">Calendar<v-icon>calendar_today</v-icon></v-tab>
          <!--v-tab v-if="privateToken && gitlab" href="#tab-gantt">Gantt<v-icon>mdi-file-tree</v-icon></v-tab-->
          <v-tab href="#tab-config">Settings<v-icon>settings</v-icon></v-tab>
        </v-tabs>

        <v-tabs-items v-model="activeTab" >
          <!-- reporter -->
          <v-tab-item v-if="privateToken && gitlab" value="tab-reporter">
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

                <report-bar @report-hours="$store.dispatch('gitlab/reportHours', $event)" />
              </v-card-text>
            </v-card>
          </v-tab-item>

          <!-- calendar -->
          <v-tab-item v-if="privateToken && gitlab" value="tab-calendar">
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
          <!--v-tab-item v-if="privateToken && gitlab" value="tab-gantt">
            <v-card flat height="800px">
              <h2>Gantt</h2>
              <search-project :url="gitlabURL + '/projects'" @change="selectedProjectId = arguments[0]"/>
              <project-gantt :projectId="selectedProjectId" :url="gitlabURL + '/projects'" />
            </v-card>
          </v-tab-item-->

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
import { mapState } from 'vuex'
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

    gitlabURL() {
      return `${this.gitlab}/api/v4`
    },

    maxTasks() {
      return Config.PROJECTS_PER_PAGE
    },

    ...mapState('gitlab', ['loggedUser', 'currentUser', 'issues', 'calendarEvents', 'reportHours', 'emailReportHours', 'gitlab', 'users', 'privateToken'])
  },

  mounted () {
    this.$store.dispatch('gitlab/login')
    this.$store.dispatch('gitlab/getUsers')
    this.$store.dispatch('gitlab/getTasks')

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
      this.$store.commit('currentUser', user)
      this.$store.dispatch('gitlab/getTasks')
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
