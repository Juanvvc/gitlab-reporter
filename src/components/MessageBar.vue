<template>
    <div>
    <v-alert
        :type="msgError.type"
        dismissible
        v-model="msgError.visible"
        transition="fade-transition">
        {{msgError.message}}
    </v-alert>
    </div>
</template>

<script>

/**
* A component to manage messages from the messages vuex module.
*
* @module components/MessageBar
*/
export default {
  data () {
    return {
      msgError: {
        visible: false,
        message: '',
        type: 'error'
      }
    }
  },

  mounted() {
    // After a new message, process it
    this.$store.subscribe((mutation) => {
      if(mutation.type === 'messages/message') {
        this.msgError.visible = true
        const messageTypes = ['info', 'warning', 'error']
        for(let e=0; e<messageTypes.length; e++) {
          let newMessage = this.$store.getters['messages/lastMessage'](messageTypes[e])
          if(newMessage) {
            this.msgError.type = messageTypes[e]
            this.msgError.message = newMessage
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