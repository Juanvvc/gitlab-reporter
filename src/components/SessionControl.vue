<template>
    <!--v-card>
        <v-card-title primary-title><span class="headline">Session management</span></v-card-title>
        <v-card-text>
            <v-container fluid grid-list-lg >
                <v-layout column align-center>
                    <v-layout row>
                        <v-btn color="green" class="white--text" @click="startSession"><v-icon>mdi-clock-in</v-icon> Start session</v-btn>
                        <v-btn color="red" class="white--text" @click="stopSession"><v-icon>mdi-clock-out</v-icon> End session</v-btn>
                    </v-layout>
                    <v-flex>{{ sessionText }} </v-flex>
                </v-layout>
            </v-container>
        </v-card-text>
    </v-card-->
    <v-container fluid>
        <v-layout row align-center justify-start>
            <v-flex xs1>Sessions:</v-flex>
            <v-btn color="green" class="white--text" @click="startSession"><v-icon>mdi-clock-in</v-icon> Start session</v-btn>
            <v-btn color="red" class="white--text" @click="stopSession"><v-icon>mdi-clock-out</v-icon> End session</v-btn>
            <v-flex>{{ sessionText }}</v-flex>
        </v-layout>
    </v-container>
</template>

<script>

import Console from '@/lib/Console.js'

export default {
    computed: {
        sessionText() {
            return 'No session detected on this computer'
        }
    },

    methods: {
        startSession() {
            Console.log('Starting session')
        },

        stopSession() {
            Console.log('Stop session')
        }
    }
}
</script>