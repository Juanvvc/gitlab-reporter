/*import Vue from 'vue'
import Vuetify from 'vuetify'
import 'vuetify/dist/vuetify.min.css' */
import '@mdi/font/css/materialdesignicons.css' // Ensure you are using css-loader
import Vue from 'vue'
import Vuetify from 'vuetify/lib'

Vue.use(Vuetify)

export default new Vuetify({
    icons: {
        iconfont: 'mdi', // default - only for display purposes
    },
    // Juanvi preferred theme: black and orange
    //theme: {
    //    light: { primary: "#344955", secondary: "#f9aa33", accent: "#FF7043", error: "#f44336", warning: "#FBC02D", info: "#2196f3", success: "#4caf50" }
    //    dark:  { primary: "#344955", secondary: "#f9aa33", accent: "#FF7043", error: "#f44336", warning: "#FBC02D", info: "#2196f3", success: "#4caf50" }
    //}
    // INCIDE's theme: corporative blue
    theme: {
      themes: {
        light: {primary: "#0288D1", secondary: "#FFC400", accent: "#FBC02D", error: "#f44336", warning: "#FFB300", info: "#2196f3", success: "#4caf50" },
        dark:  {primary: "#0288D1", secondary: "#FFC400", accent: "#FBC02D", error: "#f44336", warning: "#FFB300", info: "#2196f3", success: "#4caf50" }
      }
    }
})