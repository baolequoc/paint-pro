import { createRouter, createWebHashHistory, Router, RouteRecordRaw } from "vue-router";

import Index from "@/pages/Index.vue";

const routes: Array<RouteRecordRaw> = [
  {
    component: Index,
    path: "/",
    name: "index"
  },
];

const router: Router = createRouter({
  history: createWebHashHistory(),
  routes
});

router.afterEach((to) => {
  const baseTitle = "Paint App";

  if (to.name === "index") {
    document.title = baseTitle;
  } else {
    document.title = `${to.meta.title} | ${baseTitle}`;
  }
});

export default router;
