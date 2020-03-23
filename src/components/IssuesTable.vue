<template>
  <div>
    <v-data-table
      :items="issues"
      :headers="headers"
      :must-sort="true"
      :loading="loading"
      hide-default-footer
      disable-pagination
      dense
    >
      <template v-slot:body="{ items }">
        <tbody>
          <tr v-for="(item, index) in items" :key="item.name">
            <td><a :href="item.project_url" target="_blank">{{ item.project_name }}</a></td>
            <td><a :href="item.web_url" target="_blank">{{ item.title }}</a></td>
            <td class="hidden-sm-and-down"><status-tag :issue="item" /></td>
            <td class="hidden-sm-and-down">
              <!--ncd-label v-for="label in item.labels" :key="label" :label="label" /-->
              <tag-editor :data-index="index" :tags="item.labels" @update-tags="updateTags" />
            </td>
            <td class="hidden-sm-and-down">{{ item.due_date }}</td>
            <td class="hidden-sm-and-down">{{ item.assignee_names }}</td>
            <td class="hidden-sm-and-down">{{ item.time_stats.human_time_estimate }}</td>
            <td class="hidden-sm-and-down">{{ item.time_stats.human_total_time_spent }}</td>
            <td>
              <v-row  align="center">
                <v-tooltip bottom>
                  <template v-slot:activator="{ on }">
                    <v-btn small text v-on="on" icon @click="editReport(item)">
                      <v-icon>mdi-progress-clock</v-icon>
                    </v-btn>
                  </template>
                  <span>Show a dialog to report tasks</span>
                </v-tooltip>
                <span>{{item.report_hours}}h</span>
              </v-row>
            </td>
          </tr>
        </tbody>
      </template>
    </v-data-table>

    <edit-data-dialog ref="editDataDialog" />
  </div>
</template>

<script>

/**
* Shows a table with information about issues
*/

import EditDataDialog from '@/components/EditDataDialog.vue';
import StatusTag from '@/components/StatusTag.vue';
import TagEditor from '@/components/TagEditor.vue';
import { mapState } from 'vuex';
import Console from '@/lib/Console.js';


export default {
  components: {
    EditDataDialog,
    StatusTag,
    TagEditor
  },

  data () {
    return {
      headers: [
          { text: 'Project', value: 'project_name', sortable: true, width: "10%"},
          { text: 'Title', value: 'title', sortable: true, width: "30%"},
          { text: 'Status', value: 'status', sortable: false, class: 'hidden-sm-and-down' },
          { text: 'Labels', value: 'labels', sortable: false, class: 'hidden-sm-and-down' },
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
    ...mapState('gitlab', ['loading', 'issues'])
  },

  methods: {
    async editReport (issue) {
      // guess the index of the issue to change in the issues array
      let issueIndex
      for(issueIndex=0; issueIndex<this.issues.length; issueIndex++) {
        if(this.issues[issueIndex].id == issue.id) {
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
        this.$store.commit('gitlab/editIssue', {issueIndex, newMetadata})
      }
    },

    updateTags({dataIndex, tags}) {
      let newMetadata = {tags: tags}
      this.$store.commit('gitlab/editIssue', {issueIndex:dataIndex, newMetadata})
      this.$store.dispatch('gitlab/changeLabels', {issueIndex:dataIndex})
    }
  }
}
</script>

<style>
.small-text {
  font-size: 70%;
  color: #888;
}
</style>
