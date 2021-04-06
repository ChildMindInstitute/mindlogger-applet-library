<template>
  <div v-if="!isLoading">
    <div class="mt-0">
      <v-card 
        class="ma-8 d-flex pa-md-2"
      >
        <div class="text-center">
          <v-img
            v-if="applet.image"
            class="ma-2 ds-avatar"
            src="https://cdn.vuetifyjs.com/images/cards/sunshine.jpg"
            max-width="200px"
            height="200px"
          />

          <v-avatar
            v-else
            tile
            class="ma-2 ds-avatar"
            color="blue"
            size="200"
          >
            <span class="white--text text-h3">
              {{ applet.name[0] }}
            </span>
          </v-avatar>
        </div>
        <div class="ds-tree-layout ml-4">
          <v-card-title class="text-h6">
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
            <div 
              class="text-body-1 text-decoration-underline primary--text font-weight-medium ds-contribution"
              @click="onViewContribution"
            >
              View All Contributions
            </div>
          </v-expand-transition>
        </div>
      </v-card>

      <v-card 
        class="ma-8 d-flex pa-md-2"
      >
        <div class="ds-tree-layout ml-2">
          <v-expand-transition>
            <v-treeview
              class="d-flex justify-start ds-tree-view"
              v-model="selection"
              :items="appletTree"
              selection-type="leaf"
              color="primary"
              selected-color="grey"
              on-icon="mdi-checkbox-marked-circle-outline"
              off-icon="mdi-checkbox-blank-circle-outline"
              indeterminate-icon="mdi-minus-circle-outline"
              @input="onAppletSelection"
              selectable
              return-object
            >
            </v-treeview>
          </v-expand-transition>
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

.ds-contribution {
  margin-left: 28px;
  position: absolute;
  bottom: 20px;

  cursor: pointer;
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
  name: 'AppletDetail',
  components: {

  },
  data() {
    return {
      applet: {},
      isLoading: true,
      selectedApplets: {},
      appletTree: [],
      baskets: [],
      selection: [],
    };
  },
  async beforeMount() {
    const { appletId } = this.$route.params;

    try {
      const publishedApplets = (await api.getPublishedApplets({
        apiHost: this.$store.state.backend,
      })).data;

      this.applet = publishedApplets.find(({ id }) => id === appletId);
    } catch (error) {
      console.log(error);
    }

    try {
      const response = await api.getAppletContent({
        apiHost: this.$store.state.backend,
        libraryId: this.$route.params.appletId,
      });

      this.buildAppletTree(response.data);
      this.isLoading = false;
    } catch (error) {
      console.log(error)
    }

  },
  methods: {
    publishedApplets() {
      if (this.searchText) {
        return this.$store.state.publishedApplets.forEach(applet => {
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
    onViewContribution () {
      console.log('000000');
    },
    buildAppletTree (appletData) {
      const { items, activities, applet } = appletData;
      const treeItem = [];

      let index = 1;
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

        treeItem.push(activityItem);
      }

      this.appletTree = [ ...treeItem ];
    },
    /*
     * Change appletTreeData format to basket data 
     */
    onAppletSelection() {
      const selectedApplets = {};

      // this.selection.forEach(({ id }) => {
      //   this.appletsTree.forEach(applet => {
      //     applet.children.forEach(activity => {
      //       const selectedItem = activity.children.find(item => item.id === id);

      //       if (selectedItem) {
      //         if (!selectedApplets[applet.appletId]) {
      //           selectedApplets[applet.appletId] = [];
      //         }

      //         const actIndex = selectedApplets[applet.appletId].findIndex(({ activityId }) => activity.activityId);

      //         if (actIndex === -1) {
      //           const act = {
      //             activityId: activity.activityId,
      //           };

      //           if (activity.children.length === 1) {
      //             act.items = null;
      //           } else {
      //             act.items = [];
      //             act.items.push(selectedItem.itemId);
      //           }
      //           selectedApplets[applet.appletId].push(act);
      //         } else if (selectedApplets[applet.appletId][actIndex].items) {
      //           selectedApplets[applet.appletId][actIndex].items.push(selectedItem.itemId);

      //           if (selectedApplets[applet.appletId][actIndex].items.length === activity.children.length) {
      //             selectedApplets[applet.appletId][actIndex].items = null;
      //           }
      //         }
      //       }
      //     });
      //   });
      // });

      // this.selectedApplets = { ...selectedApplets };
    },
  },
};
</script>
