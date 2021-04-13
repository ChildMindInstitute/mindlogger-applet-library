<template>
  <div v-show="!isLoading">
    <div class="d-flex justify-center align-content-ceneter">
      <v-text-field
        v-model="searchText"
        @input="onSearchText"
        light
        solo
        prepend-inner-icon="search"
        placeholder="Type keyword...">
      </v-text-field>

      <v-btn
        rounded
        color="primary"
        class="ml-2"
        height="50"
        dark
      >
        <div class="py-2">
          Add to 
          <br/> 
          Applet Builder
          <v-icon small>
            mdi-chevron-right
          </v-icon>
        </div>
      </v-btn>
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
            :src="applet.image"
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
              :class="searchText === keyword ? 'font-weight-bold' : ''"
              @click="searchText = keyword"
            >
              {{ keyword }}
            </v-btn>
          </v-card-actions>

          <div class="ds-tree-layout ml-2">
            <v-treeview
              class="ds-tree-view"
              v-model="selection[applet.appletId]"
              :items="appletsTree.filter(({ appletId }) => appletId === applet.appletId)"
              selection-type="leaf"
              selected-color="darkgrey"
              on-icon="mdi-checkbox-marked-circle-outline"
              off-icon="mdi-checkbox-blank-circle-outline"
              indeterminate-icon="mdi-minus-circle-outline"
              @input="onAppletSelection(applet.appletId)"
              open-on-click
              selectable
              return-object
            >
              <template v-slot:prepend="{ item }">
                  <v-icon 
                    v-if="item.selected === true && item.options"
                    class="mr-1"
                    color="dark-grey"
                    @click="item.selected = !item.selected"
                  >
                    mdi-menu-down
                  </v-icon>
                  <v-icon 
                    v-if="item.selected === false && item.options"
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
        </div>
        <div class="d-flex align-baseline">
          <v-btn
            class="mx-8 mt-2"
            fab
            small
            @click="onDeleteApplet(applet.appletId)"
          >
            <v-icon color="grey darken-3" >
              mdi-trash-can-outline
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

.ds-tree-view, .ds-tree-layout {
  width: 100%
}

.ds-cursor{
  cursor: pointer;
}

</style>

<script>
import api from "../services/Api/api.vue";

export default {
  name: 'ViewBasket',
  components: {

  },
  data() {
    return {
      searchText: "",
      isLoading: true,
      selectedApplets: {},
      appletsTree: [],
      baskets: [],
      basketContents: [],
      selection: [],
      treeIndex: 1,
    };
  },
  async beforeMount() {
    try {
      this.isLoading = true;
      const publishedApplets = (await api.getPublishedApplets({
        apiHost: this.$store.state.backend,
      })).data;
      const basketApplets = (await api.getBasketContent({
        apiHost: this.$store.state.backend,
        token: this.$store.state.auth.authToken.token,
      })).data;

      this.basketContents = Object.keys(basketApplets).map((appletId) => {
        return publishedApplets.find((applet) => appletId === applet.appletId);
      });
      this.appletsTree = Object.keys(basketApplets).map((appletId) => {
        return this.buildAppletTree(basketApplets[appletId]);
      });

      this.$store.commit("setPublishedApplets", publishedApplets);
      this.isLoading = false;
    } catch(err) {
      console.log(err);
    }
  },
  methods: {
    publishedApplets() {
      if (this.searchText) {
        return this.basketContents.filter((applet, index, self) => {
          let isValid = false;
          applet.keywords.forEach(keyword => {
            if (keyword.toLowerCase() === this.searchText.toLowerCase()) {
              isValid = true;
            }
          });

          return isValid;
        });
      } else {
        return this.basketContents;
      }
    },
    onDeleteApplet (appletId) {
      // const form = new FormData();

      // form.set("basket", JSON.stringify(this.selectedApplets[appletId]));
      api.deleteBasketApplet({
        apiHost: this.$store.state.backend,
        token: this.$store.state.auth.authToken.token,
        appletId,
        // data: form,
      }).then(() => {
        this.basketContents = this.basketContents.filter((applet) => applet.appletId !== appletId);
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
        id: this.treeIndex,
        appletId: applet._id.substring(7),
        name: applet.displayName,
        children: [],
      };

      this.treeIndex += 1;

      for (const activityId in activities) {
        const activityItem = {
          id: this.treeIndex,
          activityId,
          name: activities[activityId]["@id"],
          children: [],
        };

        this.treeIndex += 1;
        for (const itemId in items) {
          const values = itemId.split('/');

          if (activityId === values[0]) {
            const item = {
              id: this.treeIndex,
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

            this.treeIndex += 1;
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
    onAppletSelection(appletId) {
      const selectedApplet = {};

      this.selection[appletId].forEach(({ id }) => {
        this.appletsTree.forEach(applet => {
          applet.children.forEach(activity => {
            const selectedItem = activity.children.find(item => item.id === id);

            if (selectedItem) {
              const actIndex = selectedApplet.findIndex(({ activityId }) => activity.activityId);

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
                selectedApplet.push(act);
              } else if (selectedApplet[actIndex].items) {
                selectedApplet[actIndex].items.push(selectedItem.itemId);

                if (selectedApplet[actIndex].items.length === activity.children.length) {
                  selectedApplet[actIndex].items = null;
                }
              }
            }
          });
        });
      });

      this.selectedApplets = { ...selectedApplets };
    },
    onSearchText () {

    },
    onViewBasket () {
      this.$router.push({
        name: 'ViewBasket',
      });
    },
  },
};
</script>
