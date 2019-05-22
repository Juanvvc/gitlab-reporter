<template>
    <v-container fluid>
        <v-layout row align-center justify-start>
            <v-flex xs1>Sessions:</v-flex>
            <v-btn color="green" class="white--text" @click="$store.dispatch('sessions/startSession')"><v-icon>mdi-clock-in</v-icon> Start session</v-btn>
            <v-btn color="red" class="white--text" @click="$store.dispatch('sessions/stopSession')"><v-icon>mdi-clock-out</v-icon> End session</v-btn>
            <v-flex>
                {{ sessionText }}
            </v-flex>
        </v-layout>
    </v-container>
</template>

<script>

/**
* A container to control sessions.
*/

import moment from 'moment'
import Console from '@/lib/Console.js'

export default {
    computed: {
        sessionText() {
            if(this.$store.state.sessions.activeSessions.length == 0) {
                return 'No sessions detected on this computer'
            } else {
                let duration = Number(this.$store.getters['sessions/todaySessions'].duration).toFixed(2)
                return `Sessions: ${this.$store.getters['sessions/todaySessions'].sessions }. Total ${duration} hours.`
            }
        }
    }
}
</script>