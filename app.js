/* =============================================
   Health Station — app.js
   ระบบคัดกรองสุขภาพ สำหรับ อสม.
   =============================================

   ⚠️  สำคัญ: ต้องแก้ไข ENTRIES ให้ตรงกับ
       entry ID จริงของ Google Form ของคุณ
       วิธีหา entry ID → เปิดฟอร์มในเบราว์เซอร์
       คลิกขวา → Inspect → ค้นหา name="entry.XXXXXXX"
   ============================================= */

"use strict";

/* ─────────────────────────────────────────────
   1.  CONFIG — แก้ค่าตรงนี้ให้ตรงกับ Form จริง
   ───────────────────────────────────────────── */

const FORM_ID  = "1FAIpQLSfZHCIio6RmUMkyiq9kAb1sCivB8Xq3DNZmSRV6o5OlAlU-nA";
const FORM_URL = `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`;

// แมป field name → entry ID ของ Google Form
// ⚠️ ต้องตรวจสอบและแก้ไขให้ถูกต้องตาม Form จริง
const ENTRIES = {
  moo_section: "entry.917900553",   // อสม.หมู่ + หมวด (รวม)
  place:       "entry.1484377237",    // สถานที่ออกหน่วย
  date:        "entry.1280575033",    // วัน/เดือน/ปี
  name:        "entry.384027954",   // ชื่อ-นามสกุล
  pid:         "entry.1671062412",   // เลขบัตรประชาชน
  tel:         "entry.1574193327",   // เบอร์โทร
  gender:      "entry.1885314009",   // เพศ
  age:         "entry.2135893281",   // อายุ
  weight:      "entry.1069546763",   // น้ำหนัก
  height:      "entry.1521404357",    // ส่วนสูง
  waist:       "entry.1543121255",   // รอบเอว
  bp:          "entry.541987746",   // ความดันโลหิต
  dtx:         "entry.1345153418",   // น้ำตาล DTX
  smoke:       "entry.304937030",    // คัดกรองบุหรี่
  alcohol:     "entry.1303108471",   // คัดกรองแอลกอฮอล์
  dep1:        "entry.1044659520",   // ซึมเศร้า ข้อ 1
  dep2:        "entry.2131336956",    // ซึมเศร้า ข้อ 2
  advice:      "entry.2082235457",    // คำแนะนำ
  note:        "entry.1917286047",   // หมายเหตุ
};

const $ = (id) => document.getElementById(id);
const val = (id) => $(id) ? $(id).value.trim() : "";
const radio = (name) => {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : "";
};

function init() {
  const today = new Date().toISOString().split("T")[0];
  if ($("f_date")) $("f_date").value = today;

  bindProgressTrackers();
  bindBmiCalculator();
  bindRadioHighlight();
  bindHealthAnalysis();
}

/* ─────────────────────────────────────────────
   PROGRESS & VALIDATION
   ───────────────────────────────────────────── */

const REQUIRED_FIELDS = [
  "f_osm_name", "f_moo", "f_place", "f_date",
  "f_name", "f_pid", "f_tel", "f_gender", "f_age",
  "f_weight", "f_height", "f_waist", "f_bp", "f_pulse", "f_dtx"
];
const REQUIRED_RADIOS = ["smoke", "alcohol", "dep1", "dep2"];

function updateProgress() {
  let filled = 0;
  REQUIRED_FIELDS.forEach(id => { if (val(id)) filled++; });
  REQUIRED_RADIOS.forEach(name => { if (radio(name)) filled++; });
  
  const total = REQUIRED_FIELDS.length + REQUIRED_RADIOS.length;
  const pct = Math.round((filled / total) * 100);
  $("prog").style.width = pct + "%";
  $("prog-label").textContent = `กรอกแล้ว ${filled}/${total} ช่อง`;
}

function bindProgressTrackers() {
  [...REQUIRED_FIELDS, "f_section", "f_advice", "f_note"].forEach(id => {
    if ($(id)) $(id).addEventListener("input", updateProgress);
  });
  document.querySelectorAll("input[type=radio]").forEach(el => {
    el.addEventListener("change", updateProgress);
  });
}

/* ─────────────────────────────────────────────
   HEALTH ANALYSIS (BMI, BP, DTX, Pulse)
   ───────────────────────────────────────────── */

