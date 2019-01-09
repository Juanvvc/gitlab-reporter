<template>
  <svg ref="mygantt"></svg>
</template>

<script>

const axios = require('axios')
import Gantt from 'frappe-gantt'

export default {
  props: {
    projectId: {
      mandatory: true,
      type: Number
    },
    url: {
      mandatory: true,
      type: String
    },
    token: {
      mandatory: true,
      type: String
    },
  },

  data () {
    return {
      gantt: undefined
    }
  },

  watch: {
    projectId (val) {
      if(val === undefined) return
      this.downloadProjectInfo(val)
    }
  },

  methods: {
    async downloadProjectInfo (projectId) {
      let tasks = []
      let milestones = await this.downloadMilestones(projectId)
      console.log(JSON.stringify(milestones))
      for(let i = 0; i<milestones.length; i++) {
        let issues = await this.downloadIssues(milestones[i]._id)
        let current_progress = 0
        let available_progress = issues.length
        if(available_progress > 0) {
          issues.forEach(issue => {
            current_progress = current_progress + (issue.progress / 100)
            if(issue.end > milestones[i].end) {
              milestones[i].end = issue.end
            }
          })
          milestones[i].progress = (current_progress / available_progress) * 100
        } else {
          milestones[i].progress = 0
        }
        tasks.push(milestones[i])
        issues.map(i => {tasks.push(i)})
      }
      let gantt = new Gantt(this.$refs['mygantt'], tasks)
      gantt.change_view_mode('Week')
    },

    async downloadMilestones (projectId) {
      return axios.get(`${this.url}/${this.projectId}/milestones`, {headers: {'Private-Token': this.token}})
        .then(response => {
          return response.data.map( m => {
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

    async downloadIssues (milestoneId) {
      return await axios.get(`${this.url}/${this.projectId}/milestones/${milestoneId}/issues`, {headers: {'Private-Token': this.token}})
        .then(response => {
          return response.data.map( i => {
            return {
              'start': i.due_date?i.due_date:(new Date()).toISOString(),
              'end': i.due_date?i.due_date:(new Date()).toISOString(),
              'name': i.title,
              'progress': i.state === 'closed'?100:0,
              'dependencies': `milestone-${milestoneId}`,
              'id': `issue-${i.id}`,
              '_id': i.id
            }
          })
        })
    }
  }
}
</script>
