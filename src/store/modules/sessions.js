import 'basil.js'
import Console from '@/lib/Console.js'
import moment from 'moment'

const basil = new window.Basil({namespace: 'gitlab-reporter'});

const state = {
  emailSessionTime: '',
  activeSessions: []
}

const getters = {
  /** @returns An object. durarion is the total hours of today's sessions. sessions is a readable text describing today's sessions */
  todaySessions(state) {
    let currentSession = {start: '?', end: '?'}
    let duration = 0
    let sessions = []
    for(let i=0; i<state.activeSessions.length; i++) {
      let s = state.activeSessions[i]
      if(s.action === 'start') {
        currentSession.start = s.time
      } else {
        currentSession.end = s.time
        if(currentSession.start !== '?') {
          // we calculate difference in minutes because if we set hours, we only get full hours
          duration += moment(currentSession.end, ['H:m']).diff(moment(currentSession.start, ['H:m']), 'minutes')
        }
        sessions.push(`${currentSession.start}-${currentSession.end}`)
        currentSession = {start: '?', end: '?'}
      }
    }
    if(currentSession.start !== '?') {
      sessions.push(`${currentSession.start}-?`)
    }
    return {duration: duration / 60, sessions: sessions.join(', ')}
  }
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
  async startSession({commit, state}) {
    if(!state.emailSessionTime) {
      Console.warning('Session emails is not set')
      return
    }
    let subject = encodeURIComponent(moment().format('YYYY-MM-DD HH:mm-?'))
    window.open(`mailto:${state.emailSessionTime}?subject=${subject}`)
    commit('startSession')
  },

  async stopSession({commit, state}) {
    if(!state.emailSessionTime) {
      Console.warning('Session emails is not set')
      return
    }
    let subject = encodeURIComponent(moment().format('YYYY-MM-DD ?-HH:mm'))
    window.open(`mailto:${state.emailSessionTime}?subject=${subject}`)
    commit('stopSession')
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
          activeSessions = []
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
  getters,
  mutations,
  actions
}