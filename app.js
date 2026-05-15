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
  // ตั้งค่าวันที่ปัจจุบัน
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const today = `${year}-${month}-${day}`;
  
  if ($("f_date")) $("f_date").value = today;

  bindProgressTrackers();
  bindBmiCalculator();
  bindRadioHighlight();
  bindHealthAnalysis();
  
  updateProgress();
}

/* ─────────────────────────────────────────────
   PROGRESS & VALIDATION
   ───────────────────────────────────────────── */

const REQUIRED_FIELDS = [
  "f_osm_name", "f_moo", "f_place", "f_date",
  "f_name", "f_pid", "f_tel", "f_gender", "f_age",
  "f_weight", "f_height", "f_waist", "f_bp_sys", "f_bp_dia", "f_pulse", "f_dtx"
];
const REQUIRED_RADIOS = ["smoke", "alcohol", "dep1", "dep2"];

function updateProgress() {
  let filled = 0;
  REQUIRED_FIELDS.forEach(id => { if (val(id)) filled++; });
  REQUIRED_RADIOS.forEach(name => { if (radio(name)) filled++; });
  
  const total = REQUIRED_FIELDS.length + REQUIRED_RADIOS.length;
  const pct = Math.round((filled / total) * 100);
  if ($("prog")) $("prog").style.width = pct + "%";
  if ($("prog-label")) $("prog-label").textContent = `กรอกแล้ว ${filled}/${total} ช่อง`;
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
   HEALTH ANALYSIS (วิเคราะห์ผลแบบเรียลไทม์)
   ───────────────────────────────────────────── */

function bindBmiCalculator() {
  const updateBmi = () => {
    const w = parseFloat(val("f_weight"));
    const h = parseFloat(val("f_height")) / 100;
    const box = $("bmi-box");
    if (w > 0 && h > 0) {
      const bmi = w / (h * h);
      if ($("bmi-value")) $("bmi-value").textContent = bmi.toFixed(1);
      let label = "ปกติ", color = "#0F6E56";
      
      if (bmi < 18.5) { label = "ผอมเกินไป"; color = "#BA7517"; }
      else if (bmi >= 30.0) { label = "อ้วนระดับ 2"; color = "#A32D2D"; }
      else if (bmi >= 25.0) { label = "อ้วนระดับ 1"; color = "#E24B4A"; }
      else if (bmi >= 23.0) { label = "ท้วม/เริ่มอ้วน"; color = "#BA7517"; }
      else { label = "ปกติ"; color = "#0F6E56"; }
      
      if ($("bmi-label")) {
        $("bmi-label").textContent = label;
        $("bmi-label").style.color = color;
      }
      if (box) box.style.display = "flex";
    } else { 
      if (box) box.style.display = "none"; 
    }
  };

  if ($("f_weight")) $("f_weight").addEventListener("input", updateBmi);
  if ($("f_height")) $("f_height").addEventListener("input", updateBmi);
}

function bindHealthAnalysis() {
  // 1. BP Analysis (ความดันโลหิต - แยก 2 ช่อง)
  const updateBP = () => {
    const sys = Number(val("f_bp_sys"));
    const dia = Number(val("f_bp_dia"));
    const box = $("bp-analysis");
    if (sys > 0 && dia > 0) {
      box.style.display = "flex";
      if (sys >= 180 || dia >= 110) { box.textContent = "🚨 วิกฤต! (ส่งต่อทันที)"; box.className = "analysis-box analysis-danger"; }
      else if (sys >= 160 || dia >= 100) { box.textContent = "⚠️ สูงระดับ 2 (พบแพทย์)"; box.className = "analysis-box analysis-danger"; }
      else if (sys >= 140 || dia >= 90) { box.textContent = "⚠️ สูงระดับ 1 (เฝ้าระวัง)"; box.className = "analysis-box analysis-warning"; }
      else if (sys >= 120 || dia >= 80) { box.textContent = "💡 กลุ่มเสี่ยง (ปรับพฤติกรรม)"; box.className = "analysis-box analysis-warning"; }
      else { box.textContent = "✅ ปกติ"; box.className = "analysis-box analysis-normal"; }
    } else { if (box) box.style.display = "none"; }
  };

  if ($("f_bp_sys")) $("f_bp_sys").addEventListener("input", updateBP);
  if ($("f_bp_dia")) $("f_bp_dia").addEventListener("input", updateBP);

  // 2. DTX Analysis (ระดับน้ำตาล)
  if ($("f_dtx")) {
    $("f_dtx").addEventListener("input", function() {
      const v = Number(this.value);
      const box = $("dtx-analysis");
      if (v > 0) {
        box.style.display = "flex";
        if (v >= 126) { box.textContent = "⚠️ สงสัยเบาหวาน (พบแพทย์)"; box.className = "analysis-box analysis-danger"; }
        else if (v >= 100) { box.textContent = "⚠️ กลุ่มเสี่ยง (เฝ้าระวัง)"; box.className = "analysis-box analysis-warning"; }
        else { box.textContent = "✅ ปกติ"; box.className = "analysis-box analysis-normal"; }
      } else { if (box) box.style.display = "none"; }
    });
  }

  // 3. Pulse Analysis (ชีพจร)
  if ($("f_pulse")) {
    $("f_pulse").addEventListener("input", function() {
      const v = Number(this.value);
      const box = $("pulse-analysis");
      if (v > 0) {
        box.style.display = "flex";
        if (v > 100) { box.textContent = "⚠️ ชีพจรเร็ว"; box.className = "analysis-box analysis-warning"; }
        else if (v < 60) { box.textContent = "⚠️ ชีพจรช้า"; box.className = "analysis-box analysis-warning"; }
        else { box.textContent = "✅ ปกติ"; box.className = "analysis-box analysis-normal"; }
      } else { if (box) box.style.display = "none"; }
    });
  }

  // 4. 2Q Analysis (ภาวะซึมเศร้า)
  const update2Q = () => {
    const d1 = radio("dep1");
    const d2 = radio("dep2");
    const box = $("dep-analysis");
    if (d1 && d2) {
      if (box) {
        box.style.display = "flex";
        if (d1.includes("มี") || d2.includes("มี")) {
          box.textContent = "⚠️ มีความเสี่ยงภาวะซึมเศร้า (ควรประเมิน 9Q ต่อ)";
          box.className = "analysis-box analysis-danger";
        } else {
          box.textContent = "✅ ปกติ (ไม่มีความเสี่ยง)";
          box.className = "analysis-box analysis-normal";
        }
      }
    }
  };

  document.querySelectorAll('input[name="dep1"], input[name="dep2"]').forEach(el => {
    el.addEventListener("change", update2Q);
  });
}

function bindRadioHighlight() {
  document.querySelectorAll(".radio-item input").forEach(inp => {
    inp.addEventListener("change", function() {
      const group = this.closest(".radio-group");
      if (group) {
        group.querySelectorAll(".radio-item").forEach(i => i.classList.remove("selected"));
        this.closest(".radio-item").classList.add("selected");
      }
    });
  });
}

/* ─────────────────────────────────────────────
   SUBMIT & DATA PREPARATION
   ───────────────────────────────────────────── */

async function submitForm(event) {
  if (event) event.preventDefault();
  
  // Validation
  let isValid = true;
  const errorMsg = $("form-error-msg");
  document.querySelectorAll(".error-border").forEach(el => el.classList.remove("error-border"));
  if (errorMsg) errorMsg.style.display = "none";

  REQUIRED_FIELDS.forEach(id => {
    if (!val(id)) { 
      const el = $(id);
      if (el) el.classList.add("error-border"); 
      isValid = false; 
    }
  });
  REQUIRED_RADIOS.forEach(name => {
    if (!radio(name)) { 
      const el = document.querySelector(`input[name="${name}"]`);
      if (el) el.closest(".radio-group").classList.add("error-border"); 
      isValid = false; 
    }
  });

  if (!isValid) {
    if (errorMsg) errorMsg.style.display = "flex";
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  const btn = $("submitBtn");
  if (btn) btn.disabled = true;
  if ($("submitText")) $("submitText").textContent = "กำลังบันทึก...";

  // รวมค่าความดันเพื่อส่งและแสดงผล
  const bpFull = `${val("f_bp_sys")}/${val("f_bp_dia")}`;

  const analysisData = {
    name: val("f_name"),
    bp: bpFull,
    dtx: Number(val("f_dtx")),
    dep1: radio("dep1"),
    dep2: radio("dep2"),
    smoke: radio("smoke"),
    alcohol: radio("alcohol")
  };

  const osm = val("f_osm_name");
  const moo = val("f_moo");
  const sec = val("f_section");
  const mooSection = `อสม.${osm} หมู่ ${moo}${sec ? ' หมวด '+sec : ''}`;

  const params = new URLSearchParams();
  params.append(ENTRIES.moo_section, mooSection);
  params.append(ENTRIES.place, val("f_place"));
  params.append(ENTRIES.date, val("f_date"));
  params.append(ENTRIES.name, val("f_name"));
  params.append(ENTRIES.pid, val("f_pid"));
  params.append(ENTRIES.tel, val("f_tel"));
  params.append(ENTRIES.gender, val("f_gender"));
  params.append(ENTRIES.age, val("f_age"));
  params.append(ENTRIES.weight, val("f_weight"));
  params.append(ENTRIES.height, val("f_height"));
  params.append(ENTRIES.waist, val("f_waist"));
  params.append(ENTRIES.bp, `${bpFull} P:${val("f_pulse")}`);
  params.append(ENTRIES.dtx, val("f_dtx"));
  params.append(ENTRIES.smoke, radio("smoke"));
  params.append(ENTRIES.alcohol, radio("alcohol"));
  params.append(ENTRIES.dep1, radio("dep1"));
  params.append(ENTRIES.dep2, radio("dep2"));
  params.append(ENTRIES.advice, val("f_advice"));
  params.append(ENTRIES.note, val("f_note"));

  showSuccess(analysisData);

  try {
    await fetch(FORM_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString()
    });
  } catch (err) { console.error("Submit error:", err); }
}

function showSuccess(analysis) {
  if ($("mainForm")) $("mainForm").style.display = "none";
  if ($("successBanner")) $("successBanner").style.display = "block";
  if ($("successName")) $("successName").textContent = `บันทึกข้อมูลของ "${analysis.name}" เรียบร้อยแล้ว`;
  
  const adviceDiv = $("dynamicAdvice");
  if (!adviceDiv) return;
  
  adviceDiv.innerHTML = "";
  let hasAdvice = false;

  // BP Analysis
  if (analysis.bp.includes("/")) {
    const [sys, dia] = analysis.bp.split("/").map(Number);
    if (sys >= 120 || dia >= 80) {
      hasAdvice = true;
      const isDanger = sys >= 160 || dia >= 100;
      adviceDiv.innerHTML += `
        <div class="advice-card" style="border-left-color: ${isDanger ? '#E24B4A' : '#BA7517'}">
          <h4 style="color:${isDanger ? '#E24B4A' : '#BA7517'}"><i class="ti ti-activity"></i> คำแนะนำเรื่องความดันโลหิต</h4>
          <p>${isDanger ? 'พบค่าความดันสูงมาก ควรพบแพทย์ทันที' : 'พบค่าความดันอยู่ในเกณฑ์เสี่ยง ควรลดอาหารเค็มและออกกำลังกาย'}</p>
        </div>`;
    }
  }

  // DTX Analysis
  if (analysis.dtx >= 100) {
    hasAdvice = true;
    const isDanger = analysis.dtx >= 126;
    adviceDiv.innerHTML += `
      <div class="advice-card" style="border-left-color: ${isDanger ? '#E24B4A' : '#BA7517'}">
        <h4 style="color:${isDanger ? '#E24B4A' : '#BA7517'}"><i class="ti ti-droplet"></i> คำแนะนำเรื่องระดับน้ำตาล</h4>
        <p>${isDanger ? 'ระดับน้ำตาลสูงเข้าข่ายเบาหวาน ควรพบแพทย์' : 'ระดับน้ำตาลอยู่ในเกณฑ์เสี่ยง ควรลดของหวานและแป้ง'}</p>
      </div>`;
  }

  // 2Q Analysis
  if (analysis.dep1.includes("มี") || analysis.dep2.includes("มี")) {
    hasAdvice = true;
    adviceDiv.innerHTML += `
      <div class="advice-card" style="border-left-color: #A32D2D">
        <h4 style="color:#A32D2D"><i class="ti ti-brain"></i> คำแนะนำด้านสุขภาพจิต (2Q)</h4>
        <p>พบความเสี่ยงภาวะซึมเศร้าเบื้องต้น ควรให้กำลังใจและประสานเจ้าหน้าที่ รพ.สต.</p>
      </div>`;
  }

  // Smoke/Alcohol
  if (analysis.smoke !== "ไม่สูบ" || analysis.alcohol !== "ไม่ดื่ม") {
    hasAdvice = true;
    adviceDiv.innerHTML += `
      <div class="advice-card" style="border-left-color: #BA7517">
        <h4 style="color:#BA7517"><i class="ti ti-leaf"></i> คำแนะนำพฤติกรรมสุขภาพ</h4>
        <p>ควรลด ละ เลิก การสูบบุหรี่และดื่มแอลกอฮอล์เพื่อสุขภาพที่ดีในระยะยาว</p>
      </div>`;
  }

  if (hasAdvice) adviceDiv.style.display = "block";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function resetForm() { location.reload(); }

document.addEventListener("DOMContentLoaded", init);