function bindBmiCalculator() {
  ["f_weight", "f_height"].forEach(id => {
    $(id).addEventListener("input", () => {
      const w = parseFloat(val("f_weight"));
      const h = parseFloat(val("f_height")) / 100;
      const box = $("bmi-box");
      if (w > 0 && h > 0) {
        const bmi = w / (h * h);
        $("bmi-value").textContent = bmi.toFixed(1);
        let label = "ปกติ", color = "#0F6E56";
        if (bmi < 18.5) { label = "น้ำหนักน้อย"; color = "#BA7517"; }
        else if (bmi >= 30) { label = "อ้วนมาก"; color = "#A32D2D"; }
        else if (bmi >= 25) { label = "อ้วน"; color = "#E24B4A"; }
        else if (bmi >= 23) { label = "น้ำหนักเกิน"; color = "#BA7517"; }
        $("bmi-label").textContent = label;
        $("bmi-label").style.color = color;
        box.style.display = "flex";
      } else { box.style.display = "none"; }
    });
  });
}

function bindHealthAnalysis() {
  // BP Analysis
  $("f_bp").addEventListener("input", function() {
    const val = this.value;
    const box = $("bp-analysis");
    if (val.includes("/")) {
      const [sys, dia] = val.split("/").map(Number);
      if (sys && dia) {
        box.style.display = "flex";
        if (sys >= 160 || dia >= 100) { box.textContent = "⚠️ ความดันสูงระดับ 2 (พบแพทย์)"; box.className = "analysis-box analysis-danger"; }
        else if (sys >= 140 || dia >= 90) { box.textContent = "⚠️ ความดันสูงระดับ 1 (เฝ้าระวัง)"; box.className = "analysis-box analysis-warning"; }
        else if (sys >= 130 || dia >= 85) { box.textContent = "💡 ความดันค่อนข้างสูง"; box.className = "analysis-box analysis-warning"; }
        else { box.textContent = "✅ ความดันปกติ"; box.className = "analysis-box analysis-normal"; }
      }
    } else { box.style.display = "none"; }
  });

  // DTX Analysis
  $("f_dtx").addEventListener("input", function() {
    const v = Number(this.value);
    const box = $("dtx-analysis");
    if (v > 0) {
      box.style.display = "flex";
      if (v >= 126) { box.textContent = "⚠️ น้ำตาลสูง (ควรพบแพทย์)"; box.className = "analysis-box analysis-danger"; }
      else if (v >= 100) { box.textContent = "⚠️ เสี่ยงเบาหวาน (เฝ้าระวัง)"; box.className = "analysis-box analysis-warning"; }
      else { box.textContent = "✅ น้ำตาลปกติ"; box.className = "analysis-box analysis-normal"; }
    } else { box.style.display = "none"; }
  });

  // Pulse Analysis
  $("f_pulse").addEventListener("input", function() {
    const v = Number(this.value);
    const box = $("pulse-analysis");
    if (v > 0) {
      box.style.display = "flex";
      if (v > 100) { box.textContent = "⚠️ ชีพจรเร็ว"; box.className = "analysis-box analysis-warning"; }
      else if (v < 60) { box.textContent = "⚠️ ชีพจรช้า"; box.className = "analysis-box analysis-warning"; }
      else { box.textContent = "✅ ชีพจรปกติ"; box.className = "analysis-box analysis-normal"; }
    } else { box.style.display = "none"; }
  });
}

function bindRadioHighlight() {
  document.querySelectorAll(".radio-item input").forEach(inp => {
    inp.addEventListener("change", function() {
      const group = this.closest(".radio-group");
      group.querySelectorAll(".radio-item").forEach(i => i.classList.remove("selected"));
      this.closest(".radio-item").classList.add("selected");
    });
  });
}

/* ─────────────────────────────────────────────
   SUBMIT & REDIRECT PREVENTION
   ───────────────────────────────────────────── */

