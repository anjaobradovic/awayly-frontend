import { useAuthStore } from "@/stores/auth";
import router from "@/router";
import { API_BASE_URL } from "@/config";

// const handleGlobalError = (error, { skip_auth_redirect = false } = {}) => {
//   if (error?.code?.startsWith('5')) {
//     snackbar.error('An error occurred. Try again.')
//     return true
//   }
//   if (!skip_auth_redirect && error?.code?.startsWith('401')) {
//     const auth = useAuthStore()
//     if (auth.token) {
//       auth.token = null
//       router.push('/login')
//     }
//   }
//   return false
// }

export const useApi = () => {
  const getBaseUrl = () => API_BASE_URL;

  const base_url = getBaseUrl();

  // search params za url
  const buildUrl = (endpoint, filters = null) => {
    const url = new URL(`${base_url}${endpoint}`);

    if (!filters) return url.toString();

    const getFilterValue = (filter) => {
      const { value } = filter;
      if (value === null || value === "") return null;
      if (Array.isArray(value) && value.length)
        return value.map((item) => item?.value ?? item).join(",");
      if (typeof value === "object") return value?.id ?? value?.value ?? null;
      return value;
    };

    Object.entries(filters)
      .filter(([_, filter]) => filter.value != null && filter.value !== "")
      .forEach(([key, filter]) => {
        const value = getFilterValue(filter);
        if (value !== null && value !== "") url.searchParams.append(key, value);
      });
    return url.toString();
  };

  // headeri
  const buildHeaders = (customHeaders = {}, requiresAuth = false, isFormData = false) => {
    const headers = {};

    if (requiresAuth) {
      if (typeof requiresAuth === "string") {
        headers["Authorization"] = `Bearer ${requiresAuth}`;
      } else {
        const store = useAuthStore();
        headers["Authorization"] = `Bearer ${store.token}`;
      }
    }

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
      Object.assign(headers, customHeaders);
    }

    return headers;
  };

  // generička funkcija za request
  const request = async (endpoint, options = {}) => {
    const {
      method = "GET",
      body = null,
      filters = null,
      error_type = null, // 'notify', 'text'
      skip_auth_redirect = false,
      auth: requires_auth = false,
      headers: customHeaders = {},
      responseType = "json",
      signal = null
    } = options;

    const url = buildUrl(endpoint, filters);

    // HTTP status vraćamo uz grešku
    let status = null;

    try {
      const isFormData = body instanceof FormData;

      const fetch_options = {
        method,
        headers: buildHeaders(customHeaders, requires_auth, isFormData)
      };

      if (signal) fetch_options.signal = signal;

      if (body) fetch_options.body = isFormData ? body : JSON.stringify(body);

      const response = await fetch(url, fetch_options);
      status = response.status;
      let data;
      if (responseType === "blob") {
        data = await response.blob();
      } else if (responseType === "text") {
        data = await response.text();
      } else {
        const content_type = response.headers.get("content-type");
        if (content_type && content_type.includes("application/json")) {
          data = await response.json();
        } else {
          data = await response.blob();
        }
      }

      if (!response.ok) throw data;

      if (typeof data === "object" && "error" in data) throw data.error;

      return { data: data, error: null, status };
    } catch (err) {
      if (err?.name === "AbortError") return { data: null, error: null, aborted: true };

      if (import.meta.env.DEV) console.error(err);

      // const normalized = normalizeError(err)
      // const handled = handleGlobalError(normalized, { skip_auth_redirect })
      // if (!handled && error_type === 'notify') {
      //   snackbar.error(resolveErrorMessage(normalized))
      // }
      // return { data: null, error: normalized }
      return { data: null, error: err, status };
    }
  };

  // metode
  const get = (endpoint, options) => request(endpoint, { ...options, method: "GET" });
  const post = (endpoint, body, options) => request(endpoint, { ...options, method: "POST", body });
  const put = (endpoint, body, options) => request(endpoint, { ...options, method: "PUT", body });
  const patch = (endpoint, body, options) =>
    request(endpoint, { ...options, method: "PATCH", body });
  const del = (endpoint, options) => request(endpoint, { ...options, method: "DELETE" });

  return { request, get, post, put, patch, del, buildUrl };
};
