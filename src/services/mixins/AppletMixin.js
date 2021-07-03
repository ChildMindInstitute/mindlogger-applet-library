import api from "../Api/api";
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
    onBackToBuilder(sync = false) {
      window.location.href = `${process.env.VUE_APP_ADMIN_URI}/#/library/?from=library&cache=true&sync=${sync}`;
    },
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
        const appletTree = this.$store.state.appletsTree[appletId][0];
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
        const appletData = appletsTree[applet.appletId][0];
        let hasSearchText = false;

        if (
          applet.name.match(regex) ||
          (applet.description && applet.description.match(regex)) ||
          appletData.title.match(regex)
        ) {
          hasSearchText = true;
        }

        for (const keyword of applet.keywords) {
          if (keyword.match(regex)) {
            return true;
          }
        }

        for (const activityData of appletData.children) {
          if (activityData.title.match(regex)) {
            return true;
          }
          for (const itemData of activityData.children) {
            if (itemData.title.match(regex)) {
              return true;
            }
            if (itemData.inputType === "radio" || itemData.inputType === "checkbox") {
              for (const optionData of itemData.options) {
                if (optionData.name.match(regex)) {
                  return true;
                }
              }
            } else if (itemData.inputType.match(regex)) {
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
        formData[appletId] = this.parseAppletCartItem(this.$store.state.appletsTree[appletId][0], cartSelection);
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

      for (const activityKey in activities) {
        const activityData = activities[activityKey];
        const activityId = activityData["_id"].split("/").pop();
        const activityIdentifier = activityKey.includes("https://raw.githubusercontent.com") ? activityKey.split("/").slice(0, -1).join("/") : activityId;
        const activityItem = {
          id: treeIndex,
          activityId,
          title: activityData["http://www.w3.org/2004/02/skos/core#prefLabel"][0]["@value"],
          children: [],
          vnode: null
        };

        treeIndex += 1;
        for (const itemKey in items) {
          const itemData = items[itemKey];
          const itemActivityIdentifier = itemKey.includes("https://raw.githubusercontent.com") ? itemKey.split("/").slice(0, -2).join("/") : itemKey.split("/")[0]
          if (itemActivityIdentifier === activityIdentifier) {
            const itemId = itemData["_id"].split("/").pop()

            const itemTitle = itemData["schema:question"]
              ? itemData["schema:question"][0]["@value"]
              : itemData["http://www.w3.org/2004/02/skos/core#prefLabel"][0]["@value"];
            const nodes = itemTitle.includes("150x150)") ? itemTitle.split("150x150)")
              : itemTitle.includes("200x200)") ? itemTitle.split("200x200)")
                : itemTitle.split("250x250)");
            const item = {
              id: treeIndex,
              itemId,
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

            treeIndex += 1;
            activityItem.children.push(item);
          }
        }

        treeItem.children.push(activityItem);
      }

      return treeItem;
    },
    getOpenNodes(tree, key) {
      const searchText = key.toLowerCase();
      const nodes = [];
      let openApplet = false;

      tree.children.forEach((activity) => {
        let openActivity = false;

        activity.children.forEach((item) => {
          if (item.title.toLowerCase().includes(searchText)) {
            openActivity = true;
            openApplet = true;
          }
        })

        if (openActivity) {
          nodes.push(activity);
        }

        if (activity.title.toLowerCase().includes(searchText)) {
          openApplet = true;
        }
      })

      if (openApplet) {
        nodes.push(tree);
      }

      return nodes;
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
      const { data: appletContributionOrigins } = await api.getAppletContributionOrigin({
        apiHost: this.apiHost,
        libraryId,
      })

      if (Object.keys(appletContributionOrigins).length === 0) {
        return [];
      }

      const { data: contributionUpdatesData } = await api.getAppletContributionUpdates({
        apiHost: this.apiHost,
        libraryId,
      })

      const currentProtocol = await Protocol.formattedProtocol(
        await Protocol.parseApplet(appletContent)
      );

      const oldContent = {
        ...appletContent,
        items: {}
      };

      for (const itemIRI in appletContent.items) {
        const item = appletContent.items[itemIRI];
        const itemID = item['_id'].split('/')[1];

        if (itemID in appletContributionOrigins) {
          oldContent.items[itemIRI] = {
            ...appletContributionOrigins[itemID].content,
            _id: appletContent.items[itemIRI]._id
          };
        } else {
          oldContent.items[itemIRI] = {};
        }
      }

      const oldProtocol = await Protocol.formattedProtocol(
        await Protocol.parseApplet(oldContent)
      );

      const changeInfo = Protocol.getChangeInfo(oldProtocol, currentProtocol);
      const itemLogs = [];

      const extractLogs = (logs, depth) => {
        logs.map(log => {
          if (depth == 3) {
            if (log.itemId) {
              itemLogs.push(log);
            }
          } else {
            extractLogs(log.children, depth+1);
          }
        })
      }

      extractLogs(changeInfo.log, 0);

      const itemID2Activity = {};
      const itemID2IRI = {};

      Object.values(appletContent.activities).map(activity => {
        const itemIRIs = _.get(activity, ['reprolib:terms/order', 0, '@list']);
        for (const itemIRI of itemIRIs) {
          const item = appletContent.items[itemIRI['@id']];
          const itemID = item._id.split('/')[1];

          itemID2Activity[itemID] = activity;
          itemID2IRI[itemID] = itemIRI['@id'];
        }
      });

      Object.keys(appletContributionOrigins).forEach(itemId => {
        itemLogs.push({
          children: [],
          itemId,
          origin: true
        });
      })

      const contributionsData = itemLogs.map(itemLog => {
        const baseItem = (appletContributionOrigins[itemLog.itemId] || {}).baseItem || {};
        const itemIRI = itemID2IRI[itemLog.itemId];
        const item = appletContent.items[itemIRI];
        const activity = itemID2Activity[itemLog.itemId];
        const prefLabel = 'http://www.w3.org/2004/02/skos/core#prefLabel';

        return {
          creator: baseItem.account || '',
          created: baseItem.updated || '',
          appletName: baseItem.applet || '',
          activityName: _.get(activity, [prefLabel, 0, '@value']),
          itemName: _.get(item, [prefLabel, 0, '@value']),
          itemQuestion: _.get(item, ['schema:question', 0, '@value']),
          editor: !itemLog.origin ? _.get(contributionUpdatesData, [itemIRI, 'lastUpdatedBy']) : baseItem.account,
          updated: !itemLog.origin ? _.get(contributionUpdatesData, [itemIRI, 'updated']) : baseItem.updated,
          changes: itemLog.children.map(log => log.name),
          version: !itemLog.origin ? _.get(contributionUpdatesData, [itemIRI, 'version']) : baseItem.version,
        }
      });

      return contributionsData;
    },
    exportContributions(contributionsData) {
      let otc = new ObjectToCSV({
        keys: [{
          as: 'Original Owner',
          key: 'creator',
        }, {
          as: 'Date Created',
          key: 'created',
        }, {
          as: 'Applet Name',
          key: 'appletName',
        }, {
          as: 'Activity Name',
          key: 'activityName',
        }, {
          as: 'Item Name',
          key: 'itemName',
        }, {
          as: 'Item Question',
          key: 'itemQuestion',
        }, {
          as: 'Edited by',
          key: 'editor',
        }, {
          as: 'Edit Date',
          key: 'updated',
        }, {
          as: 'Changes',
          key: 'changes',
        }, {
          as: 'Version',
          key: 'version',
        }],
        data: contributionsData.map(d => ({
          ...d,
          changes: d.changes.join('\r\n')
        })),
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