function validateForm() {
  let isValid = true;
  const errorMsg = $("form-error-msg");
  
  // Reset errors
  document.querySelectorAll(".error-border").forEach(el => el.classList.remove("error-border"));
  errorMsg.style.display = "none";

  REQUIRED_FIELDS.forEach(id => {
    if (!val(id)) {
      $(id).classList.add("error-border");
      isValid = false;
    }
  });

  REQUIRED_RADIOS.forEach(name => {
    if (!radio(name)) {
      document.querySelector(`input[name="${name}"]`).closest(".radio-group").classList.add("error-border");
      isValid = false;
    }
  });

  if (!isValid) {
    errorMsg.style.display = "flex";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  return isValid;
}

function submitForm(event) {
  event.preventDefault();
  if (!validateForm()) return;

  const btn = $("submitBtn");
  btn.disabled = true;
  $("submitText").textContent = "กำลังบันทึก...";

  // 1. Create Hidden Iframe
  let iframe = $("hidden_iframe");
  if (!iframe) {
    iframe = document.createElement("iframe");
    iframe.id = "hidden_iframe";
    iframe.name = "hidden_iframe";
    iframe.style.display = "none";
    document.body.appendChild(iframe);
  }

  iframe.onload = () => {
    showSuccess(val("f_name"));
  };

  // 2. Prepare Data
  const osm = val("f_osm_name");
  const moo = val("f_moo");
  const sec = val("f_section");
  const mooSection = `อสม.${osm} หมู่ ${moo}${sec ? ' หมวด '+sec : ''}`;

  const hiddenForm = document.createElement("form");
  hiddenForm.method = "POST";
  hiddenForm.action = FORM_URL;
  hiddenForm.target = "hidden_iframe";

  const data = {
    [ENTRIES.moo_section]: mooSection,
    [ENTRIES.place]: val("f_place"),
    [ENTRIES.date]: val("f_date"),
    [ENTRIES.name]: val("f_name"),
    [ENTRIES.pid]: val("f_pid"),
    [ENTRIES.tel]: val("f_tel"),
    [ENTRIES.gender]: val("f_gender"),
    [ENTRIES.age]: val("f_age"),
    [ENTRIES.weight]: val("f_weight"),
    [ENTRIES.height]: val("f_height"),
    [ENTRIES.waist]: val("f_waist"),
    [ENTRIES.bp]: `${val("f_bp")} P:${val("f_pulse")}`, // รวมความดันและชีพจรเข้าด้วยกัน
    [ENTRIES.dtx]: val("f_dtx"),
    [ENTRIES.smoke]: radio("smoke"),
    [ENTRIES.alcohol]: radio("alcohol"),
    [ENTRIES.dep1]: radio("dep1"),
    [ENTRIES.dep2]: radio("dep2"),
    [ENTRIES.advice]: val("f_advice"),
    [ENTRIES.note]: val("f_note"),
  };

  Object.entries(data).forEach(([k, v]) => {
    const inp = document.createElement("input");
    inp.type = "hidden";
    inp.name = k;
    inp.value = v;
    hiddenForm.appendChild(inp);
  });

  document.body.appendChild(hiddenForm);
  hiddenForm.submit();
}

function showSuccess(name) {
  $("mainForm").style.display = "none";
  $("successBanner").style.display = "block";
  $("successName").textContent = `บันทึกข้อมูลของ "${name}" เรียบร้อยแล้ว`;
  
  // Generate Advice
  const adviceDiv = $("dynamicAdvice");
  adviceDiv.innerHTML = "";
  let hasAdvice = false;

  const bp = $("f_bp").value;
  const dtx = Number($("f_dtx").value);

  if (bp.includes("/")) {
    const [sys, dia] = bp.split("/").map(Number);
    if (sys >= 130 || dia >= 85) {
      hasAdvice = true;
      adviceDiv.innerHTML += `
        <div class="advice-card">
          <h4 style="color:#E24B4A"><i class="ti ti-activity"></i> คำแนะนำเรื่องความดันโลหิต</h4>
          <p>พบค่าความดันอยู่ในเกณฑ์เฝ้าระวัง/สูง ควรลดอาหารเค็ม พักผ่อนให้เพียงพอ และตรวจวัดซ้ำในวันถัดไป</p>
        </div>`;
    }
  }

  if (dtx >= 100) {
    hasAdvice = true;
    adviceDiv.innerHTML += `
      <div class="advice-card" style="border-left-color: #BA7517">
        <h4 style="color:#BA7517"><i class="ti ti-droplet"></i> คำแนะนำเรื่องระดับน้ำตาล</h4>
        <p>พบระดับน้ำตาลอยู่ในเกณฑ์เสี่ยง/สูง ควรลดของหวาน น้ำอัดลม และผลไม้รสหวานจัด</p>
      </div>`;
  }

  // 2Q Analysis
  const isDep1 = analysis.dep1 && analysis.dep1.includes("มี");
  const isDep2 = analysis.dep2 && analysis.dep2.includes("มี");
  
  if (isDep1 || isDep2) {
    hasAdvice = true;
    adviceDiv.innerHTML += `
      <div class="advice-card" style="border-left-color: #A32D2D">
        <h4 style="color:#A32D2D"><i class="ti ti-brain"></i> คำแนะนำด้านสุขภาพจิต (2Q)</h4>
        <p>พบความเสี่ยงภาวะซึมเศร้าเบื้องต้น ควรให้กำลังใจ รับฟัง และประสานเจ้าหน้าที่ รพ.สต. เพื่อดูแลเพิ่มเติม</p>
      </div>`;
  }

  if (hasAdvice) adviceDiv.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() {
  location.reload();
}

document.addEventListener("DOMContentLoaded", init);