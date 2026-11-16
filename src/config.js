// podešavanja aplikacije na jednom mjestu

export const APP_NAME = "Awayly";
export const APP_VERSION = "1.0";

// bez VITE_API_BASE_URL aplikacija gađa lažni /api/v1/ na istom domenu
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || `${window.location.origin}/api/v1/`;

// mock je uključen dok backend ne postoji, isključuje se sa VITE_USE_MOCKS=false
export const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== "false";
