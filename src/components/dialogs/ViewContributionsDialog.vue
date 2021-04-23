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
          :items="contributionsData"
          :search="search"
        ></v-data-table>
      </v-card-text>
    </v-card>
  </v-dialog>

</template>

<style scoped>
</style>

<script>
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
};
</script>
