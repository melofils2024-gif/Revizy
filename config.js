window.REVIZY_CONFIG = {
  API_BASE_URL: (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000/v1"
    : "https://revisy.onrender.com/v1",

  FEDAPAY_PUBLIC_KEY: "pk_live_f9-BhipsvocdGhiSS2CxeyBA",

  MAX_ADMINS: 2,

  SUPABASE_URL: "https://wvbpiqchgwyeqyzuxtpp.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_VWHn1X2kqZmlBRdcm-7GHw_0NFLwV3D"
};
