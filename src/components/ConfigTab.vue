<template>
    <v-card flat>
        <v-card-text>
        <h2>Settings</h2>
        <p>
            These parameters are stored locally in your browser's cache, not in any server.
            You must reload the page after changing any of these parameters.
        </p>
        <v-text-field
            :value="$store.state.gitlab"
            label="URL to the gitlab server"
            hint="If empty, to not get issues and projects"
            @change="$store.commit('gitlab', $event)"
            required
        ></v-text-field>
        <v-text-field
            :value="$store.state.privateToken"
            label="Gitlab private token"
            :hint="`Get the token from ${tokenURL}`"
            required
            @change="$store.commit('privateToken', $event)"
        ></v-text-field>
        <v-switch
            label="Calendar: show milestones"
            :value="$store.state.showMilestones"
            @change="$store.commit('showMilestones', $event)"
        ></v-switch>
        <v-switch
            label="Report hours to gitlab"
            :value="$store.state.reportHours"
            @change="$store.commit('reportHours', $event)"
        ></v-switch>
        <v-text-field
            :value="$store.state.emailReportHours"
            label="Report hours to this email"
            hint="If empty, do not report working hours"
            required
            @change="$store.commit('emailReportHours', $event)"
        ></v-text-field>
        <v-text-field
            :value="$store.state.emailSessionTime"
            label="Report sessions hours to this email"
            hint="If empty, do not report session time"
            required
            @change="$store.commit('emailSessionTime', $event)"
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
        }
    }
}
</script>