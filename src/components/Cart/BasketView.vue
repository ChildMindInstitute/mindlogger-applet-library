<template>
  <div v-if="!isLoading">
    <div class="d-flex justify-center align-content-ceneter">
      <v-text-field
        v-model="searchText"
        light
        solo
        prepend-inner-icon="search"
        placeholder="Type keyword..."
      >
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
          <br />
          Applet Builder
          <v-icon small> mdi-chevron-right </v-icon>
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
          <v-icon small> mdi-chevron-left </v-icon>
          Back to Builder
        </div>
      </v-btn>
    </div>

    <div class="mt-0">
      <h3 class="mb-4 ml-8" v-if="!cartApplets.length">
        You have not added anything to your basket yet. Start searching above.
      </h3>
      <template v-else>
        <h3 class="mb-4 ml-8" v-if="!filteredApplets.length">
          No results found
        </h3>
        <v-card
          v-else
          class="mx-auto mb-4 d-flex pa-md-2"
          v-for="applet in filteredApplets"
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

            <v-avatar v-else tile class="ma-2 ds-avatar" color="blue" size="150">
              <span class="white--text text-h3">
                {{ applet.name[0] }}
              </span>
            </v-avatar>
          </div>
          <div class="ds-main-layout ml-2">
            <v-card-title
              class="text-decoration-underline text-h6"
              v-html="highlight(applet.name)"
            />
            <v-card-subtitle
              v-if="applet.description"
              class="mx-6 black--text text-body-1 ds-subtitle"
              v-html="highlight(applet.description)"
            />

            <v-card-actions class="mx-5 px-2 py-0">
              <span v-if="applet.keywords.length" class="text-body-1">
                Keywords:
              </span>
              <v-btn
                v-for="keyword in applet.keywords"
                :key="keyword"
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
                v-model="cartSelections[applet.appletId]"
                :items="appletsTree[applet.appletId] && [appletsTree[applet.appletId]]"
                @input="updateCart(applet)"
                selection-type="leaf"
                selected-color="darkgrey"
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
                    v-else-if="item.selected === false"
                    class="mr-1"
                    color="dark-grey"
                    @click="item.selected = !item.selected"
                  >
                    mdi-menu-right
                  </v-icon>
                </template>
                <template v-slot:append="{ item }">
                  <span v-html="highlight(getItemtitle(item.title))" />
                  <template v-if="item.selected === true">
                    <div v-if="item.inputType === 'radio' || item.inputType === 'checkbox'">
                      <div
                        v-for="option in item.options"
                        :key="option.name"
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
                    </div>
                    <div v-else class="d-flex align-center pt-2">
                      <img
                        class="mr-2"
                        width="15"
                        :src="itemTypes.find(({ text }) => text === item.inputType).icon"
                      />
                      {{ item.inputType }}
                    </div>
                  </template>
                </template>
              </v-treeview>
            </div>
          </div>
          <div class="d-flex align-baseline">
            <v-btn
              class="mx-8 mt-2"
              fab
              small
              @click="onDeleteApplet(applet)"
            >
              <v-icon color="grey darken-3"> mdi-trash-can-outline </v-icon>
            </v-btn>
          </div>
        </v-card>
      </template>
    </div>
    <v-dialog v-if="deleteApplet" v-model="deleteBasketItemDialog" persistent max-width="800">
      <v-card>
        <v-card-title class="headline"> Delete Applet </v-card-title>
        <v-card-text>
          Are you sure you want to delete
          <b>{{ deleteApplet.name }}</b> from your basket?
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="primary darken-1" text @click="onDeleteAppletFromBasket">
            Yes
          </v-btn>
          <v-btn color="primary darken-1" text @click="onCancelConfirmation">
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

.ds-cursor {
  cursor: pointer;
}
</style>

<script>
import { mapState } from "vuex";
import { AppletMixin } from "../../services/mixins/AppletMixin";

export default {
  name: "BasketView",
  mixins: [AppletMixin],
  data() {
    return {
      searchText: "",
      deleteBasketItemDialog: false,
      isLoading: true,
      deleteApplet: null,
      cachedSelection: []
    };
  },
  computed: {
    ...mapState([
      "fromBuilder",
      "itemTypes",
      "appletsTree",
      "cartApplets",
      "cartSelections"
    ]),
    filteredApplets() {
      return this.getFilteredApplets(
        this.cartApplets,
        this.appletsTree,
        this.searchText
      );
    }
  },
  async beforeMount() {
    try {
      this.isLoading = true;

      await this.fetchBasketApplets();
      this.isLoading = false;
    } catch (err) {
      console.log(err);
    }
  },
  methods: {
    async updateCart(applet) {
      const { appletId } = applet
      if (!this.cartSelections[appletId].length) {
        this.onDeleteApplet(applet);
      } else {
        this.cacheSelection = [...this.cartSelections[appletId]];
        await this.updateAppletBasket(
          appletId,
          this.appletsTree[appletId],
          this.cartSelections[appletId]
        );
        this.fetchBasketApplets();
      }
    },
    onDeleteApplet(applet) {
      this.deleteApplet = applet;
      this.deleteBasketItemDialog = true;
    },
    onCancelConfirmation() {
      this.deleteBasketItemDialog = false;

      if (this.deleteApplet) {
        this.$store.commit("setCartSelections", {
          ...this.cartSelections,
          [this.deleteApplet.appletId]: [...this.cacheSelection]
        });
        this.deleteApplet = null;
      }
    },
    async onDeleteAppletFromBasket() {
      this.deleteBasketItemDialog = false;
      await this.deleteBasketApplet(this.deleteApplet.appletId);
      await this.fetchBasketApplets();
      this.deleteApplet = null;
    },
    onAppletDetail(applet) {
      this.$router.push({
        name: "AppletDetail",
        params: { appletId: applet.id }
      });
    }
  }
};
</script>
