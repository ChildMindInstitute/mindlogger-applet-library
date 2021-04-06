<template>
  <div v-show="!isLoading">
    <div class="d-flex align-center justify-center align-content-ceneter">
      <v-text-field
        v-model="searchText"
        @input="onSearchText"
        light
        solo
        prepend-inner-icon="search"
        placeholder="Type keyword...">
      </v-text-field>

      <v-badge
        v-if="baskets.length"
        color="primary"
        :content="baskets.length"
        bottom
        offset-x="35"
        offset-y="37"
      >
        <v-icon color="blue-grey darken-3" large class="mx-4 mb-6">
          mdi-basket-outline 
        </v-icon>
      </v-badge>
      <v-badge
        v-else
        color="primary"
        content="0"
        bottom
        offset-x="35"
        offset-y="37"
      >
        <v-icon color="blue-grey darken-3" large class="mx-4 mb-6">
          mdi-basket-outline 
        </v-icon>
      </v-badge>
    </div>

    <div class="mt-0">
      <v-card 
        class="mx-auto mb-4 d-flex pa-md-2"
        v-for="applet in publishedApplets()"
      >
        <div class="text-center">
          <v-img
            v-if="applet.image"
            class="ma-2 ds-avatar"
            src="https://cdn.vuetifyjs.com/images/cards/sunshine.jpg"
            max-width="150px"
            height="150px"
          />

          <v-avatar
            v-else
            tile
            class="ma-2 ds-avatar"
            color="blue"
            size="150"
          >
            <span class="white--text text-h3">
              {{ applet.name[0] }}
            </span>
          </v-avatar>
        </div>
        <div class="ds-tree-layout ml-2">
          <v-card-title class="text-decoration-underline text-h6">
            {{ applet.name }}
          </v-card-title>

          <v-card-subtitle 
            v-if="applet.description"
            class="mx-6 black--text text-body-1 ds-subtitle"
          >
            Description: {{ applet.description }}
          </v-card-subtitle>

          <v-card-actions class="mx-5 px-2 py-0">
            <span 
              v-if="applet.keywords.length"
              class="text-body-1"
            >
              Keywords: 
            </span>
            <v-btn
              v-for="keyword in applet.keywords"
              color="orange lighten-2"
              text
            >
              {{ keyword }}
            </v-btn>
          </v-card-actions>

          <v-expand-transition>
            <v-treeview
              class="d-flex justify-start ds-tree-view"
              v-model="selection"
              :items="appletsTree"
              selection-type="leaf"
              selected-color="darkgrey"
              on-icon="mdi-checkbox-marked-circle-outline"
              off-icon="mdi-checkbox-blank-circle-outline"
              indeterminate-icon="mdi-minus-circle-outline"
              @input="onAppletSelection"
              open-on-click
              selectable
              return-object
            >
            </v-treeview>
          </v-expand-transition>
        </div>
        <div class="d-flex align-baseline">
          <v-btn
            class="mx-2 mt-2"
            fab
            small
            @click="onAddBasket(applet.appletId)"
            :disabled="!selectedApplets[applet.appletId]"
          >
            <v-icon color="grey darken-3" >
              mdi-basket-plus-outline
            </v-icon>
          </v-btn>

          <v-btn
            class="ml-2 mt-2 mr-6"
            fab
            small
            @click="onAppletDetail(applet)"
          >
            <v-icon color="grey darken-3">
              mdi-information-outline
            </v-icon>
          </v-btn>
        </div>
      </v-card>
    </div>
  </div>
</template>

<style lang="scss">
.ds-avatar {
  border-radius: 4px !important;
}

.ds-subtitle {
  padding: 4px !important;
  margin-top: 0 !important;
}

.v-treeview-node__content {
  flex-direction: column;
}

.ds-tree-view, .ds-tree-layout {
  width: 100%
}

.v-treeview-node {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
</style>

<script>
import api from "../services/Api/api.vue";

export default {
  name: 'LibrarySearch',
  components: {

  },
  data() {
    return {
      searchText: "",
      isLoading: true,
      selectedApplets: {},
      appletsTree: [],
      baskets: [],
      selection: [],
      
    };
  },
  async beforeMount() {
    try {
      this.isLoading = true;
      const publishedApplets = (await api.getPublishedApplets({
        apiHost: this.$store.state.backend,
      })).data;

      this.appletsTree = await Promise.all(publishedApplets.map(async (applet) => {
        try {
          const response = await api.getAppletContent({
            apiHost: this.$store.state.backend,
            libraryId: applet.id,
          });

          return this.buildAppletTree(response.data);
        } catch (error) {
          console.log(error)
        }
      }));

      this.$store.commit("setPublishedApplets", publishedApplets);
      this.isLoading = false;
    } catch(err) {
      console.log(err);
    }
  },
  methods: {
    publishedApplets() {
      if (this.searchText) {
        return this.$store.state.publishedApplets.filter(applet => {
          applet.keywords.forEach(keyword => {
            if (keyword.startsWith(this.searchText)) {
              return true;
            }
          });

          return false;
        });
      } else {
        return this.$store.state.publishedApplets;
      }
    },
    onAddBasket (appletId) {
      const form = new FormData();

      form.set("basket", JSON.stringify(this.selectedApplets[appletId]));
      api.addAppletsToBasket({
        apiHost: this.$store.state.backend,
        data: form,
      }).then(() => {
        if (!this.baskets.includes(appletId)) {
          this.baskets.push(appletId);
        }
      });
    },
    onAppletDetail(applet) {
      this.$router.push({
        name: 'AppletDetail',
        params: { appletId: applet.id },
      });
    },
    buildAppletTree (appletData) {
      const { items, activities, applet } = appletData;
      const treeItem = {
        id: 1,
        appletId: applet._id.substring(7),
        name: appletData.applet["@id"],
        children: [],
      };

      let index = 2;

      for (const activityId in activities) {
        const activityItem = {
          id: index,
          activityId,
          name: activities[activityId]["@id"],
          children: [],
        };

        index += 1;
        for (const itemId in items) {
          const values = itemId.split('/');

          if (activityId === values[0]) {
            const item = {
              id: index,
              itemId: values[1],
              inputType: items[itemId]["reprolib:terms/inputType"][0]["@value"],
              name: items[itemId]["@id"]
            };

            index += 1;
            activityItem.children.push(item);
          }
        }

        treeItem.children.push(activityItem);
      }

      return treeItem;
    },
    /*
     * Change appletTreeData format to basket data 
     */
    onAppletSelection() {
      const selectedApplets = {};

      this.selection.forEach(({ id }) => {
        this.appletsTree.forEach(applet => {
          applet.children.forEach(activity => {
            const selectedItem = activity.children.find(item => item.id === id);

            if (selectedItem) {
              if (!selectedApplets[applet.appletId]) {
                selectedApplets[applet.appletId] = [];
              }

              const actIndex = selectedApplets[applet.appletId].findIndex(({ activityId }) => activity.activityId);

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
                selectedApplets[applet.appletId].push(act);
              } else if (selectedApplets[applet.appletId][actIndex].items) {
                selectedApplets[applet.appletId][actIndex].items.push(selectedItem.itemId);

                if (selectedApplets[applet.appletId][actIndex].items.length === activity.children.length) {
                  selectedApplets[applet.appletId][actIndex].items = null;
                }
              }
            }
          });
        });
      });

      this.selectedApplets = { ...selectedApplets };
    },
    onSearchText () {

    }
  },
};
</script>
