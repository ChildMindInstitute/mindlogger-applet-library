import api from "../Api/api.vue";
import Protocol from 'applet-schema-builder/src/models/Protocol';
import ObjectToCSV from 'object-to-csv';
import TimeAgo from 'javascript-time-ago';
import en from 'javascript-time-ago/locale/en';
import fr from 'javascript-time-ago/locale/fr';
import _ from "lodash";
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
    appletContents() {
      return this.$store.state.appletContents;
    },
    cartSelections() {
      return this.$store.state.cartSelections;
    },
  },
  methods: {
    async fetchBasketApplets() {
      const { data: basketApplets } = await api.getBasketApplets({
        apiHost: this.apiHost,
        token: this.token,
      });
      this.$store.commit("setCartApplets", basketApplets);

      for (const applet of basketApplets) {
        await this.fetchAppletContent(applet.id, applet.appletId);
      }

      const { data: basketSelections } = await api.getBasket({
        apiHost: this.apiHost,
        token: this.token,
      });

      const cartSelections = {};
      Object.entries(basketSelections).map(([appletId, basketSelection]) => {
        const appletTree = this.$store.state.appletsTree[appletId];
        if (appletTree) {
          cartSelections[appletId] = [];
          basketSelection.map(activitySelection => {
            const { activityId, items } = activitySelection;
            const activityTree = appletTree.children.find(activity => activity.activityId == activityId);
            if (activityTree) {
              if (items) {
                cartSelections[appletId] = cartSelections[appletId].concat(activityTree.children.filter(item => items.includes(item.itemId)));
              } else {
                cartSelections[appletId] = cartSelections[appletId].concat(activityTree.children);
              }
            }
          })
        }
      });

      this.$store.commit("setCartSelections", cartSelections);
    },
    async fetchAppletContent(libraryId, appletId) {
      if (this.appletContents[appletId]) {
        return this.appletContents[appletId];
      }
      const { data: appletContent } = await api.getAppletContent({
        apiHost: this.apiHost,
        libraryId,
      })

      this.$store.commit("setAppletContent", {
        appletContent,
        appletId
      });

      const tree = this.buildAppletTree(appletContent);

      this.$store.commit("setAppletTree", {
        tree,
        appletId
      });

    },
    getOpenItems(applets, appletData, searchText) {
      applets.forEach((applet) => {
        const regex = new RegExp(searchText, "ig");
        console.log('appletData', appletData)

        this.isOpenAll[applet.appletId] = true;
        for (const activityData of appletData.children) {
          if (activityData.title.match(regex) && !this.isOpenAll[applet.appletId].includes(appletData.id)) {
            this.isOpenAll[applet.appletId].push(appletData.id);
          }
          for (const itemData of activityData.children) {
            if (itemData.title.match(regex) && !this.isOpenAll[applet.appletId].includes(activityData.id)) {
              this.isOpenAll[applet.appletId].push(activityData.id);
            }
          }
        }
      });
    },
    getFilteredApplets(applets, appletsTree, searchText) {
      if (!searchText) {
        return applets.filter((applet) => applet).sort(this.alphaSort);
      }
      return applets.filter((applet) => {
        const regex = new RegExp(searchText, "ig");
        const appletData = appletsTree;
        let hasSearchText = false;

        if (
          applet.name.match(regex) ||
          applet.description.match(regex) ||
          appletData.title.match(regex)
        ) {
          hasSearchText = true;
        }

        for (const keyword of applet.keywords) {
          if (keyword.match(regex)) {
            this.isOpenAll[applet.appletId] = true;
            return true;
          }
        }

        for (const activityData of appletData.children) {
          if (activityData.title.match(regex)) {
            this.isOpenAll[applet.appletId] = true;
            return true;
          }
          for (const itemData of activityData.children) {
            if (itemData.title.match(regex)) {
              this.isOpenAll[applet.appletId] = true;
              return true;
            }
            if (itemData.inputType === "radio" || itemData.inputType === "checkbox") {
              for (const optionData of itemData.options) {
                if (optionData.name.match(regex)) {
                  this.isOpenAll[applet.appletId] = true;
                  return true;
                }
              }
            } else if (itemData.inputType.match(regex)) {
              this.isOpenAll[applet.appletId] = true;
              return true;
            }
          }
        }

        return hasSearchText;
      }).sort(this.alphaSort);
    },
    async addCartItemsToBasket() {
      const form = new FormData();
      const formData = {};

      Object.entries(this.cartSelections).map(([appletId, cartSelection]) => {
        formData[appletId] = this.parseAppletCartItem(this.$store.state.appletsTree[appletId], cartSelection);
      })

      form.set("basket", JSON.stringify(formData));

      await api.addAppletsToBasket({
        apiHost: this.apiHost,
        token: this.token,
        data: form,
      });
      await this.fetchBasketApplets();
    },
    async updateAppletBasket(appletId, appletTree, selection) {
      const form = new FormData();
      const formData = this.parseAppletCartItem(
        appletTree,
        selection
      );
      form.set("selection", JSON.stringify(formData));
      await api.updateAppletBasket({
        apiHost: this.apiHost,
        token: this.token,
        appletId,
        data: form,
      });
    },
    async deleteBasketApplet(appletId) {
      await api.deleteBasketApplet({
        apiHost: this.apiHost,
        token: this.token,
        appletId,
      });
    },
    buildAppletTree(appletData) {
      let treeIndex = 1;
      const { items, activities, applet } = appletData;
      const treeItem = {
        id: treeIndex,
        appletId: applet._id.substring(7),
        title: applet.displayName,
        children: [],
        vnode: null
      };

      treeIndex += 1;

      const parseItemData = ({ itemData, index, itemId }) => {
        const itemTitle = itemData["schema:question"]
          ? itemData["schema:question"][0]["@value"]
          : itemData["http://www.w3.org/2004/02/skos/core#prefLabel"][0]["@value"];
        const nodes = itemTitle.includes("150x150)") ? itemTitle.split("150x150)")
          : itemTitle.includes("200x200)") ? itemTitle.split("200x200)")
            : itemTitle.split("250x250)");
        const item = {
          id: index,
          itemId: itemId,
          inputType: itemData["reprolib:terms/inputType"][0]["@value"],
          selected: false,
          title: (nodes.pop() || itemData["@id"]).replaceAll("**", "")
        };

        if (item.inputType === "radio") {
          const options = itemData["reprolib:terms/responseOptions"][0]["schema:itemListElement"];
          const multiple = _.get(itemData["reprolib:terms/responseOptions"][0]["reprolib:terms/multipleChoice"], [0, "@value"], false);

          item.options = options.map((option) => ({
            name: option["schema:name"][0]["@value"],
            image: option["schema:image"],
          }));
          if (multiple) {
            item.inputType = "checkbox";
          }
        } else if (item.inputType == "markdown-message") {
          item.inputType = "markdownMessage";
        }

        return item;
      }

      for (const activityId in activities) {
        const activityItem = {
          id: treeIndex,
          activityId,
          title: activities[activityId]["http://www.w3.org/2004/02/skos/core#prefLabel"][0]["@value"],
          children: [],
          vnode: null
        };

        treeIndex += 1;
        for (const itemId in items) {
          if (itemId.includes("https://raw.githubusercontent.com")) {
            const values = activityId.split("/");

            if (itemId.includes(values[values.length - 2])) {
              const item = parseItemData({
                itemData: items[itemId],
                index: treeIndex,
                itemId: items[itemId]["_id"].split("/")[1]
              });

              treeIndex += 1;
              activityItem.children.push(item);
            }
          } else {
            const values = itemId.split("/");

            if (activityId === values[0]) {
              const item = parseItemData({
                itemData: items[itemId],
                index: treeIndex,
                itemId: values[1]
              });

              treeIndex += 1;
              activityItem.children.push(item);
            }
          }
        }

        treeItem.children.push(activityItem);
      }

      return treeItem;
    },
    parseAppletCartItem(appletTree, selection) {
      const cartItem = [];

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
    getItemtitle(itemTitle) {
      const values = itemTitle.split('0)');
      return values[values.length - 1];
    },
    async getAppletContributions(libraryId, appletContent) {
      const { data: contributionUpdatesData } = await api.getAppletContributionUpdates({
        apiHost: this.apiHost,
        libraryId,
      })

      const { data: appletContributionOrigins } = await api.getAppletContributionOrigin({
        apiHost: this.apiHost,
        libraryId,
      })

      const contributionsData = [];

      // const itemModel = new Item();
      // Object.entries(appletContributionOrigins).map(([itemId, itemContributionData]) => {
      //   const itemIdentifier = Object.keys(contributionUpdatesData).find(identifier => identifier.split("/").pop() == itemId);
      //   const activityId = itemIdentifier.split("/")[0];
      //   const itemUpdate = contributionUpdatesData[itemIdentifier];

      //   const created = this.formatTimeAgo(itemContributionData["baseItem"]["itemDate"]);
      //   const updated = this.formatTimeAgo(itemUpdate["updated"]);

      //   const itemOriginData = itemContributionData["content"];
      //   const itemCurrentData = appletContent["items"][itemIdentifier];

      //   itemModel.updateReferenceObject(itemModel.getItemBuilderData(Item.parseJSONLD(itemOriginData)));
      //   const originItem = itemModel.getItemData();

      //   itemModel.updateReferenceObject(itemModel.getItemBuilderData(Item.parseJSONLD(itemCurrentData)));
      //   const currentItem = itemModel.getItemData();

      //   const changeInfo = Item.getChangeInfo(originItem, currentItem);

      //   changeInfo.log.map(log => {
      //     contributionsData.push({
      //       creator: itemContributionData["baseItem"]["account"],
      //       created: created,
      //       appletName: itemContributionData["baseItem"]["applet"],
      //       activityName: appletContent["activities"][activityId]["@id"],
      //       itemName: itemContributionData["content"]["@id"],
      //       itemQuestion: itemContributionData["content"]["schema:question"][0]["@value"],
      //       editor: itemUpdate["lastUpdatedBy"],
      //       updated: updated,
      //       changes: log.name,
      //       version: itemContributionData["content"]["schema:version"][0]["@value"],
      //     });
      //   });
      // });

      const generateLogs = (old, current) => {
        const changeInfo = Protocol.getChangeInfo(old, current);
        const changeLogs = [];

        const extractLogs = (logs) => {
          logs.map(log => {
            if (log.children) {
              extractLogs(log.children);
            } else {
              changeLogs.push(log.name);
            }
          })
        }
        extractLogs(changeInfo.log);

        return changeLogs;
      }

      const currentApplet = await Protocol.parseApplet(appletContent);
      const currentProtocol = await Protocol.formattedProtocol(currentApplet);
      await Promise.all(Object.entries(contributionUpdatesData).reverse().map(async ([itemIdentifier, itemUpdate]) => {
        const activityId = itemIdentifier.split("/")[0];
        const itemId = itemIdentifier.split("/")[1];

        if (appletContributionOrigins[itemId]) {
          const itemContributionData = appletContributionOrigins[itemId];

          const created = this.formatTimeAgo(itemContributionData["baseItem"]["itemDate"]);
          const updated = this.formatTimeAgo(itemUpdate["updated"]);

          const originAppletContent = JSON.parse(JSON.stringify(appletContent));
          originAppletContent.items[itemIdentifier] = itemContributionData["content"];

          const originalApplet = await Protocol.parseApplet(originAppletContent);
          const originProtocol = await Protocol.formattedProtocol(originalApplet);

          const logData = {
            creator: itemContributionData["baseItem"]["account"],
            created: created,
            appletName: itemContributionData["baseItem"]["applet"],
            activityName: appletContent["activities"][activityId]["@id"],
            itemName: itemContributionData["content"]["@id"],
            itemQuestion: itemContributionData["content"]["schema:question"][0]["@value"],
            editor: itemUpdate["lastUpdatedBy"],
            updated: updated,
            version: itemContributionData["content"]["schema:version"][0]["@value"],
          };

          const logs = generateLogs(originProtocol, currentProtocol);
          logs.map(log => {
            contributionsData.push({
              ...logData,
              changes: log
            })
          })
        } else {
          const updated = this.formatTimeAgo(itemUpdate["updated"]);
          const created = updated;

          const itemData = appletContent["items"][itemIdentifier];
          const originAppletContent = JSON.parse(JSON.stringify(appletContent));
          delete originAppletContent.items[itemIdentifier];

          const originalApplet = await Protocol.parseApplet(originAppletContent);
          const originProtocol = await Protocol.formattedProtocol(originalApplet);

          const logData = {
            creator: itemUpdate["lastUpdatedBy"],
            created: created,
            appletName: appletContent["applet"]["displayName"],
            activityName: appletContent["activities"][activityId]["@id"],
            itemName: itemData["@id"],
            itemQuestion: itemData["schema:question"][0]["@value"],
            editor: itemUpdate["lastUpdatedBy"],
            updated: updated,
            version: itemData["schema:version"] ? itemData["schema:version"][0]["@value"] : "0.0.1",
          };

          const logs = generateLogs(originProtocol, currentProtocol);
          logs.map(log => {
            contributionsData.push({
              ...logData,
              changes: log
            })
          })
        }
      }));

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
    },
    alphaSort(A, B) {
      if (A.name.toLowerCase() > B.name.toLowerCase()) {
        return 1;
      } else if (A.name.toLowerCase() < B.name.toLowerCase()) {
        return -1;
      } else if (A.name < B.name) {
        return 1;
      } else if (A.name > B.name) { 
        return -1;
      } else {
        return 0;
      }
    },
    highlight(rawString) {
      if (this.searchText) {
        const searchRegex = new RegExp("(" + this.searchText + ")", "ig");

        return rawString
          .replace(searchRegex, "<b>$1</b>")
          .replaceAll(" ", "&nbsp;");
      } else {
        return rawString;
      }
    }
  }
}
