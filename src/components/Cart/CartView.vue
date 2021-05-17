<template>
  <div>
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
        @click="$emit('addToBasket')"
        :disabled="this.cartApplets.length == 0"
      >
        <div class="py-2">
          Add to
          <br />
          Applet Builder
          <v-icon small> mdi-chevron-right </v-icon>
        </div>
      </v-btn>
    </div>

    <div class="mt-0">
      <span v-if="cartApplets.length === 0">
        You have not added anything to your cart yet. Start searching above.
      </span>
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
          >
            <span v-html="highlight(applet.description)" />
          </v-card-subtitle>

          <v-card-actions class="mx-5 px-2 py-0">
            <span v-if="applet.keywords.length" class="text-body-1">
              Keywords:
            </span>
            <v-btn
              v-for="keyword in applet.keywords"
              :key="keyword"
              color="orange lighten-2"
              text
              :class="searchText === keyword ? 'font-weight-bold' : ''"
              @click="searchText = keyword"
            >
              <span v-html="highlight(keyword)" />
            </v-btn>
          </v-card-actions>

          <div class="ds-tree-layout ml-2">
            <v-treeview
              class="ds-tree-view"
              v-model="cartSelections[applet.appletId]"
              :items="[appletsTree[applet.appletId]]"
              selection-type="leaf"
              selected-color="darkgrey"
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
                <span v-html="highlight(item.title)" />
                <template v-if="item.selected === true && (item.inputType === 'radio' || item.inputType === 'checkbox')">
                  <div
                    v-for="option in item.options"
                    :key="option"
                    class="d-flex align-center pt-2"
                  >
                    <v-icon
                      v-if="item.inputType === 'checkbox'"
                      class="mr-1"
                      color="dark-grey"
                    >
                      mdi-checkbox-marked-outline
                    </v-icon>
                    <v-icon v-else class="mr-1" color="dark-grey">
                      mdi-radiobox-marked
                    </v-icon>
                    <v-img
                      v-if="option.image"
                      class="ds-avatar mr-2"
                      :src="option.image"
                      max-width="27px"
                      height="27px"
                    />
                    {{ option.name }}
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
            @click="onDeleteApplet(applet.appletId)"
          >
            <v-icon color="grey darken-3"> mdi-trash-can-outline </v-icon>
          </v-btn>
        </div>
      </v-card>
    </div>

    <ConfirmationDialog
      v-model="deleteCartItemDialog"
      :dialogText="
        $t('deleteAppletFromCartConfirmation', {
          appletName: deleteAppletId
            ? appletContents[deleteAppletId].applet.displayName
            : ''
        })
      "
      :title="$t('deleteApplet')"
      @onOK="deleteAppletFromCart"
    />
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

.v-treeview-node__label {
  max-width: 600px;
}

.ds-cursor {
  cursor: pointer;
}

#login-wrapper {
  position: absolute;
  z-index: 1;
  top: 0;
  left: 0;
}
</style>

<script>
import { mapState } from "vuex";
import LoginForm from "../Login/LoginForm.vue";
import { AppletMixin } from "../../services/mixins/AppletMixin";
import ConfirmationDialog from "../dialogs/ConfirmationDialog";

export default {
  name: "CartView",
  mixins: [AppletMixin],
  components: {
    ConfirmationDialog,
    LoginForm
  },
  data() {
    return {
      searchText: "",
      selectedApplets: {},
      selection: [],
      deleteCartItemDialog: false,
      deleteAppletId: null,
      showLoginForm: false
    };
  },
  computed: {
    ...mapState([
      "publishedApplets",
      "appletContents",
      "appletsTree",
      "cartSelections"
    ]),
    cartApplets() {
      return this.publishedApplets.filter(
        applet => this.cartSelections[applet.appletId]
      );
    },
    filteredApplets() {
      return this.getFilteredApplets(
        this.cartApplets,
        this.appletsTree,
        this.searchText
      );
    }
  },
  methods: {
    highlight(rawString) {
      if (this.searchText) {
        const searchRegex = new RegExp("(" + this.searchText + ")", "ig");

        return rawString
          .replace(searchRegex, "<b>$1</b>")
          .replaceAll(" ", "&nbsp;");
      } else {
        return rawString;
      }
    },
    onDeleteApplet(appletId) {
      this.deleteAppletId = appletId;
      this.deleteCartItemDialog = true;
    },
    deleteAppletFromCart() {
      this.deleteCartItemDialog = false;
      const newCartSelections = {};
      this.cartApplets.map(({ appletId }) => {
        if (appletId != this.deleteAppletId) {
          newCartSelections[appletId] = this.cartSelections[appletId];
        }
      });
      this.$store.commit("setCartSelections", newCartSelections);
    }
  }
};
</script>
