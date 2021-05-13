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
        @click="$emit('addToBuilder')"
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
      <v-btn
        v-if="fromBuilder"
        outlined
        color="secondary"
        class="ml-2"
        height="50"
        dark
        @click="$emit('backToBuilder')"
      >
        <div class="py-2">
          <v-icon small>
            mdi-chevron-left
          </v-icon>
          Back to Builder
        </div>
      </v-btn>
    </div>

    <div class="mt-0">
      <span v-if="publishedApplets().length === 0">
        You have not added anything to your basket yet.
        Start searching above.
      </span>
      <v-card 
        class="mx-auto mb-4 d-flex pa-md-2"
        v-for="applet in publishedApplets()"
        :key="applet.id"  
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
        <div class="ds-main-layout ml-2">
          <v-card-title class="text-decoration-underline text-h6" v-html="highlight(applet.name)" />
          <v-card-subtitle 
            v-if="applet.description"
            class="mx-6 black--text text-body-1 ds-subtitle"
            v-html="highlight(applet.description)"
          />

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
              @click="searchText = keyword"
            >
              <span v-html="highlight(keyword)" />
            </v-btn>
          </v-card-actions>

          <div class="ds-tree-layout ml-2">
            <v-treeview
              class="ds-tree-view"
              v-model="selection[applet.appletId]"
              :items="appletsTree.filter(({ appletId }) => appletId === applet.appletId)"
              selection-type="leaf"
              selected-color="darkgrey"
              @input="onAppletSelection(applet.appletId)"
              open-on-click
              selectable
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
                <span v-html="highlight(item.title)" />
                <div v-if="item.selected === true">
                  <div 
                    v-if="item.inputType === 'radio' || item.inputType === 'checkbox'"
                    v-for="option in item.options"
                    :key="option"
                    class="d-flex align-center pt-2"
                  >
                    <img
                      class="mr-2"
                      width="15"
                      :src="itemTypes.find(({ text }) => text === item.inputType).icon"
                    />
                    <v-img
                      v-if="option.image"
                      class="ds-avatar mr-2"
                      :src="option.image"
                      max-width="27px"
                      height="27px"
                    />
                    {{ option.name }}
                  </div>
                  <div 
                    v-if="item.inputType !== 'radio' || item.inputType !== 'checkbox'"
                    class="d-flex align-center pt-2"
                  >
                    <img
                      class="mr-2"
                      width="15"
                      :src="itemTypes.find(({ text }) => text === item.inputType).icon"
                    />
                    {{ item.inputType }}
                  </div>
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
            @click="deleteApplet = applet; dialog = true"
          >
            <v-icon color="grey darken-3" >
              mdi-trash-can-outline
            </v-icon>
          </v-btn>
        </div>
      </v-card>
    </div>
    <v-dialog
      v-if="deleteApplet"
      v-model="dialog"
      persistent
      max-width="800"
    >
      <v-card>
        <v-card-title class="headline">
          Delete Applet
        </v-card-title>
        <v-card-text class="mx-2">
          Are you sure you want to delete <b>{{ deleteApplet.name }}</b> from your basket?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary darken-1"
            text
            @click="onDeleteApplet()"
          >
            Yes
          </v-btn>
          <v-btn
            color="primary darken-1"
            text
            @click="dialog = false"
          >
            No
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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

.ds-cursor{
  cursor: pointer;
}
</style>

<script>
import api from "../../services/Api/api.vue";
import { mapState, mapGetters } from 'vuex';
import _ from "lodash";

export default {
  name: 'BasketView',
  data() {
    return {
      searchText: "",
      dialog: false,
      isLoading: true,
      deleteApplet: null,
      selectedApplets: {},
      appletsTree: [],
      baskets: [],
      basketContents: [],
      selection: [],
      treeIndex: 1,
    };
  },
  computed: {
    ...mapState([
      'fromBuilder'
    ]),
    ...mapGetters([
      'itemTypes',
    ]),
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

      Object.keys(basketApplets).forEach((appletId) => {
        const applet = publishedApplets.find((applet) => appletId === applet.appletId);

        if (applet) {
          this.basketContents.push(applet);
        }
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
    highlight (rawString) {
      if (this.searchText) {
        const searchRegex = new RegExp('(' + this.searchText + ')' , 'ig');

        return rawString
          .replace(searchRegex, '<b>$1</b>')
          .replaceAll(" ", "&nbsp;");
      } else {
        return rawString;
      }
    },
    publishedApplets() {
      if (this.searchText) {
        return this.basketContents.filter((applet) => {

          const regex = new RegExp(this.searchText, 'ig');
          const appletData = this.appletsTree.find(({ appletId }) => appletId === applet.appletId);
 
          if (applet.name.match(regex)
            || applet.description.match(regex)
            || appletData.title.match(regex)) {
            return true;
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

          return false;
        });
      } else {
        return this.basketContents;
      }
    },
    onDeleteApplet () {
      const { appletId } = this.deleteApplet;

      this.dialog = false;
      api.deleteBasketApplet({
        apiHost: this.$store.state.backend,
        token: this.$store.state.auth.authToken.token,
        appletId,
      }).then(() => {
        this.basketContents = this.basketContents.filter((applet) => applet.appletId !== appletId);
        this.$store.commit("setBasketContent", [...this.basketContents]);
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
        title: applet.displayName,
        children: [],
      };

      this.treeIndex += 1;

      for (const activityId in activities) {
        const activityItem = {
          id: this.treeIndex,
          activityId,
          title: activities[activityId]["@id"],
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
              title: items[itemId]["@id"]
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
  },
};
</script>
