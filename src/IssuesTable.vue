<!--

Shows a table with information about issues

-->

<template>
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
          <v-edit-dialog
            :return-value.sync="props.item.time_reported"
            large
            lazy
            persistent
          >
            {{ props.item.time_reported }}
            <div slot="input" class="mt-3 title">Report</div>
            <v-text-field
              slot="input"
              v-model="props.item.time_reported"
              label="Edit"
              single-line
              counter
              autofocus
            ></v-text-field>
          </v-edit-dialog>
      </tr>
    </template>
  </v-data-table>
</template>

<script>
export default {
  props: {
    issues: {
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
      ]
    }
  }
}
</script>
