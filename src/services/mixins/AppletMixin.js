import api from "../Api/api.vue";
import Item from 'applet-schema-builder/src/models/Item';
import ObjectToCSV from 'object-to-csv';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import fr from 'javascript-time-ago/locale/fr';
TimeAgo.addLocale(en);
TimeAgo.addLocale(fr);

export const AppletMixin = {
  computed: {
    apiHost() {
      return this.$store.state.backend;
    },
    token() {
      return this.$store.state.auth.authToken.token;
    },
  },
  methods: {
    async getAppletContributions(libraryId, appletContent) {
      const { data: contributionUpdatesData } = await api.getAppletContributionUpdates({
        apiHost: this.apiHost,
        token: this.token,
        libraryId,
      })
      if (Object.keys(contributionUpdatesData).length <= 1) {
        return [];
      }
      const { data: appletContributionOrigins } = await api.getAppletContributionOrigin({
        apiHost: this.apiHost,
        token: this.token,
        libraryId,
      })

      const itemModel = new Item();
      let currentItem = null;
      const appletContributionUpdates = Object.entries(contributionUpdatesData).map(([identifier, updates]) => {
        const key = identifier.split("/").pop()
        let changes = '';
        if (!appletContributionOrigins[key]) {
          const item = itemModel.getItemBuilderData(Item.parseJSONLD(
            appletContent['items'][identifier]
          ));
          itemModel.updateReferenceObject(item);
          currentItem = itemModel.getItemData();
          changes = 'created';
        }
        return {
          identifier,
          key: identifier.split("/").pop(),
          ...updates,
          created: this.formatTimeAgo(updates.created),
          updated: this.formatTimeAgo(updates.updated),
          changes,
        }
      })

      appletContributionUpdates.map(c => {
        if (c.changes == '') {
          const item = itemModel.getItemBuilderData(Item.parseJSONLD(
            appletContributionOrigins[c.key]['content']
          ));
          itemModel.updateReferenceObject(item);
          const originItem = itemModel.getItemData();
          const changeInfo = Item.getChangeInfo(currentItem, originItem);
          c.changes = changeInfo.log.reduce((c, l) => c += l['name'] + "\n", '');
        }
      });

      return appletContributionUpdates;
    },
    exportContributions(contributionsData) {
      let otc = new ObjectToCSV({
        keys: [{
          as: 'Original Owner',
          key: 'creator',
        },{
          as: 'Date Created',
          key: 'created',
        },{
          as: 'Applet Name',
          key: 'appletName',
        },{
          as: 'Activity Name',
          key: 'activityName',
        },{
          as: 'Item Name',
          key: 'itemName',
        },{
          as: 'Item Question',
          key: 'itemQuestion',
        },{
          as: 'Edited by',
          key: 'editor',
        },{
          as: 'Edit Date',
          key: 'updated',
        },{
          as: 'Changes',
          key: 'changes',
        },{
          as: 'Version',
          key: 'version',
        }],
        data: contributionsData,
      });

      const anchor = document.createElement('a');
      anchor.href =
        'data:text/csv;charset=utf-8,' + encodeURIComponent(otc.getCSV());
      anchor.target = '_blank';
      anchor.download = 'contributions.csv';
      anchor.click();
    },
    formatTimeAgo(time) {
      return new TimeAgo(this.$i18n.locale.replace('_', '-')).format(new Date(time), 'round')
    }
  }
}
