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
    appletsTree() {
      return this.$store.state.appletsTree;
    },
    cartSelections() {
      return this.$store.state.cartSelections;
    },
  },
  methods: {
    async fetchPublishedApplets() {
      const { data: publishedApplets } = await api.getPublishedApplets({
        apiHost: this.apiHost,
      });

      const appletContents = {};
      const appletsTree = {};
      await Promise.all(publishedApplets.map(async (applet) => {
        try {
          const { data: appletContent } = await api.getAppletContent({
            apiHost: this.apiHost,
            libraryId: applet.id,
          });

          appletContents[applet.appletId] = {
            ...appletContent,
            meta: applet
          };
          appletsTree[applet.appletId] = this.buildAppletTree(appletContent);
        } catch (error) {
          console.log(error);
        }
      }));

      this.$store.commit("setPublishedApplets", publishedApplets);
      this.$store.commit("setAppletContents", appletContents);
      this.$store.commit("setAppletsTree", appletsTree);
    },
    async addCartItemsToBasket() {
      const form = new FormData();
      const formData = {};

      Object.entries(this.cartSelections).map(([appletId, cartSelection]) => {
        formData[appletId] = this.parseAppletCartItem(appletId, cartSelection);
      })

      form.set("basket", JSON.stringify(formData));

      await api.addAppletsToBasket({
        apiHost: this.apiHost,
        token: this.token,
        data: form,
      });
    },
    buildAppletTree(appletData) {
      let treeIndex = 1;
      const { items, activities, applet } = appletData;
      const treeItem = {
        id: treeIndex,
        appletId: applet._id.substring(7),
        name: applet.displayName,
        children: [],
      };

      treeIndex += 1;

      for (const activityId in activities) {
        const activityItem = {
          id: treeIndex,
          activityId,
          name: activities[activityId]["@id"],
          children: [],
        };

        treeIndex += 1;
        for (const itemId in items) {
          const values = itemId.split('/');

          if (activityId === values[0]) {
            const nodes = items[itemId]["schema:question"][0]["@value"].split("250)");
            const item = {
              id: treeIndex,
              itemId: values[1],
              inputType: items[itemId]["reprolib:terms/inputType"][0]["@value"],
              selected: false,
              name: nodes[nodes.length - 1] || items[itemId]["@id"]
            };

            if (item.inputType === "radio") {
              const options = items[itemId]["reprolib:terms/responseOptions"][0]["schema:itemListElement"];
              const multiple = items[itemId]["reprolib:terms/responseOptions"][0]["reprolib:terms/multipleChoice"][0]["@value"];

              item.options = options.map((option) => {
                return {
                  name: option["schema:name"][0]["@value"],
                  image: option["schema:image"],
                }
              });
              if (multiple) {
                item.inputType = "checkbox";
              }
            }

            treeIndex += 1;
            activityItem.children.push(item);
          }
        }

        treeItem.children.push(activityItem);
      }

      return treeItem;
    },
    parseAppletCartItem(appletId, selection) {
      const cartItem = [];
      const appletTree = this.appletsTree[appletId];

      selection.forEach(({ id }) => {
        appletTree.children.forEach(activity => {
          const selectedItem = activity.children.find(item => item.id === id);

          if (selectedItem) {
            const actIndex = cartItem.findIndex(({ activityId }) => activityId === activity.activityId);

            if (actIndex === -1) {
              const act = {
                activityId: activity.activityId,
              };

              if (activity.children.length === 1) {
                act.items = null;
              } else {
                act.items = [];
                act.items.push(selectedItem.itemId);
              }
              cartItem.push(act);
            } else if (cartItem[actIndex].items) {
              cartItem[actIndex].items.push(selectedItem.itemId);

              if (cartItem[actIndex].items.length === activity.children.length) {
                cartItem[actIndex].items = null;
              }
            }
          }
        });
      });

      return cartItem;
    },
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
