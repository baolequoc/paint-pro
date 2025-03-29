import { createApp } from "vue";
import { createPinia } from "pinia";
import "./style/index.css";

import App from "./App.vue";
import router from "@/lib/router";

const app = createApp(App).use(createPinia()).use(router);

app.mount("#app");
