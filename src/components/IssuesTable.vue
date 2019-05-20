<!--

Shows a table with information about issues

-->

<template>
  <div>
    <v-data-table
      :items="issues"
      :headers="headers"
      :must-sort="true"
      :loading="loading"
      hide-actions
    >
      <template slot="items" slot-scope="props">
        <tr>
          <td><a :href="props.item.project_url" target="_blank">{{ props.item.project_name }}</a></td>
          <td><a :href="props.item.web_url" target="_blank">{{ props.item.title }}</a></td>
          <td class="hidden-sm-and-down">{{ props.item.due_date }}</td>
          <td class="hidden-sm-and-down">{{ props.item.assignee_names }}</td>
          <td class="hidden-sm-and-down">{{ props.item.time_stats.human_time_estimate }}</td>
          <td class="hidden-sm-and-down">{{ props.item.time_stats.human_total_time_spent }}</td>
          <td>
            <v-layout row align-center>
              <v-tooltip bottom>
                <v-btn slot="activator" icon @click="editReport(props.item)">
                  <v-icon>mdi-progress-clock</v-icon>
                </v-btn>
                <span>Show a dialog to report tasks</span>
              </v-tooltip>
              <span>{{props.item.report_hours}}h</span>
            </v-layout>
          </td>
        </tr>
      </template>
    </v-data-table>

    <edit-data-dialog ref="editDataDialog" />
  </div>
</template>

<script>

import EditDataDialog from './EditDataDialog.vue'
import { mapState } from 'vuex'
import Console from '@/lib/Console.js'


export default {
  components: {
    EditDataDialog
  },

  data () {
    return {
      headers: [
          { text: 'Project', value: 'project_name', sortable: true },
          { text: 'Title', value: 'title', sortable: true},
          { text: 'Due date', value: 'due_date', sortable: true, class: 'hidden-sm-and-down'},
          { text: 'Assignees', value: 'assignees', sortable: false, class: 'hidden-sm-and-down' },
          { text: 'Estimated', value: 'estimated', sortable: false, class: 'hidden-sm-and-down' },
          { text: 'Spent', value: 'spent', sortable: false, class: 'hidden-sm-and-down' },
          { text: 'Today', value: 'report', sortable: false }
      ],
      selectedIssue: null,
    }
  },

  computed: {
    ...mapState(['loading', 'issues'])
  },

  methods: {
    async editReport (issue) {
      // guess the index of the issue to change in the issues array
      let issueIndex
      for(issueIndex=0; issueIndex<this.issues.length; issueIndex++) {
        if(this.issues[issueIndex].iid == issue.iid) {
          break
        }
      }

      let params = {
        title: `Report to "${issue.project_name} - ${issue.title}"`,
        fields: [
          {label: 'Hours to report', name: 'report_hours', value: issue.report_hours, type: 'textfield', hint: 'Hours using a float number'},
          {label: 'Optional comment', name: 'report_comment', value: issue.report_comment, type: 'textarea', hint: 'Comments can include quick actions, such as /done or /close'},
        ]
      }

      let newMetadata = await this.$refs.editDataDialog.edit(params)
      if(newMetadata) {
        this.$store.commit('editIssue', {issueIndex, newMetadata})
      }
    }
  }
}
</script>
