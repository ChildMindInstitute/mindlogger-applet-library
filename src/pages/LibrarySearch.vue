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
        <v-icon 
          color="blue-grey darken-3" 
          class="mx-4 mb-6 ds-cursor"
          large 
          :disabled="!isLoggedIn"
          @click="onViewBasket"
        >
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
        <v-icon 
          color="blue-grey darken-3" 
          class="mx-4 mb-6 ds-cursor"
          large 
          :disabled="!isLoggedIn"
          @click="onViewBasket"
        >
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
            class="mx-2 mt-2"
            fab
            small
            @click="onAddBasket(applet.appletId)"
            :disabled="!selectedApplets[applet.appletId] || !isLoggedIn"
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
      treeIndex: 1,
    };
  },
  async beforeMount() {
    try {
      this.isLoading = true;
      const publishedApplets = (await api.getPublishedApplets({
        apiHost: this.$store.state.backend,
      })).data;

      console.log('publishedapplets', publishedApplets);

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
  /**
   * Define here all computed properties.
   */
  computed: {
    isLoggedIn() {
      return !_.isEmpty(this.$store.state.auth);
    },
  },
  methods: {
    publishedApplets() {
      console.log('search text', this.searchText);
      if (this.searchText) {
        return this.$store.state.publishedApplets.filter((applet) => {
          let isValid = false;
          applet.keywords.forEach(keyword => {
            if (keyword.toLowerCase() === this.searchText.toLowerCase()) {
              isValid = true;
            }
          });

          return isValid;
        });
      } else {
        return this.$store.state.publishedApplets;
      }
    },
    onAddBasket (appletId) {
      const form = new FormData();

      form.set("selection", JSON.stringify(this.selectedApplets[appletId]));
      api.updateAppletBasket({
        apiHost: this.$store.state.backend,
        token: this.$store.state.auth.authToken.token,
        appletId,
        selection: form,
      }).then(() => {
        if (!this.baskets.includes(appletId)) {
          this.baskets.push(appletId);
        }
      });
    },
    onAppletDetail(applet) {
      console.log('applet', applet)
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
      const selectedApplet = [];

      this.selection[appletId].forEach(({ id }) => {
        this.appletsTree.forEach(applet => {
          applet.children.forEach(activity => {
            const selectedItem = activity.children.find(item => item.id === id);

            if (selectedItem) {
              const actIndex = selectedApplet.findIndex(({ activityId }) => activityId === activity.activityId);

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

      this.selectedApplets = { 
        ...this.selectedApplets,
        [appletId]: [...selectedApplet]
      };
    },
    onSearchText () {

    },
    onViewBasket () {
      // console.log('router', this.$router.history)
      this.$router.push({
        name: 'ViewBasket',
      });
    },
  },
};
</script>
