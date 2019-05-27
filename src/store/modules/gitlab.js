import axios from 'axios'
import 'basil.js'
import Config from '@/lib/config.js'

var basil = new window.Basil({namespace: 'gitlab-reporter'});

/** A Vuex module to manage the state related to a gitlab server.
 * @exports vuex/state:gitlab
 */
const state = {
  loading: false,
  emailReportHours: '',
  todos: [],
  users: [],
  issues: [],
  calendarEvents: [],
  loggedUser: {name: 'NOT_LOGGED'},
  currentUser: {name: 'NOT_LOGGED'},
  privateToken: null,
  gitlab: null,
  milestones: [],
  reportHours: true,
  showMilestones: true
}

/** The getters.
 * @exports vues/getters:gitlab
 */
const getters = {
  gitlabURL: state => `${state.gitlab}/api/v4`
}

/** The mutations.
 * @exports vuex/mutations:gitlab
 */
const mutations = {
  loggedUser(state, newValue) {
    state.loggedUser = newValue
    state.currentUser = newValue
  },

  currentUser(state, newValue) {
    state.currentUser = newValue
  },

  privateToken(state, newValue) {
    state.privateToken = newValue
    basil.set('privateToken', newValue)
  },

  gitlab(state, newValue) {
    state.gitlab = newValue
    basil.set('gitlab', newValue)
  },

  users(state, newValue) {
    state.users = newValue
  },

  emailReportHours(state, newValue) {
    state.emailReportHours = newValue
    basil.set('email-report-hours', newValue)
  },

  issues(state, newValue) {
    state.issues = newValue
  },

  editIssue(state, {issueIndex, newMetadata}) {
    state.issues.splice(issueIndex, 1, Object.assign({}, state.issues[issueIndex], newMetadata))
  },

  calendarEvents(state, {calendarEvents, milestones}) {
    state.calendarEvents = calendarEvents
    state.milestones = milestones
  },

  loading(state, newValue) {
    state.loading = newValue
  },

  showMilestones(state, newValue) {
    let v = (newValue === 'true' || newValue === true)
    state.showMilestones = v
    basil.set('show-milestones', v)
  },

  reportHours(state, newValue) {
    let v = (newValue === 'true' || newValue === true)
    state.reportHours = v
    basil.set('report-hours', v)
  }
}

async function getRemoteTasks ({gitlab, privateToken, params, url, commit}) {
  // Add TODOs (default) or ISSUES to the list
  // - params for the request. Check https://docs.gitlab.com/ce/api/issues.html or https://docs.gitlab.com/ce/api/todos.html
  // - url for the request. Default: gitlabURL/todos'. Use also gitlabURL/issues'

  if(!gitlab || !privateToken) return []
  if(url === undefined) {
    url = `${state.gitlab}/api/v4/todos`
  }
  // Get issues as todos. This method does not reset issues or calendarEvents
  // these fields are appended to every issue:
  // - project_namespace
  // - project_name (actually, it is the "project name" part of the URL. You'll only notice differentes if the name has special characters
  // - project_url : the URL to the project
  // - report_hours: time to report next time the user clicks on 'report'
  let mytodos = []
  let issues = []
  try {
    mytodos = await axios.get(url, {params: params, headers: {'Private-Token': privateToken}})
  } catch(msg) {
    commit('messages/message', {type: 'error', message: msg}, {root: true})
    return []
  }

  if(mytodos) {
    for(let i=0; i<mytodos.data.length; i++) {
      // TODOs API use target property for issues. ISSUES API includes the issue directly
      let issue = (mytodos.data[i].hasOwnProperty('target') ? mytodos.data[i].target : mytodos.data[i])

      // build assignee names
      issue.assignee_names = issue.assignees.map( a => a.name ).join()

      // get project name
      let url_tokens = issue.web_url.split('/')
      issue.project_name = url_tokens[4]
      issue.project_namespace = `${url_tokens[3]}/${url_tokens[4]}`
      issue.project_url = `${gitlab}/${issue.project_namespace}`

      // timereported
      issue.report_hours = 0

      issues.push(issue)
    }
  }
  return issues
}

