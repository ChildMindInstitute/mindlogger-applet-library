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
    async fetchBasketContent() {
      const { data: basketContent } = await api.getBasketContent({
        apiHost: this.apiHost,
        token: this.token,
      });

      this.$store.commit("setBasketContent", basketContent);
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
            const item = {
              id: treeIndex,
              itemId: values[1],
              inputType: items[itemId]["reprolib:terms/inputType"][0]["@value"],
              selected: false,
              name: items[itemId]["@id"]
            };

            if (item.inputType === "radio") {
              const options = items[itemId]["reprolib:terms/responseOptions"][0]["schema:itemListElement"];
              const multiple = items[itemId]["reprolib:terms/responseOptions"][0]["reprolib:terms/multipleChoice"][0]["@value"];

              item.options = options.map((option) => {
                return {
                  name: option["schema:name"][0]["@value"],
                  image: option["schema:image"] ? option["schema:image"][0]["@value"] : "",
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
    }
  }
}
