(function () {
  "use strict";

  var KEY = "km_cabinet_workspace_v1";
  var route = (location.pathname.split("/").filter(Boolean).pop() || "index").toLowerCase().replace(/\.html$/, "");
  var query = new URLSearchParams(location.search);

  function defaults() {
    return { documents: [], draft: null, people: [], terms: [], theme: "light", noticesRead: false };
  }
  function load() {
    try { return Object.assign(defaults(), JSON.parse(localStorage.getItem(KEY) || "{}")); }
    catch (_) { return defaults(); }
  }
  var state = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (_) {} }
  function esc(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function toast(message) {
    var node = document.querySelector(".ws-toast");
    if (!node) { node = document.createElement("div"); node.className = "ws-toast"; document.body.appendChild(node); }
    node.textContent = message;
    node.classList.add("show");
    clearTimeout(window.__kmToast);
    window.__kmToast = setTimeout(function () { node.classList.remove("show"); }, 2600);
  }
  function value(id) { var el = document.getElementById(id); return el ? el.value.trim() : ""; }
  function makeId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
  function download(name, content, type) {
    var url = URL.createObjectURL(new Blob([content], { type: type || "text/plain;charset=utf-8" }));
    var link = document.createElement("a"); link.href = url; link.download = name; document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }
  function fields() {
    var chosen = document.querySelector("[data-choice].selected");
    return { title: value("title"), type: value("type"), area: value("area"), summary: value("summary"), mode: chosen ? chosen.dataset.choice : "knowledge" };
  }
  function pill(status) {
    var cls = status === "เผยแพร่แล้ว" ? "green" : status === "ส่งกลับให้แก้ไข" || status === "ยุติการใช้งาน" ? "red" : "purple";
    return '<span class="ws-pill ' + cls + '">' + esc(status) + "</span>";
  }

  if (state.theme === "dark") document.body.classList.add("dark");

  function setupSubmit() {
    var form = document.getElementById("ws-submit");
    if (!form) return;
    ["title", "type", "area", "summary"].forEach(function (id) {
      var el = document.getElementById(id); if (el) el.name = id;
    });
    if (state.draft) {
      Object.keys(state.draft).forEach(function (key) { var el = document.getElementById(key); if (el) el.value = state.draft[key] || ""; });
      var chosen = document.querySelector('[data-choice="' + (state.draft.mode || "knowledge") + '"]') || document.querySelector("[data-choice]");
      if (chosen) chosen.classList.add("selected");
      form.classList.add("show");
      var note = document.createElement("p"); note.className = "ws-draft-note"; note.textContent = "เปิดฉบับร่างล่าสุดให้แล้ว"; form.insertBefore(note, form.firstChild);
    }
  }

  function documentCard(doc) {
    return '<a class="ws-list-row km-added" href="entry.html?id=' + encodeURIComponent(doc.id) + '" data-area="' + esc(doc.area) + '">' +
      '<span class="ws-type-icon">✓</span><span><span class="ws-list-title">' + esc(doc.title) + '</span>' +
      '<span class="ws-list-meta">' + esc(doc.code) + " · " + esc(doc.area) + '</span></span>' + pill(doc.status) + "</a>";
  }

  function injectDocuments() {
    if (!state.documents.length) return;
    if (route === "home-employee" || route === "home-admin" || route === "index") {
      var list = document.querySelector(".ws-list");
      if (list) list.insertAdjacentHTML("afterbegin", state.documents.slice().reverse().map(documentCard).join(""));
    }
    if (route.indexOf("search") === 0) {
      var last = ""; try { last = localStorage.getItem("km_last_search") || ""; } catch (_) {}
      var input = document.querySelector('[data-search-form] [name="q"]'); if (input && last) input.value = last;
      var results = document.querySelector(".ws-results");
      if (results) {
        results.insertAdjacentHTML("afterbegin", state.documents.slice().reverse().map(function (doc) {
          return '<a class="ws-result km-added" href="entry.html?id=' + encodeURIComponent(doc.id) + '" data-area="' + esc(doc.area) + '"><div class="ws-result-top"><h2>' + esc(doc.title) + '</h2><span class="ws-score">รายการของคุณ</span></div><p>' + esc(doc.summary) + '</p><div class="ws-pills"><span class="ws-pill purple">' + esc(doc.code) + '</span><span class="ws-pill">' + esc(doc.area) + '</span>' + pill(doc.status) + '</div></a>';
        }).join(""));
        if (last) {
          document.querySelectorAll(".ws-result").forEach(function (row) {
            row.hidden = row.textContent.toLowerCase().indexOf(last.toLowerCase()) < 0;
          });
          var heading = document.querySelector(".ws-heading h1"); if (heading) heading.textContent = "ผลลัพธ์สำหรับ “" + last + "”";
          var count = Array.prototype.filter.call(document.querySelectorAll(".ws-result"), function (x) { return !x.hidden; }).length;
          var info = document.querySelector(".ws-heading p"); if (info) info.textContent = "พบ " + count + " รายการที่เกี่ยวข้อง";
        }
      }
    }
    if (route === "worklist") {
      var tbody = document.querySelector(".ws-table tbody");
      if (tbody) tbody.insertAdjacentHTML("afterbegin", state.documents.slice().reverse().map(function (doc) {
        return '<tr data-work-status="' + esc(doc.status) + '"><td><b>' + esc(doc.title) + '</b><div class="ws-list-meta">' + esc(doc.code) + '</div></td><td>' + pill(doc.status) + '</td><td>ผู้ส่งรายการ</td><td>วันนี้</td><td><a class="ws-btn" href="entry.html?id=' + encodeURIComponent(doc.id) + '">เปิด</a></td></tr>';
      }).join(""));
    }
  }

  function renderCustomArticle() {
    var id = query.get("id"); if (!id) return;
    var doc = state.documents.find(function (x) { return x.id === id; }); if (!doc) return;
    var host = document.querySelector(".ws-article"); if (!host) return;
    host.innerHTML = '<article class="ws-article-main"><div class="ws-article-kicker">รายการที่ส่งผ่านระบบ</div><h1>' + esc(doc.title) + '</h1><p class="ws-article-summary">' + esc(doc.summary) + '</p><div class="ws-pills"><span class="ws-pill purple">' + esc(doc.code) + '</span>' + pill(doc.status) + '<span class="ws-pill">v1.0</span></div><div class="ws-stepper"><div class="ws-step"><i>✓</i>ส่งเรื่อง</div><div class="ws-step"><i>' + (doc.status === "เผยแพร่แล้ว" ? "✓" : "2") + '</i>ตรวจสอบ</div><div class="ws-step"><i>' + (doc.status === "เผยแพร่แล้ว" ? "✓" : "3") + '</i>เผยแพร่</div></div><section class="ws-article-section"><h2>สรุปความรู้</h2><p>' + esc(doc.summary) + '</p></section><section class="ws-article-section"><h2>ข้อมูลการจัดหมวดหมู่</h2><p>ประเภท: ' + esc(doc.type) + '<br>หน่วยงาน: ' + esc(doc.area) + '</p></section></article><aside class="ws-aside"><section class="ws-card"><div class="ws-card-head"><h2>รายละเอียด</h2></div><div class="ws-card-body"><dl class="ws-detail"><div><dt>รหัสรายการ</dt><dd>' + esc(doc.code) + '</dd></div><div><dt>หน่วยงาน</dt><dd>' + esc(doc.area) + '</dd></div><div><dt>วันที่ส่ง</dt><dd>' + esc(doc.createdAt) + '</dd></div><div><dt>สถานะ</dt><dd data-live-status>' + esc(doc.status) + '</dd></div></dl></div></section><section class="ws-card"><div class="ws-card-head"><h2>การดำเนินการ</h2></div><div class="ws-card-body" style="display:grid;gap:8px"><button class="ws-btn primary" data-status="เผยแพร่แล้ว">อนุมัติและเผยแพร่</button><button class="ws-btn" data-status="ส่งกลับให้แก้ไข">ส่งกลับให้แก้ไข</button><button class="ws-btn danger" data-status="ยุติการใช้งาน">ยุติการใช้งาน</button></div></section></aside>';
  }

  function simpleModal(title, fields, onSave) {
    var bg = document.createElement("div"); bg.className = "ws-modal-bg";
    bg.innerHTML = '<form class="ws-modal km-functional-modal"><h2>' + esc(title) + '</h2><p>กรอกข้อมูลด้านล่างแล้วกดบันทึก</p>' + fields.map(function (f) { return '<label class="ws-field"><span>' + esc(f.label) + '</span><input name="' + esc(f.name) + '" required placeholder="' + esc(f.placeholder || "") + '"></label>'; }).join("") + '<div class="ws-modal-actions"><button type="button" class="ws-btn" data-close>ยกเลิก</button><button class="ws-btn primary" type="submit">บันทึก</button></div></form>';
    document.body.appendChild(bg);
    bg.querySelector("input").focus();
    bg.querySelector("[data-close]").onclick = function () { bg.remove(); };
    bg.querySelector("form").onsubmit = function (event) { event.preventDefault(); var data = Object.fromEntries(new FormData(event.target)); onSave(data); bg.remove(); };
  }

  function setupAdminActions() {
    var headingButton = document.querySelector(".ws-heading > .ws-btn");
    if (route === "directory" && headingButton) headingButton.dataset.addPerson = "1";
    if (route === "vocabulary" && headingButton) headingButton.dataset.addTerm = "1";
    if (route === "notices" && headingButton) headingButton.dataset.markRead = "1";
    if ((route === "access-log" || route === "export-log") && headingButton) headingButton.dataset.exportCsv = "1";
    if (route === "worklist" && headingButton) {
      headingButton.dataset.workFilter = "1";
      var select = document.createElement("select"); select.className = "ws-work-filter"; select.hidden = true;
      select.innerHTML = '<option value="">ทุกสถานะ</option><option>รอตรวจสอบ</option><option>ติดขัดผู้อนุมัติ</option><option>ถึงกำหนดทบทวน</option><option>เผยแพร่แล้ว</option><option>ส่งกลับให้แก้ไข</option>';
      headingButton.after(select);
      select.onchange = function () { document.querySelectorAll(".ws-table tbody tr").forEach(function (row) { row.hidden = select.value && row.textContent.indexOf(select.value) < 0; }); };
    }
    if (state.noticesRead && route === "notices") document.querySelectorAll(".ws-pill").forEach(function (x) { if (x.textContent === "ใหม่") x.textContent = "อ่านแล้ว"; });
  }

  function knowledgeIllustration() {
    return '<svg class="km-hero-art" viewBox="0 0 620 420" role="img" aria-label="ทีมงานกำลังเชื่อมโยงและแบ่งปันความรู้">' +
      '<defs><linearGradient id="kmBlue" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#1da1ff"/><stop offset="1" stop-color="#0767eb"/></linearGradient><filter id="kmShadow" x="-30%" y="-30%" width="160%" height="180%"><feDropShadow dx="0" dy="12" stdDeviation="12" flood-color="#073b8c" flood-opacity=".14"/></filter></defs>' +
      '<circle cx="315" cy="205" r="146" fill="#eef7ff"/><circle cx="315" cy="205" r="105" fill="#dceeff"/>' +
      '<g filter="url(#kmShadow)"><rect x="68" y="70" width="190" height="62" rx="31" fill="#ff6a19"/><circle cx="101" cy="101" r="21" fill="#fff"/><circle cx="101" cy="95" r="7" fill="#ff9b63"/><path d="M88 115c5-13 22-13 27 0" fill="#ff9b63"/><rect x="133" y="92" width="91" height="8" rx="4" fill="#fff" opacity=".9"/><rect x="133" y="108" width="61" height="6" rx="3" fill="#fff" opacity=".55"/></g>' +
      '<g filter="url(#kmShadow)"><rect x="370" y="48" width="190" height="62" rx="31" fill="url(#kmBlue)"/><circle cx="527" cy="79" r="21" fill="#fff"/><circle cx="527" cy="73" r="7" fill="#53b7ff"/><path d="M514 93c5-13 22-13 27 0" fill="#53b7ff"/><rect x="401" y="70" width="88" height="8" rx="4" fill="#fff" opacity=".9"/><rect x="401" y="86" width="58" height="6" rx="3" fill="#fff" opacity=".55"/></g>' +
      '<g filter="url(#kmShadow)"><rect x="390" y="286" width="174" height="58" rx="29" fill="#03b77b"/><circle cx="529" cy="315" r="20" fill="#fff"/><circle cx="529" cy="309" r="7" fill="#55d6a9"/><path d="M517 328c5-12 20-12 25 0" fill="#55d6a9"/><rect x="416" y="306" width="74" height="8" rx="4" fill="#fff" opacity=".9"/></g>' +
      '<g filter="url(#kmShadow)"><rect x="80" y="294" width="160" height="56" rx="28" fill="#ffd31c"/><circle cx="109" cy="322" r="19" fill="#fff"/><path d="M101 323l6 6 12-15" fill="none" stroke="#f4a900" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><rect x="139" y="314" width="72" height="8" rx="4" fill="#fff" opacity=".9"/></g>' +
      '<g filter="url(#kmShadow)"><path d="M264 150h108a22 22 0 0 1 22 22v91a22 22 0 0 1-22 22H264a22 22 0 0 1-22-22v-91a22 22 0 0 1 22-22Z" fill="#fff"/><path d="M276 186c25-12 51-8 68 1v61c-18-9-43-12-68-1Z" fill="#0878f9"/><path d="M360 186c-25-12-51-8-68 1v61c18-9 43-12 68-1Z" fill="#36a8ff" opacity=".86"/><path d="M318 181v70" stroke="#fff" stroke-width="5" stroke-linecap="round"/><circle cx="318" cy="150" r="18" fill="#ff6a19"/><path d="m310 150 6 6 11-14" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></g>' +
      '<path d="M254 126C218 104 208 104 185 110M384 122c34-26 54-28 78-24M387 278c35 27 51 31 79 32M250 278c-34 27-55 35-76 39" fill="none" stroke="#77c8ff" stroke-width="3" stroke-dasharray="7 9"/>' +
      '<circle cx="188" cy="110" r="6" fill="#ff6a19"/><circle cx="462" cy="98" r="6" fill="#0878f9"/><circle cx="466" cy="310" r="6" fill="#03b77b"/><circle cx="174" cy="317" r="6" fill="#ffd31c"/></svg>';
  }

  function setupAmeliaTheme() {
    if (route !== "home-employee" && route !== "home-admin" && route !== "index") return;
    var content = document.querySelector(".ws-content");
    var heading = content && content.querySelector(":scope > .ws-heading");
    if (!content || !heading) return;
    var adminView = route === "home-admin";
    var hero = document.createElement("section");
    hero.className = "km-landing-hero";
    hero.innerHTML = '<div class="km-am-copy"><span class="km-eyebrow">KNOWLEDGE THAT MOVES WORK FORWARD</span><h1>' + (adminView ? "บริหารองค์ความรู้ทั้งองค์กร<br>ได้ในที่เดียว" : "ทุกองค์ความรู้<br>พร้อมให้ทีมค้นพบและนำไปใช้") + '</h1><p>' + (adminView ? "เห็นภาพรวม ตรวจสอบคุณภาพ และผลักดันความรู้ที่สำคัญให้ถึงมือพนักงานได้รวดเร็วขึ้น" : "ค้นหา แบ่งปัน และต่อยอดประสบการณ์ของคนในองค์กร ให้คำตอบที่ใช่อยู่ใกล้กว่าที่เคย") + '</p><div class="km-hero-actions"><a class="ws-btn primary" href="search-empty.html">ค้นหาความรู้</a><a class="ws-btn km-outline" href="submit.html">แบ่งปันความรู้ <span>→</span></a></div><div class="km-hero-trust"><span><b>1,284</b> รายการความรู้</span><i></i><span><b>96%</b> ค้นหาคำตอบสำเร็จ</span></div></div><div class="km-hero-visual">' + knowledgeIllustration() + '</div>';
    heading.replaceWith(hero);
    var statsBlock = content.querySelector(".ws-stats");
    if (statsBlock) {
      var band = document.createElement("section");
      band.className = "km-value-band";
      band.innerHTML = '<div class="km-band-title"><span>KM CABINET เหมาะสำหรับ</span><h2>เปลี่ยนประสบการณ์ของคน<br>ให้เป็นพลังของทั้งองค์กร</h2></div><div class="km-band-grid"><article><span class="km-band-icon blue">⌕</span><div><h3>ผู้ค้นหาคำตอบ</h3><p>ค้นคู่มือ ขั้นตอน และผู้เชี่ยวชาญได้จากจุดเดียว</p></div></article><article><span class="km-band-icon orange">✦</span><div><h3>ผู้แบ่งปันความรู้</h3><p>บันทึกบทเรียนและแนวทางที่ใช้จริงได้อย่างรวดเร็ว</p></div></article><article><span class="km-band-icon green">✓</span><div><h3>ผู้ดูแลคลังความรู้</h3><p>ตรวจสอบ อนุมัติ และติดตามคุณภาพอย่างเป็นระบบ</p></div></article></div>';
      statsBlock.before(band);
    }
    var mainGrid = content.querySelector(".ws-grid");
    if (mainGrid) {
      var flow = document.createElement("section");
      flow.className = "km-flow-section";
      flow.innerHTML = '<div class="km-flow-art"><div class="km-window"><div class="km-window-bar"><i></i><i></i><i></i></div><div class="km-window-body"><span class="km-person p1">ช</span><span class="km-person p2">ว</span><span class="km-person p3">ก</span><div class="km-doc d1"><b>คู่มือ</b><small>ขั้นตอนงาน</small></div><div class="km-doc d2"><b>บทเรียน</b><small>จากทีมงาน</small></div><div class="km-doc d3"><b>นโยบาย</b><small>ฉบับล่าสุด</small></div></div></div></div><div class="km-flow-copy"><span class="km-dot-title">● ขั้นตอนที่ง่ายและชัดเจน</span><h2>จากความรู้หนึ่งคน<br>สู่คำตอบของทุกทีม</h2><p>ส่งเนื้อหาเข้าสู่กระบวนการตรวจสอบ จัดหมวดหมู่ และเผยแพร่ เพื่อให้ข้อมูลน่าเชื่อถือและพร้อมใช้งานเสมอ</p><ol><li><b>01</b><span><strong>บันทึก</strong> ประสบการณ์หรือเอกสาร</span></li><li><b>02</b><span><strong>ตรวจสอบ</strong> โดยผู้ดูแลเนื้อหา</span></li><li><b>03</b><span><strong>ค้นพบ</strong> และนำไปใช้ได้ทันที</span></li></ol><a href="submit.html" class="ws-btn primary">เริ่มแบ่งปันความรู้</a></div>';
      mainGrid.after(flow);
    }
  }

  document.addEventListener("click", function (event) {
    var target = event.target.closest("button,a"); if (!target) return;
    if (target.matches("[data-theme]")) {
      event.preventDefault(); event.stopImmediatePropagation(); document.body.classList.toggle("dark"); state.theme = document.body.classList.contains("dark") ? "dark" : "light"; save(); toast("บันทึกโหมดการแสดงผลแล้ว"); return;
    }
    if (target.matches("[data-save]")) {
      event.preventDefault(); event.stopImmediatePropagation(); state.draft = fields(); save(); toast("บันทึกฉบับร่างแล้ว กลับมาแก้ไขต่อได้ทุกเมื่อ"); return;
    }
    if (target.matches("[data-status]")) {
      event.preventDefault(); var doc = state.documents.find(function (x) { return x.id === query.get("id"); }); if (!doc) return;
      doc.status = target.dataset.status; save(); var live = document.querySelector("[data-live-status]"); if (live) live.textContent = doc.status; toast("เปลี่ยนสถานะเป็น “" + doc.status + "” แล้ว"); setTimeout(function () { location.reload(); }, 650); return;
    }
    if (target.matches("[data-download]")) {
      event.preventDefault(); event.stopImmediatePropagation(); download("KM-policy-summary.txt", "สรุปนโยบายการรับของขวัญและการเลี้ยงรับรอง\r\n\r\nของขวัญที่มีมูลค่าเกิน 3,000 บาทต้องปฏิเสธหรือแจ้งหัวหน้างานภายใน 3 วันทำการ", "text/plain;charset=utf-8"); toast("ดาวน์โหลดไฟล์แล้ว"); return;
    }
    if (target.matches("[data-add-person]")) {
      simpleModal("เพิ่มบุคลากร", [{name:"name",label:"ชื่อ–นามสกุล",placeholder:"เช่น นภา ใจดี"},{name:"area",label:"หน่วยงาน",placeholder:"เช่น บริการลูกค้า"},{name:"role",label:"บทบาท",placeholder:"เช่น เจ้าของเนื้อหา"}], function (data) { state.people.push(data); save(); toast("เพิ่มบุคลากรแล้ว"); setTimeout(function () { location.reload(); }, 500); }); return;
    }
    if (target.matches("[data-add-term]")) {
      simpleModal("เพิ่มคำศัพท์", [{name:"term",label:"คำศัพท์",placeholder:"เช่น การบริการลูกค้า"},{name:"group",label:"หมวดหมู่",placeholder:"เช่น หัวข้อ"}], function (data) { state.terms.push(data); save(); toast("เพิ่มคำศัพท์แล้ว"); setTimeout(function () { location.reload(); }, 500); }); return;
    }
    if (target.matches("[data-mark-read]")) {
      state.noticesRead = true; save(); document.querySelectorAll(".ws-pill").forEach(function (x) { if (x.textContent === "ใหม่") { x.textContent = "อ่านแล้ว"; x.className = "ws-pill"; } }); toast("ทำเครื่องหมายว่าอ่านแล้วทั้งหมด"); return;
    }
    if (target.matches("[data-export-csv]")) {
      var rows = [["ผู้ใช้งาน","รายการ","เวลา"]]; document.querySelectorAll(".ws-table tbody tr").forEach(function (tr) { rows.push(Array.prototype.map.call(tr.querySelectorAll("td"), function (td) { return td.innerText.trim().replace(/\s+/g, " "); }).slice(0,3)); });
      var csv = "\ufeff" + rows.map(function (r) { return r.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(","); }).join("\r\n"); download("km-report.csv", csv, "text/csv;charset=utf-8"); toast("ส่งออกรายงานแล้ว"); return;
    }
    if (target.matches("[data-work-filter]")) { var filter = document.querySelector(".ws-work-filter"); if (filter) { filter.hidden = !filter.hidden; if (!filter.hidden) filter.focus(); } return; }
  }, true);

  document.addEventListener("submit", function (event) {
    if (event.target.id !== "ws-submit") return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (!event.target.reportValidity()) return;
    var data = fields(); data.id = makeId(); data.code = "KM-NEW-" + String(Date.now()).slice(-6); data.status = "รอตรวจสอบ"; data.createdAt = new Intl.DateTimeFormat("th-TH", { dateStyle: "medium" }).format(new Date());
    state.documents.push(data); state.draft = null; save(); toast("ส่งความรู้เข้าสู่ระบบแล้ว"); setTimeout(function () { location.href = "entry.html?id=" + encodeURIComponent(data.id); }, 650);
  }, true);

  document.addEventListener("keydown", function (event) { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); location.href = "search-empty.html"; } });

  setupSubmit(); injectDocuments(); renderCustomArticle(); setupAdminActions(); setupAmeliaTheme();
  if (route === "directory" && state.people.length) {
    var peopleBody = document.querySelector(".ws-table tbody"); if (peopleBody) peopleBody.insertAdjacentHTML("afterbegin", state.people.map(function (p) { return '<tr><td><div class="ws-person"><span class="ws-avatar">' + esc(p.name.charAt(0)) + '</span><span><b>' + esc(p.name) + '</b><small>เพิ่มจากระบบ</small></span></div></td><td>' + esc(p.area) + '</td><td>' + esc(p.role) + '</td><td><span class="ws-pill green">ใช้งานอยู่</span></td></tr>'; }).join(""));
  }
  if (route === "vocabulary" && state.terms.length) {
    var card = document.querySelector(".ws-card .ws-card-body"); if (card) card.insertAdjacentHTML("afterbegin", state.terms.map(function (t) { return '<div class="ws-mini-row"><span>' + esc(t.term) + ' <small>(' + esc(t.group) + ')</small></span><b>ใหม่</b></div>'; }).join(""));
  }
})();
