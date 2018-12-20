<!--

Shows a table with information about issues

-->

<template>
  <div>
    <v-data-table
      :items="issues"
      :headers="headers"
      :must-sort="true"
      hide-actions
    >
      <template slot="items" slot-scope="props">
        <tr>
          <td><a :href="props.item.project_url" target="_blank">{{ props.item.project_name }}</a></td>
          <td><a :href="props.item.web_url" target="_blank">{{ props.item.title }}</a></td>
          <td>{{ props.item.due_date }}</td>
          <td>{{ props.item.assignee_names }}</td>
          <td>{{ props.item.time_stats.human_time_estimate }}</td>
          <td>{{ props.item.time_stats.human_total_time_spent }}</td>
          <td>
            <v-layout row align-center>
              <v-tooltip bottom>
                <v-btn slot="activator" icon @click="editReport(props.item)">
                  <v-icon>timer</v-icon>
                </v-btn>
                <span>Show a dialog to report tasks</span>
              </v-tooltip>
              <span>{{props.item.report_hours}}h</span>
            </v-layout>
          </td>
        </tr>
      </template>
    </v-data-table>

    <v-dialog v-if="showReportDialog" v-model="showReportDialog" max-width="600px" persistent>
      <v-card>
        <v-card-title><span class="headline">Report to "{{selectedIssue.project_name}} - {{selectedIssue.title}}"</span></v-card-title>
        <v-card-text>
          <v-text-field label="Hours to report" hint="Use only float numbers" v-model="selectedIssue.report_hours" autofocus></v-text-field>
          <v-textarea label="Optional comment" hint="Comments can include quick actions, such as /done or /close" v-model="selectedIssue.report_comment"></v-textarea>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn color="primary" flat @click.native="showReportDialog=false">OK</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
export default {
  props: {
    issues: {    // issues, as returned by gitlab (see getIssues for some extra fields)
      required: true,
      type: Array
    }
  },

  data () {
    return {
      headers: [
          { text: 'Project', value: 'project_name', sortable: true },
          { text: 'Title', value: 'title', sortable: true},
          { text: 'Due date', value: 'due_date', sortable: true},
          { text: 'Assignees', value: 'assignees', sortable: false },
          { text: 'Estimated', value: 'estimated', sortable: false },
          { text: 'Spent', value: 'spent', sortable: false },
          { text: 'Today', value: 'report', sortable: false }
      ],
      selectedIssue: null,
      showReportDialog: false
    }
  },

  methods: {
    editReport (issue) {
      this.selectedIssue = issue;
      this.showReportDialog = true;
    }
  }
}
</script>
