import { defineStore } from "pinia";
import { useApi } from "@/composables/useApi";

// params zavise od tipa, npr. APPROVED ima leave_type_name i datume
// ime osobe stiže samo gdje ima smisla, ime tima nikad
const personName = (params) =>
  params.employee_name ??
  params.requester_name ??
  params.user_name ??
  params.delegator_name ??
  [params.first_name, params.last_name].filter(Boolean).join(" ");

const toNotification = (notification) => {
  const params = notification.details?.params ?? notification.details ?? {};

  return {
    id: notification.id,
    type: notification.type,
    entity_id: notification.entity_id,
    name: personName(params),
    // naziv iz backenda, prevodi se pri prikazu (NotificationsMenu)
    leave_type_name: params.leave_type_name ?? params.leave_type ?? null,
    start_date: params.start_date ?? null,
    end_date: params.end_date ?? null,
    rejection_reason: params.rejection_reason ?? "",
    policy_version: params.version ?? null,
    effective_from: params.effective_from ?? null,
    is_read: Boolean(notification.read_at),
    created_at: notification.created_at
  };
};

const PAGE_SIZE = 20;

export const useNotificationsStore = defineStore("notifications", {
  state: () => ({
    notifications: [],
    unread_count: 0,
    is_loading: false,
    error: null
  }),

  actions: {
    // 20.1 getAllNotifications
    async fetchNotifications() {
      const { get } = useApi();

      this.is_loading = true;
      this.error = null;

      try {
        const { data, error } = await get("notification/getAllNotifications", {
          auth: true,
          filters: { page: { value: 1 }, page_size: { value: PAGE_SIZE } }
        });

        if (error) {
          this.error = error;
          return error;
        }

        this.notifications = (data?.data?.data?.notifications ?? []).map(toNotification);
      } finally {
        this.is_loading = false;
      }
    },

    // 20.4 getUnreadCount
    async fetchUnreadCount() {
      const { get } = useApi();

      const { data, error } = await get("notification/getUnreadCount", { auth: true });

      if (error) return error;

      this.unread_count = data?.data?.data?.total_count ?? 0;
    },

    // 20.2 markAsRead
    async markAsRead(id) {
      const notification = this.notifications.find((item) => item.id === id);

      if (!notification || notification.is_read) return;

      notification.is_read = true;
      this.unread_count = Math.max(0, this.unread_count - 1);

      const { patch } = useApi();
      const { error } = await patch(`notification/markAsRead/${id}`, null, { auth: true });

      if (error) {
        notification.is_read = false;
        this.unread_count += 1;
        return error;
      }
    },

    // 20.3 markAllAsRead
    async markAllAsRead() {
      const { patch } = useApi();

      const { error } = await patch("notification/markAllAsRead", null, { auth: true });

      if (error) return error;

      this.notifications.forEach((notification) => (notification.is_read = true));
      this.unread_count = 0;
    }
  }
});
