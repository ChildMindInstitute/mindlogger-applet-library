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
      const { data: appletContributionOrigins } = await api.getAppletContributionOrigin({
        apiHost: this.apiHost,
        token: this.token,
        libraryId,
      })

      if (Object.keys(appletContributionOrigins).length == 0) {
        return [];
      }

      const { data: contributionUpdatesData } = await api.getAppletContributionUpdates({
        apiHost: this.apiHost,
        token: this.token,
        libraryId,
      })

      const contributionsData = [];
      const itemModel = new Item();
      Object.entries(appletContributionOrigins).map(([itemId, itemContributionData]) => {
        const itemIdentifier = Object.keys(contributionUpdatesData).find(identifier => identifier.split("/").pop() == itemId);
        const activityId = itemIdentifier.split("/")[0];
        const itemUpdate = contributionUpdatesData[itemIdentifier];

        const created = this.formatTimeAgo(itemContributionData["baseItem"]["itemDate"]);
        const updated = this.formatTimeAgo(itemUpdate["updated"]);

        const itemOriginData = itemContributionData["content"];
        const itemCurrentData = appletContent["items"][itemIdentifier];

        itemModel.updateReferenceObject(itemModel.getItemBuilderData(Item.parseJSONLD(itemOriginData)));
        const originItem = itemModel.getItemData();

        itemModel.updateReferenceObject(itemModel.getItemBuilderData(Item.parseJSONLD(itemCurrentData)));
        const currentItem = itemModel.getItemData();

        const changeInfo = Item.getChangeInfo(originItem, currentItem);

        changeInfo.log.map(log => {
          contributionsData.push({
            creator: itemContributionData["baseItem"]["account"],
            created: created,
            appletName: itemContributionData["baseItem"]["applet"],
            activityName: appletContent["activities"][activityId]["@id"],
            itemName: itemContributionData["content"]["@id"],
            itemQuestion: itemContributionData["content"]["schema:question"][0]["@value"],
            editor: itemUpdate["lastUpdatedBy"],
            updated: updated,
            changes: log.name,
            version: itemContributionData["content"]["schema:version"][0]["@value"],
          });
        });
      });

      return contributionsData;
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
