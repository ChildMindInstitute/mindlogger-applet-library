<template>
  <v-dialog
    :value="value"
    @input="$emit('input', $event)"
  >
    <v-card>
      <v-card-title
        class="headline grey lighten-2"
        primary-title
      >
        Contributions
      </v-card-title>
      <v-card-text>
        <v-data-table
          :headers="headers"
          :items="contributions"
          :search="search"
          class="elevation-1 data-table"
        >
          <template v-slot:body="props">
            <tr
              v-for="item in props.items"
              :key="item.id"
            >
              <td
                v-for="header in headers"
                :key="header.value"
                :class="`cell ${header.value}`"
              >
                {{ item[header.value] }}
              </td>
            </tr>
          </template>
        </v-data-table>
      </v-card-text>
    </v-card>
  </v-dialog>

</template>

<style scoped>
.data-table /deep/ th > i {
  display: none;
}

.data-table /deep/ th:hover > i {
  display: inline;
}

.creator, .created {
  width: 100px;
  max-width: 100px;
}
.appletName, .activityName, .itemName {
  width: 110px;
  max-width: 110px;
}
.itemQuestion {
  width: 200px;
  max-width: 200px;
}
.editor, .updated {
  width: 80px;
  max-width: 80px;
}
.version {
  width: 75px;
  max-width: 75px;
}
</style>

<script>
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import fr from 'javascript-time-ago/locale/fr';
TimeAgo.addLocale(en);
TimeAgo.addLocale(fr);

export default {
  name: 'ViewContributionsDialog',
  mixins: [],
  props: {
    contributionsData: {
      type: Array,
      required: true,
    },
    value: {
      type: Boolean,
      required: true
    }
  },
  data: () => ({
    search: '',
    headers: [{
      text: 'Original Owner',
      align: 'left',
      sortable: true,
      value: 'creator',
    },{
      text: 'Date Created',
      align: 'left',
      sortable: true,
      value: 'created',
    },{
      text: 'Applet Name',
      align: 'left',
      sortable: true,
      value: 'appletName',
    },{
      text: 'Activity Name',
      align: 'left',
      sortable: true,
      value: 'activityName',
    },{
      text: 'Item Name',
      align: 'left',
      sortable: true,
      value: 'itemName',
    },{
      text: 'Item Question',
      align: 'left',
      sortable: true,
      value: 'itemQuestion',
    },{
      text: 'Edited by',
      align: 'left',
      sortable: true,
      value: 'editor',
    },{
      text: 'Edit Date',
      align: 'left',
      sortable: true,
      value: 'updated',
    },{
      text: 'Changes',
      align: 'left',
      sortable: true,
      value: 'changes',
    },{
      text: 'Version',
      align: 'left',
      sortable: true,
      value: 'version',
    }],
  }),
  computed: {
    contributions() {
      return this.contributionsData.map(contribution => ({
        ...contribution,
        changes: contribution.changes.join(', '),
        created: this.formatTimeAgo(contribution.created),
        updated: this.formatTimeAgo(contribution.updated)
      }));
    }
  },
  methods: {
    formatTimeAgo(time) {
      return time && new TimeAgo(this.$i18n.locale.replace('_', '-')).format(new Date(time), 'round')
    },
  }
};
</script>
