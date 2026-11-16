import { createRouter, createWebHistory } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: { name: "login" }
    },
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/login/LoginView.vue")
    },
    {
      path: "/reset",
      name: "reset",
      component: () => import("@/views/reset/ResetView.vue")
    },
    {
      path: "/2fa",
      name: "two-factor",
      component: () => import("@/views/two-factor/TwoFactorView.vue"),
      meta: { requires_temporary_token: true }
    },
    {
      path: "/2fa/verify",
      name: "two-factor-verify",
      component: () => import("@/views/two-factor-verify/TwoFactorVerifyView.vue"),
      meta: { requires_temporary_token: true }
    },
    {
      path: "/2fa/backup-codes",
      name: "two-factor-backup-codes",
      component: () => import("@/views/backup-codes/BackupCodesView.vue"),
      meta: { requires_auth: true }
    },
    {
      // playground
      path: "/playground",
      component: () => import("@/layouts/main-layout/MainLayout.vue"),
      children: [
        {
          path: "",
          name: "playground",
          component: () => import("@/views/playground/PlaygroundView.vue")
        }
      ]
    },
    {
      path: "/abstances",
      component: () => import("@/layouts/main-layout/MainLayout.vue"),
      meta: { requires_auth: true },
      children: [
        {
          path: "calendar",
          name: "calendar",
          component: () => import("@/views/calendar/CalendarView.vue")
        },
        {
          path: "requests",
          name: "requests",
          component: () => import("@/views/requests/RequestsView.vue")
        },
        {
          path: "delegations",
          name: "delegations",
          component: () => import("@/views/delegations/DelegationsView.vue")
        },
        {
          path: "holidays",
          name: "holidays",
          component: () => import("@/views/holidays/HolidaysView.vue")
        },
        {
          path: "types",
          name: "absence-types",
          component: () => import("@/views/abstance-types/AbstanceTypesView.vue")
        }
      ]
    },
    {
      path: "/organization",
      component: () => import("@/layouts/main-layout/MainLayout.vue"),
      meta: { requires_auth: true },
      children: [
        {
          path: "employees",
          name: "employees",
          component: () => import("@/views/employees/EmployeesView.vue")
        },
        {
          path: "roles",
          name: "roles",
          component: () => import("@/views/roles/RolesView.vue")
        },
        {
          path:"teams",
          name: "teams",
          component: () => import("@/views/teams/TeamsView.vue")
        },
        {
          path: "hierarchy",
          name: "hierarchy",
          component: () => import("@/views/hierarchy/HierarchyView.vue")
        }
      ]
    },
    {
      path: "/settings",
      component: () => import("@/layouts/main-layout/MainLayout.vue"),
      meta: { requires_auth: true },
      children: [
        {
          path: "activity-log",
          name: "activity-log",
          component: () => import("@/views/activity-log/ActivityLogView.vue")
        },
        {
          path: "policies",
          name: "policies",
          component: () => import("@/views/policy/PolicyView.vue")
        },
        {
          path: "approval-chains",
          name: "approval-chains",
          component: () => import("@/views/approval-chains/ApprovalChainsView.vue")
        }
      ]
    },
    {

      path: "/reports",
      component: () => import("@/layouts/main-layout/MainLayout.vue"),
      meta: { requires_auth: true },
      children: [
        {
          path: "",
          name: "reports",
          component: () => import("@/views/reports/ReportsView.vue")
        }
      ]
    },
    {
      path: "/panel",
      component: () => import("@/layouts/main-layout/MainLayout.vue"),
      meta: { requires_auth: true },
      children: [
        {
          path: "team",
          name: "team-dashboard",
          component: () => import("@/views/dashboard/TeamDashboardView.vue")
        },
        {
          path: "company",
          name: "company-dashboard",
          component: () => import("@/views/dashboard/CompanyDashboardView.vue")
        }
      ]
    },
    {
      path: "/home",
      component: () => import("@/layouts/main-layout/MainLayout.vue"),
      meta: { requires_auth: true },
      children: [
        {
          path: "",
          name: "home",
          component: () => import("@/views/dashboard/PersonalDashboardView.vue")
        }
      ]
    }
  ]
});

router.beforeEach((to) => {
  // store se uzima UNUTAR guarda, jer tek tada Pinia sigurno postoji
  const auth_store = useAuthStore();

  // to.meta spaja meta roditelja i djeteta, pa /home pokriva i djecu
  if (to.meta.requires_auth && !auth_store.token) return { name: "login" };

  // 2FA ekrani imaju smisla samo odmah posle logina
  if (to.meta.requires_temporary_token && !auth_store.temporary_token) return { name: "login" };
});

export default router;
