<template>
    <!--v-alert
        :type="type"
        dismissible
        v-model="visible"
        transition="fade-transition">
        {{message}}
    </v-alert-->
    <v-snackbar
      :color="type"
      v-model="visible"
      :timeout="timeout"
      top>
      {{ message }}
      <v-btn
        dark
        flat
        @click="visible = false"
      >
        Close
      </v-btn>
    </v-snackbar>
</template>

<script>

/**
* A component to manage messages from the messages vuex module.
*
* @module components/MessageBar
* @vue-data {Boolean} [visible=false] - If true, show the message
* @vue-data {String} message - The message to show
* @vue-data {String} [type=error] - The type of message. Currently, info, error and warning.
* @vue-data {Number} [timeout=6000] - Show the message during during this number of milliseconds.
* @vue-prop {Boolean} [dismissable=true] - If True, the message can be closed by the user.
*/
export default {
  data () {
    return {
      visible: false,
      message: '',
      type: 'error',
      timeout: 6000
    }
  },

  mounted() {
    // After a new message, process it
    this.$store.subscribe((mutation) => {
      if(mutation.type === 'messages/message') {
        this.visible = true
        const messageTypes = ['info', 'warning', 'error']
        for(let e=0; e<messageTypes.length; e++) {
          let newMessage = this.$store.getters['messages/lastMessage'](messageTypes[e])
          if(newMessage) {
            this.type = messageTypes[e]
            this.message = newMessage
          }
        }
        // Clean all messages
        // TODO: support stacked messages
        this.$store.commit('messages/clean')
      }
    }) 
  }
}
</script>