function createCalendarEvents(issues) {
  // Create calendar events from an issue array
  let calendarEvents = []
  let milestones = []
  for(let i=0; i<issues.length; i++) {
    let issue = issues[i]
    // create calendar events
    if(issue.due_date) {
      let event = {
        startDate: issue.due_date,
        title: issue.project_name + ': ' + issue.title + ' (' + issue.time_stats.human_time_estimate + ')',
        classes: 'calendar-task'
      }
      calendarEvents.push(event)
    }

    // manage milestones
    if(state.showMilestones && issue.milestone) {
      let milestoneStartDate = issue.milestone.start_date?issue.milestone.start_date:issue.milestone.created_at
      let milestoneEndDate = issue.milestone.due_date
      // if the milestone has an end data and it is not yet processes, add the event
      if (milestoneEndDate && milestones.indexOf(issue.milestone.iid) == -1) {
        calendarEvents.push({
          startDate: milestoneStartDate,
          endDate: milestoneEndDate,
          title: issue.milestone.title,
          classes: 'calendar-milestone'
        })
        milestones.push(issue.milestone.iid)
      }
    }
  }

  return {calendarEvents, milestones}
}

function addIssues(issues, newIssues) {
  // Add newIssues to the issues array, only if they are not already there
  if(!newIssues) return
  let newIssue = false
  for(let i=0; i<newIssues.length; i++) {
    newIssue = true
    for(let j=0; j<issues.length; j++) {
      if(issues[j].id === newIssues[i].id) {
        newIssue = false
        break
      }
    }
    if(newIssue) {
      issues.push(newIssues[i])
    }
  }
}

/** The actions.
 * @exports vuex/actions:gitlab
 */
