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
            label="Calendar: show milestones"
            v-model="showMilestones"
        ></v-switch>
        <v-switch
            label="Report hours to gitlab"
            v-model="reportHours"
        ></v-switch>
        <v-text-field
            :value="$store.state.gitlab.emailReportHours"
            label="Report tasks to this email"
            hint="If empty, do not report tasks details to an email"
            required
            @change="$store.commit('gitlab/emailReportHours', $event)"
        ></v-text-field>
        <v-text-field
            :value="$store.state.gitlab.emailSessionTime"
            label="Report sessions hours to this email"
            hint="If empty, do not report session time"
            required
            @change="$store.commit('gitlab/emailSessionTime', $event)"
        ></v-text-field>
        </v-card-text>
    </v-card>
</template>

<script>

import Console from '@/lib/Console.js'

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