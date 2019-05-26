
import Console from '@/lib/Console'

/** Vuex store module to manage system messages.
* @exports vuex/state:messages
*/
const state = {
  /** The stack of messages */
  messages: {
    error: [],
    info: [],
    debug: [],
    warning: []
  }
}

/** The mutations.
 * @exports vuex/mutations:messages
 */
const mutations = {
  /** Cleans all messages */
  clean(state) {
    state.messages ={
      error: [],
      info: [],
      debug: [],
      warning: []
    }
  },

  /** Register a new message in the stack.
  * @param {String} type - The type of message: error, info, debug or warning. If not provided, "error" is the default type
  * @param {String} message - The message to show
  */
  message(state, {type, message}) {
    if(!type) {
      type = 'error'
    }
    state.messages[type].push(message)
    if(type === 'info' || type === 'debug') {
      Console.log(`INFO: type="${type}" message="${message}"`)
    } else if (type === 'warning') {
      Console.warning(`WARNING: message="${message}"`)
    } else {
      Console.warning(`ERROR: message="${message}"`)
    }
  },

  /** Remove the last message from the queue.
  * @param {String} type - The type of message:  error, info, debug or warning.  If not provided, "error" is the default type
  */
  popMessage(state, {type}) {
    if(!type) {
      type = 'error'
    }
    state.messages[type].pop()
  }
}

/** The getters.
* @exports vuex/getters:messages
*/
const getters = {
  /** @return True if there are messages in the stack. */
  hasMessages(state) {
    return state.messages.error.length + state.messages.warning.length + state.messages.info.length + state.messages.debug.length
  },

  /**
  * Get the last message of a specific type from the stack.
  * @param {String} type - The type of message:  error, info, debug or warning.  If not provided, "error" is the default type
  * @return The string with the message
  */
  lastMessage: (state) => (type) => {
    if(!type) {
      type = 'error'
    }
    if(state.messages[type].length === 0) {
      return null
    }
    return state.messages[type][state.messages[type].length - 1]
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  getters
}
