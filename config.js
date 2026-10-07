// ============================================================
// Revizy — Configuration Centrale de l'Application
// Centralise toutes les clés d'API et URLs sans code en dur
// ============================================================
window.REVIZY_CONFIG = {
  // Base de données Supabase
  SUPABASE_URL: "https://wvbpiqchgwyeqyzuxtpp.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_VWHn1X2kqZmlBRdcm-7GHw_0NFLwV3D",

  // Passerelle de paiement FedaPay (Bénin Mobile Money : MTN & Moov)
  FEDAPAY_PUBLIC_KEY: "pk_live_f9-BhipsvocdGhiSS2CxeyBA",

  // API Backend (Assistant IA & Chatbot)
  API_BASE_URL: (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://localhost:5000/v1"
    : "https://revisy.onrender.com/v1",

  // Limite de sécurité sur le nombre d'administrateurs
  MAX_ADMINS: 2
};