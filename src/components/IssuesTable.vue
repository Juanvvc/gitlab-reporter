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
      group-by="project_name"
      show-group-by
    >
      <template v-slot:item.project_name="{ item }" >
        <a :href="item.project_url" target="_blank">{{ item.project_name }}</a>
      </template>
      <template v-slot:item.title="{ item }">
        <a :href="item.web_url" target="_blank">{{ item.title }}</a>
      </template>
      <template v-slot:item.status="{ item }">
        <status-tag :issue="item" />
      </template>
      <template v-slot:item.milestone="{ item }">
        {{ (item.milestone?item.milestone.title:"") }}
      </template>
      <template v-slot:item.labels="{ item }" >
        <tag-editor :data-index="getIndexFromId(item.id)" :tags="item.labels" @update-tags="updateTags" />
      </template>
      <template v-slot:item.assignees="{ item }">
        {{ item.asignee_names }}
      </template>
      <template v-slot:item.estimated="{ item }">
        {{ item.time_stats.human_time_estimate }}
      </template>
      <template v-slot:item.spent="{ item }">
        {{ item.time_stats.human_total_time_spent }}
      </template>
      <template v-slot:item.report="{ item }">
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
        </template>
    </v-data-table>

    <div v-if="showStats">Hours estimated: {{totalEstimated}}. Hours spent: {{totalSpent}}</div>

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

  props: {
    showStats: {
      mandatory: false,
      type: Boolean,
      default: false
    },
  },

  data () {
    return {
      headers: [
          { text: 'Project', value: 'project_name', sortable: true, groupable: true, width: "10%"},
          { text: 'Title', value: 'title', sortable: true, groupable: false, width: "30%"},
          { text: 'Status', value: 'status', sortable: false, groupable: false, align: ' d-none d-lg-table-cell' },
          { text: 'Milestone', value: 'milestone', sortable: false, groupable: false, align: ' d-none d-lg-table-cell' },
          { text: 'Labels', value: 'labels', sortable: false, groupable: false, align: ' d-none d-lg-table-cell' },
          { text: 'Due date', value: 'due_date', sortable: true, groupable: true, align: ' d-none d-lg-table-cell'},
          { text: 'Assignees', value: 'assignees', sortable: false, groupable: false, align: ' d-none d-lg-table-cell' },
          { text: 'Estimated', value: 'estimated', sortable: false, gropable: false, align: ' d-none d-lg-table-cell' },
          { text: 'Spent', value: 'spent', sortable: false, groupable: false, align: ' d-none d-lg-table-cell' },
          { text: 'Today', value: 'report', sortable: false,groupable: false }
      ],
      selectedIssue: null,
    }
  },

  computed: {
    totalEstimated() {
      let total = 0;
      this.issues.forEach( issue => { total += issue.time_stats.time_estimate })
      return total / (60 * 60)
    },
    totalSpent() {
      let total = 0;
      this.issues.forEach( issue => { total += issue.time_stats.total_time_spent })
      return total / (60 * 60)
    },
    ...mapState('gitlab', ['loading', 'issues'])
  },

  methods: {
    getIndexFromId(issue_id) {
      // guess the index of the issue to change in the issues array
      let issueIndex = -1
      for(issueIndex=0; issueIndex<this.issues.length; issueIndex++) {
        if(this.issues[issueIndex].id == issue_id) {
          break
        }
      }
      return issueIndex
    },

    async editReport (issue) {
      let issueIndex = this.getIndexFromId(issue.id)

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
