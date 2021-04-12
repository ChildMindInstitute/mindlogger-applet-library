<template>
  <div v-if="!isLoading">
    <div class="mt-0">
      <v-card 
        class="mx-8 my-6 d-flex pa-md-2"
      >
        <div class="text-center">
          <v-img
            v-if="applet.image"
            class="ma-2 ds-avatar"
            :src="applet.image"
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

          <v-card-subtitle 
            v-if="applet.description"
            class="mx-6 black--text text-body-1 ds-subtitle"
          >
            Applet Version: {{ applet.version }}
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
        v-if="selectBasket"
        class="mx-8 my-2 d-flex py-md-2 px-md-8 align-center"
      >
        <div 
          class="text-body-1 text-decoration-underline primary--text font-weight-medium ds-pointer"
          @click="onSelectAll"
        >
          Select All
        </div>
        <div 
          class="text-body-1 text-decoration-underline primary--text font-weight-medium ds-pointer ml-4"
          @click="onClearTree"
        >
          Cancel
        </div>
        <div 
          class="text-body-2 black--text ds-pointer ml-10"
          @click="onViewContribution"
        >
          <div> Status: {{ activities }} / {{ items }} selected </div>
        </div>
        <div 
          class="text-body-1 primary--text font-weight-medium ds-pointer ml-4"
          @click="onUpdateBasket"
        >
          <v-icon color="primary" large>
            mdi-basket-fill
          </v-icon>
        </div>
      </v-card>

      <v-card 
        class="mx-8 d-flex pa-md-2"
      >
        <div class="ds-tree-layout ml-2">
          <v-treeview
            class="ds-tree-view"
            v-model="selection"
            :items="appletTree"
            selection-type="leaf"
            color="primary"
            selected-color="grey"
            on-icon="mdi-checkbox-marked-circle-outline"
            off-icon="mdi-checkbox-blank-circle-outline"
            indeterminate-icon="mdi-minus-circle-outline"
            @input="onAppletSelection"
            :selectable="selectable"
            return-object
          >
            <template v-slot:prepend="{ item }">
                <v-icon 
                  v-if="item.selected === true"
                  class="mr-1"
                  color="dark-grey"
                  @click="item.selected = !item.selected"
                >
                  mdi-menu-down
                </v-icon>
                <v-icon 
                  v-if="item.selected === false"
                  class="mr-1"
                  color="dark-grey" 
                  @click="item.selected = !item.selected"
                >
                  mdi-menu-right
                </v-icon>
            </template>
            <template v-slot:append="{ item }">
              <div 
                v-if="item.selected === true && (item.inputType === 'radio' || item.inputType === 'checkbox')" 
                v-for="option in item.options"
                class="d-flex align-center pt-2"
              >
                <v-icon 
                  v-if="item.inputType === 'checkbox'"
                  class="mr-1"
                  color="dark-grey" 
                >
                  mdi-checkbox-marked-outline
                </v-icon>
                <v-icon 
                  v-else 
                  class="mr-1"
                  color="dark-grey" 
                >
                  mdi-checkbox-intermediate
                </v-icon>
                <v-img
                  class="ds-avatar mr-2"
                  src="https://raw.githubusercontent.com/ChildMindInstitute/NIMH_EMA_applet/master/images/1F969.png"
                  max-width="27px"
                  height="27px"
                />
                {{ option.name }}
              </div>
            </template>
          </v-treeview>
        </div>
      </v-card>

      <v-btn
        class="ds-basket"
        color="primary"
        fab
        :disabled="selectBasket"
        @click="onCloseBasketStatus"
      >
        <v-icon color="white" medium>
          mdi-basket-plus-outline
        </v-icon>
      </v-btn>
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

.ds-pointer{
  cursor: pointer;
}

.ds-basket {
  position: absolute !important;
  bottom: 50px;
  right: 50px;
}

.v-treeview-node__root {
  align-items: start !important;
  justify-content: start !important;
  padding-top: 4px;
  padding-bottom: 4px !important;
  min-height: 0 !important;
}

.v-treeview-node__prepend {
  position: absolute;
  left: 30px;
  margin-top: -1px;
}

.v-treeview-node {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}

.v-treeview-node__content {
  align-items: baseline !important;
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
      selectedActs: {},
      appletTree: [],
      baskets: [],
      selection: [],
      selectBasket: false,
      selectable: false,
      selectedActivities: 0,
      selectedItems: 0,
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
      this.applet.version = response.data.applet.version;
      this.isLoading = false;
    } catch (error) {
      console.log(error)
    }
  },
  computed: {
    activities () {
      if (this.selectedActivities === 1) {
        return this.selectedActivities + ' activity';
      } else {
        return this.selectedActivities + ' activities';
      }
    },
    items () {
      if (this.selectedItems === 1) {
        return this.selectedItems + ' item';
      } else {
        return this.selectedItems + ' items';
      }
    }
  },
  methods: {
    publishedApplets () {
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
    onSelectAll () {
      this.selection = [];

      for (const activity of this.appletTree) {
        this.selection.push(...activity.children);
      }
    },
    onClearTree () {
      this.selection = [];
      this.selectBasket = false;
      this.selectable = false;
    },
    onUpdateBasket () {
      const { appletId } = this.$route.params;
      const form = new FormData();

      form.set("selection", JSON.stringify(this.selectedActs));
      api.updateAppletBasket({
        apiHost: this.$store.state.backend,
        appletId,
        selection: form,
      }).then((response) => {
        console.log(response);
      });
    },
    onCloseBasketStatus () {
      this.selectBasket = true;
      this.selectable = true;
    },
    onViewContribution () {
      console.log('000000');
    },
    buildAppletTree (appletData) {
      let index = 1;
      const { items, activities, applet } = appletData;
      console.log('appletdata', appletData)
      const treeItem = [];

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
            console.log('items[itemId]', items[itemId]);
            const item = {
              id: index,
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

            index += 1;
            activityItem.children.push(item);
          }
        }
        treeItem.push(activityItem);
      }
      this.appletTree = [ ...treeItem ];
      console.log('this.appletTree', this.appletTree);
    },
    /*
     * Change appletTreeData format to basket data 
     */
    onAppletSelection() {
      const selectedActs = [];

      this.selectedItems = 0;
      this.selectedActivities = 0;
      this.selection.forEach(({ id }) => {
        this.appletTree.forEach(activity => {
          const selectedItem = activity.children.find(item => item.id === id);

          if (selectedItem) {
            const actIndex = selectedActs.findIndex(({ activityId }) => activityId === activity.activityId);

            if (actIndex === -1) {
              const act = {
                activityId: activity.activityId,
              };

              if (activity.children.length === 1) {
                act.items = null;
                this.selectedActivities += 1;
              } else {
                act.items = [];
                act.items.push(selectedItem.itemId);
                this.selectedItems += 1;
              }
              selectedActs.push(act);
            } else if (selectedActs[actIndex].items) {
              this.selectedItems += 1;
              selectedActs[actIndex].items.push(selectedItem.itemId);

              if (selectedActs[actIndex].items.length === activity.children.length) {
                selectedActs[actIndex].items = null;
                this.selectedActivities += 1;
                this.selectedItems -= activity.children.length;
              }
            }
          }
        });
      });

      this.selectedActs = selectedActs;
    },
  },
};
</script>
