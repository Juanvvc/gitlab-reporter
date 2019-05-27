import 'basil.js'
import moment from 'moment'

const basil = new window.Basil({namespace: 'gitlab-reporter'});

/** A Vuex module that manages session state.
 * @exports vuex/state:sessions
 */
const state = {
  /** Send session information to this email. If undefined or empty, do not send session information */
  emailSessionTime: '',
  /** Today sessions. Objects {date,time,action}, action being "start" or "end" */
  activeSessions: []
}

const mutations = {
  emailSessionTime(state, newValue) {
    state.emailSessionTime = newValue
    basil.set('email-session-time', newValue)
  },

  activeSessions(state, newValue) {
    state.activeSessions = newValue
    basil.set('active-sessions', newValue)
  },

  startSession(state) {
    let now = moment()
    state.activeSessions.push({date: now.format('YYYY-MM-DD'), time: now.format('HH:mm'), action: "start"})
    basil.set('active-sessions', state.activeSessions)
  },

  stopSession(state) {
    let now = moment()
    state.activeSessions.push({date: now.format('YYYY-MM-DD'), time: now.format('HH:mm'), action: "stop"})
    basil.set('active-sessions', state.activeSessions)
  }
}

const actions = {
  /** Start a session rigth now */
  async startSession({commit, state}) {
    let lastSession = state.activeSessions[state.activeSessions.length - 1]
    if( lastSession !== undefined && lastSession.action === 'start') {
      commit('messages/message', {type: 'error', message: 'Starting an already started session'}, {root: true})
      return
    }
    let subject = encodeURIComponent(moment().format('YYYY-MM-DD HH:mm-?'))
    if(!state.emailSessionTime) {
      commit('messages/message', {type: 'warning', message: 'Session emails is not set'}, {root: true})
    } else {
      window.open(`mailto:${state.emailSessionTime}?subject=${subject}`)
    }
    commit('startSession')
  },

  /** Stop a session right now. */
  async stopSession({commit, state}) {
    let lastSession = state.activeSessions[state.activeSessions.length - 1]
    if( lastSession !== undefined && lastSession.action === 'stop') {
      commit('messages/message', {type: 'error', message: 'Closing an already closed session'}, {root: true})
      return
    }
    let subject = encodeURIComponent(moment().format('YYYY-MM-DD ?-HH:mm'))
    if(!state.emailSessionTime) {
      commit('messages/message', {type: 'warning', message: 'Session emails is not set'}, {root: true})
    } else {
      window.open(`mailto:${state.emailSessionTime}?subject=${subject}`)
    }
    commit('stopSession')
  },

  /** Register sessions using a string.
   * 
   * @param {string} sessions - A string with start and end times of different sessions.
   *   For example: "09:00-13:00,14:00-18:00", "09:00-13:00,14:00-?", "09:00-13:00,14:00" (in this case, the last sessions is still open)
   */
  async customSessions({commit, state}, {sessions}) {

    if(sessions !== '') {
      let now = moment().format('YYYY-MM-DD')
      let subject = encodeURIComponent(`${now} ${sessions}*`)
      if(!state.emailSessionTime) {
        commit('messages/message', {type: 'warning', message: 'Session emails is not set'}, {root: true})
      } else {
        window.open(`mailto:${state.emailSessionTime}?subject=${subject}`)
      }

      // save sessions in memory
      let sessionsInfo = sessions.split(',')
      let sessionsArray = []
      for(let s=0; s<sessionsInfo.length; s++) {
        let sessionInfo = sessionsInfo[s].split('-')
        sessionsArray.push({date: now, time: sessionInfo[0], action: "start"})
        if(sessionInfo[1] !== undefined && sessionInfo[1] !== '?') {
          sessionsArray.push({date: now, time: sessionInfo[1], action: "stop"})
        }
      }
      commit('activeSessions', sessionsArray)
    } else {
      // sessions are empty
      commit('activeSessions', [])
    }
  },

  /** A global action to load state from basil */
  loadState: {
    root: true,
    handler({commit}) {
      commit('emailSessionTime', basil.get('email-session-time'))
      let activeSessions = basil.get('active-sessions')

      // check if the active sessions are for today
      if(!activeSessions || activeSessions.length === 0) {
        activeSessions = []
      } else {
        let firstSession = activeSessions[0]
        if(!moment().isSame(firstSession.date, 'day')) {
          // not today: remove sessions
          activeSessions = []
          // alert the user
          commit('messages/message', {type: 'info', message: 'Old sessions cleaned out'}, {root: true})
        }
      }

      commit('activeSessions', activeSessions)
      //commit('activeSessions', [])

    }
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}