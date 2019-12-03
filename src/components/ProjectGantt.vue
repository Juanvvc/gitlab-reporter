<template>
  <div :height="height">
    <svg ref="mygantt"></svg>
  </div>
</template>

<script>

const axios = require('axios')
import {mapState, mapGetters} from 'vuex'
import Console from '@/lib/Console.js'
import Gantt from 'frappe-gantt'
import moment from 'moment'

/** Get a HTML from a task.
 * @param {Object} task - task information, as used by frappe-gantt
 * @returns HTML code to be shown on the frappe-gantt popup
 */
function taskHTML(task) {
  let fromDate = moment(task.start).format('YYYY/MM/DD')
  let toDate = moment(task.end).format('YYYY/MM/DD')
  if(task.web_url) {
    // web_url is define: issues
    return `
    <div class="title">${task.name}</div>
    <div class="subtitle">Dates: ${fromDate} - ${toDate}</div>
    <div>Assignees: ${task.assignee_names}</div>
    <div><a href="${task.web_url}" target="_blank">GITLAB link</a></div>
    `
  } else {
    // no web_url: probably, milestones
    return `
    <div class="title">${task.name}</div>
    <div class="subtitle">Dates: ${fromDate} - ${toDate}</div>
    `
  }
}

/**
* Shows the Gantt diagram about a single project using frappe-gantt.
* We use a modidifed version of the "official" frappe-gantt library that allows switching
* off the editing handlers.
* The Gantt diagram dependes on the gitlab vuex module, but does not use its methods.
* @module components/ProjectGantt
* @vue-prop {String} projectId - The identifier of the project to show.
* @vue-prop {String} [height=800px] - The heigth of the Gantt diagram
* @vue-computed {String} privateToken - store.gitlab.privateToken
* @vue-computed {String} gitlab - store.gitlab.gitlab
*/
export default {
  props: {
    projectId: {
      mandatory: true,
      type: Number
    },
    height: {
      mandatory: false,
      type: String,
      default: () => "800px"
    },
  },

  computed: {
    ...mapState('gitlab', ['privateToken', 'gitlab']),
    ...mapGetters('gitlab', ['gitlabURL'])
  },

  watch: {
    projectId (val) {
      if(val === undefined) return
      this.downloadProjectInfo(val)
    }
  },

  methods: {
    /** Downloads information about a project and its issues.
    * Milestones are first level tasks. Issues assigned to a milestone are second level tasks.
    * Issues NOT assigned to a milestone are ignored.
    * @param projectId - The identifier of the project to download
    */
    async downloadProjectInfo (projectId) {
      // check if gitlab is configured
      if(!this.gitlab || !this.privateToken) {
        // this.$store.commit('messages/message', {type: 'warning', message: 'The gitlab server is not configured'}, {root: true})
        return
      }
      let tasks = []
      // get the project milestones
      let milestones = await this.downloadMilestones(projectId)
      // for each milestone, get the issues in this milestones
      milestones.forEach(async milestone => {
        const newMilestone = {...milestone}
        newMilestone.progress = 0

        const issues = await this.downloadIssues(milestone._id)

        // calculate the milestone issues as the ration of completed issues
        let current_progress = 0
        const num_issues = issues.length
        if(num_issues > 0) {
          issues.forEach(issue => {
            const issue_progress = issue.progress / 100
            current_progress = current_progress + issue_progress
            if(issue.end > newMilestone.end) {
              newMilestone.end = issue.end
            }
          })
          newMilestone.progress = (current_progress / num_issues) * 100
        }

        // push the milestone to the task array (before the issues)
        tasks.push(newMilestone)
        // push all the issues to the task array (just after the milestone)
        issues.map(i => {tasks.push(i)})
      })

      // create the gantt diagram in frappe-gantt and change to week mode
      // NOTE: "official" frappe-gantt does not have an "editable" configuration param
      let gantt = new Gantt(this.$refs['mygantt'], tasks, {
        editable: false,
        custom_popup_html: taskHTML
      })
      gantt.change_view_mode('Week')
    },

    /** Downloads information about the milestones in a project.
    * @param {String} projectId - The project identifier
    * @returns An array mapping milestones as tasks in frappe-gantt.
    */
    async downloadMilestones (projectId) {
      return axios.get(`${this.gitlabURL}/projects/${projectId}/milestones`, {headers: {'Private-Token': this.privateToken}})
        .then(response => {
          return response.data.map( m => {
            // start: if an start_date is defined, use that. If not, use creation date.
            // end: if a due_date is defined, use that. It not, use creation date.
            // id: milestone-{milestone identifier}
            // _id: milestone identifier
            return {
              'start': m.start_date?m.start_date:m.created_at,
              'end': m.due_date?m.due_date:(m.start_date?m.start_date:m.created_at),
              'name': m.title,
              'id': `milestone-${m.id}`,
              '_id': m.id
            }
          })
        })
    },

    /** Downloads information about the issues in a milestone.
    * @param {String} miestoneId - The milestone identifier
    * @returns An array mapping milestones as tasks in frappe-gantt.
    */
    async downloadIssues (milestoneId) {
      return await axios.get(`${this.gitlabURL}/projects/${this.projectId}/milestones/${milestoneId}/issues`, {headers: {'Private-Token': this.privateToken}})
        .then(response => {
          return response.data.map( i => {
            // start: if a due_date is defined, use that. If not, use today
            // end: if a due_date is defined, use that. If not, use today
            // progress: 0 is open, 100 if closed.
            // dependencies: depends on the milestone
            // id: issue-{issue identifier}
            // _id: issue identifier
            // web_url and assignee_names are not used by frappe-gantt, but taskHTML
            return {
              'start': i.due_date?i.due_date:(new Date()).toISOString(),
              'end': i.due_date?i.due_date:(new Date()).toISOString(),
              'name': i.title,
              'progress': i.state === 'closed'?100:0,
              'dependencies': `milestone-${milestoneId}`,
              'id': `issue-${i.id}`,
              'web_url': i.web_url,
              'assignee_names': i.assignees.map( a => a.name ).join(', '),
              '_id': i.id
            }
          })
        })
    }
  }
}
</script>

<style scoped>
.popup-wrapper {
  background: #fff;
}
</style>
