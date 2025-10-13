import { createRouter, createWebHistory } from "vue-router";

const PivotView = () => import("../views/PivotView.vue");

const routes = [
  {
    path: "/",
    redirect: "/pivot"
  },
  {
    path: "/pivot",
    name: "pivot",
    component: PivotView
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

export default router;


