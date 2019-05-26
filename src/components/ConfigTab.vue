<template>
  <v-card flat>
    <v-card-text>
      <h2>Settings</h2>
      <p>
        These parameters are stored locally in your browser's cache, not in any server.
        You must reload the page after changing any of these parameters.
      </p>
      <v-text-field
        :value="$store.state.gitlab.gitlab"
        label="URL to the gitlab server"
        hint="If empty, to not get issues and projects"
        @change="$store.commit('gitlab/gitlab', $event)"
        required
      ></v-text-field>
      <v-text-field
        :value="$store.state.gitlab.privateToken"
        label="Gitlab private token"
        :hint="`Get the token from ${tokenURL}`"
        required
        @change="$store.commit('gitlab/privateToken', $event)"
      ></v-text-field>
      <v-switch
        v-if="$store.state.gitlab.privateToken && $store.state.gitlab.gitlab"
        label="Calendar: show milestones"
        v-model="showMilestones"
      ></v-switch>
      <v-switch
        v-if="$store.state.gitlab.privateToken && $store.state.gitlab.gitlab"
        label="Report hours to gitlab"
        v-model="reportHours"
      ></v-switch>
      <v-text-field
        v-if="$store.state.gitlab.privateToken && $store.state.gitlab.gitlab"
        :value="$store.state.gitlab.emailReportHours"
        label="Report tasks to this email"
        hint="If empty, do not report tasks details to an email"
        required
        @change="$store.commit('gitlab/emailReportHours', $event)"
      ></v-text-field>
      <v-text-field
        :value="$store.state.sessions.emailSessionTime"
        label="Report sessions hours to this email"
        hint="If empty, do not report session time"
        required
        @change="$store.commit('sessions/emailSessionTime', $event)"
      ></v-text-field>
    </v-card-text>
  </v-card>
</template>

<script>

/**
* Manages the configuration tab.
* @module components/ConfigTab
* @vue-computed {Boolean} reportHours - If true, report tasks to the configured gitlab server.
* @vue-computed {Boolean} showMilestones - If true, show milestones on the calendar.
*/
export default {
  computed: {
    tokenURL() {
      return `${this.gitlab}/profile/personal_access_tokens`
    },

    // for some reason, the v-switch seems to work differently than the v-textfield
    // and I cannot use the same mechanism to set and update these two true/false properties
    reportHours: {
      get () { return this.$store.state.gitlab.reportHours },
      set (v) { this.$store.commit('gitlab/reportHours', v) }
    },
    showMilestones: {
      get () { return this.$store.state.gitlab.showMilestones },
      set (v) { this.$store.commit('gitlab/showMilestones', v) }
    }
  }
}
</script>