const actions = {
  /** Get the currently logged user */
  async login ({commit, state, getters}) {
    if(!state.gitlab) {
      commit('messages/message', {type: 'warning', message: 'A gitlab server is not defined'}, {root: true})
      return
    }
    if(!state.privateToken) {
      commit('messages/message', {type: 'error', message: 'No token provided'}, {root: true})
      return
    }
    let url = `${getters.gitlabURL}/user`
    try {
      let response = await axios.get(url, {headers: {'Private-Token': state.privateToken}})
      commit('loggedUser', response.data)
    } catch(msg) {
      commit('messages/message', {type: 'error', message: msg}, {root: true})
    }
  },

  /** Get available users. This action only works if we have an administrative token. */
  async getUsers ({commit, state, getters}) {
    if(!state.gitlab) {
      commit('messages/message', {type: 'warning', message: 'A gitlab server is not defined'}, {root: true})
      return
    }
    if(!state.privateToken || !state.loggedUser) {
      commit('messages/message', {type: 'error', message: 'No token provided'}, {root: true})
      return
    }
    try {
      let response = await axios.get(`${getters.gitlabURL}/users`, {params: {'active': 'true'}, headers: {'Private-Token': state.privateToken}})
      commit('users', response.data)
    } catch(msg) {
      commit('messages/message', {type: 'error', message: msg}, {root: true})
    }
  },
  
  /** Get issues and TODOs. This method resets arrays issues, calendarEvents and processedMilestones. */
  async getTasks ({commit, state, getters}) {
    if(!state.gitlab) {
      commit('messages/message', {type: 'warning', message: 'A gitlab server is not defined'}, {root: true})
      return
    }
    if(!state.privateToken || !state.loggedUser) {
      commit('messages/message', {type: 'error', message: 'No token provided'}, {root: true})
      return
    }
    let issues = []
    let calendar = {}

    commit('loading', true)

    if (state.loggedUser.is_admin) {
      // if the logged user is an admin, get issues for the current user with sudo parameter
      let newTodos = await getRemoteTasks({
        gitlab: state.gitlab,
        privateToken: state.privateToken,
        params: {state: 'pending', type: 'Issue', sudo: state.currentUser.username, per_page: Config.PROJECTS_PER_PAGE}
      })
      addIssues(issues, newTodos)

      calendar = createCalendarEvents(issues)
    } else {
      // if the logged user is not an admin, just get the default issues (i.e., his/her issues)
      // assigned to me
      //getRemoteTasks({action: 'assigned', state: 'pending', type: 'Issue'})
      // mentions
      //getRemoteTasks({action: 'mentioned', state: 'pending', type: 'Issue'})
      // TODOs created by me.
      // For some reason, if the todo was set as DONE but marked again, it won't appear with the other filters
      //getRemoteTasks({action: 'marked', state: 'pending', type: 'Issue'})
      // issues directly addressed.
      // These are mentions in the first line of the description. For some reason, they are not classified as "mentioned" or "assigned"
      //getRemoteTasks({action: 'directly_addressed', state: 'pending', type: 'Issue'})
      // All the above are included in this call: pending TODOs
      let newTodos = await getRemoteTasks({
        gitlab: state.gitlab,
        privateToken: state.privateToken,
        params: {state: 'pending', type: 'Issue', per_page: Config.PROJECTS_PER_PAGE},
        commit
      })
      addIssues(issues, newTodos)
      // not TODOs, but issues assinged to me. Sometimes these issues are not TODOs!
      newTodos = await getRemoteTasks({
        gitlab: state.gitlab,
        privateToken: state.privateToken,
        params: {scope: Config.ASSIGNED_TO_ME, state: 'opened', per_page: Config.PROJECTS_PER_PAGE},
        url: `${getters.gitlabURL}/issues`,
        commit
      })
      addIssues(issues, newTodos)


      calendar = createCalendarEvents(issues)
    }
    commit('issues', issues)
    commit('calendarEvents', calendar)
    commit('loading', false)
  },

  /** Report hours */
  async reportHours ({commit, state, getters}, {date}) {
    let reportBody = []
    for(let i=0; i<state.issues.length; i++) {
      let issue = state.issues[i]
      let hoursToReport = parseFloat(issue.report_hours)
      let commentToReport = issue.report_comment
      if(!isNaN(hoursToReport) && hoursToReport > 0) {
        // create the report message
        let spendTxt='/spend ' + hoursToReport + 'h ' + date
        // this will the appended to the mail body
        reportBody.push(
          {
            project_id: issue.project_id,
            project_name: issue.project_name,
            iid: issue.iid,
            title: issue.title,
            spendTxt: spendTxt,
            comment: commentToReport
          }
        )
        // Append the comment fo the reporting text, if any
        let explicitelyClosed = false
        if(commentToReport) {
          spendTxt = spendTxt + '\n' + commentToReport
          // if /done or /close is used, set the explicitelyClose flag
          explicitelyClosed = (commentToReport.indexOf("/done") + commentToReport.indexOf("/close") !== -2)
        }          

        // report hours to gitlab, if active
        if(state.reportHours) {
          let reportURL = getters.gitlabURL + issue.project_id + '/issues/' + issue.iid + '/notes'
          try {
            await axios.post(reportURL, {body: spendTxt}, {headers: {'Private-Token': state.privateToken}})
          } catch {
            // comments that only report hours, i.e. without a commentToReport, are not real comments and they return HTTP 400.
          }
            
          // Now: for some reason, GitLab marks a TODO as done if the user comments on an issue. We don't want it.
          // Unless the user explicitely used /done or /close, send a /todo to the issue.
          if(!explicitelyClosed) {
            try {
              await axios.post(reportURL, {body: "/todo"}, {headers: {'Private-Token': state.privateToken}})
            } catch {
              // ignore any error
            }
          }
        }
      }

      commit('editIssue', {issueIndex: i, newMetadata: {report_hours: 0, report_comment: ''}})
    }

    if(!state.reportHours) {
      commit('messages/message', {type: 'warning', message: 'Not reporting hours to gitlab'}, {root: true})
    }

    /** report to an email */
    if(state.emailReportHours) {
      let subject = encodeURIComponent(`${date} hours to report`)
      let body = encodeURIComponent(JSON.stringify(reportBody, null, 4))
      if(body) {
        window.open(`mailto:${state.emailReportHours}?subject=${subject}&body=${body}`)
      } else {
        window.open(`mailto:${state.emailReportHours}?subject=${subject}`)
      }
    }
  },

  /** A global action to load state from basil */
  loadState: {
    root: true,
    handler({commit}) {
      commit('gitlab', basil.get('gitlab'))
      commit('privateToken', basil.get('privateToken'))
      commit('emailReportHours', basil.get('email-report-hours'))
      commit('reportHours', basil.get('report-hours'))
      commit('showMilestones', basil.get('show-milestones'))
    }
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
