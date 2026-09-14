(function () {
  "use strict";
  var file = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  var legacyBanner = document.body.firstElementChild;
  if (legacyBanner && /ภาพหน้าจอของระบบ KM/.test(legacyBanner.textContent || "")) legacyBanner.remove();
  function toast(message) {
    var el = document.querySelector(".km-toast");
    if (!el) { el = document.createElement("div"); el.className = "km-toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
    el.textContent = message; requestAnimationFrame(function () { el.classList.add("show"); });
    clearTimeout(window.__kmToast); window.__kmToast = setTimeout(function () { el.classList.remove("show"); }, 2800);
  }
  function dialog(title, copy, onConfirm) {
    var wrap = document.createElement("div"); wrap.className = "km-dialog-backdrop";
    wrap.innerHTML = '<div class="km-dialog" role="dialog" aria-modal="true" aria-labelledby="km-dialog-title"><h2 id="km-dialog-title">' + title + '</h2><p>' + copy + '</p><label for="km-reason">หมายเหตุ</label><textarea id="km-reason" placeholder="ระบุรายละเอียดเพิ่มเติม"></textarea><div class="km-dialog-actions"><button type="button" data-close>ยกเลิก</button><button type="button" class="primary" data-confirm>ยืนยัน</button></div></div>';
    document.body.appendChild(wrap); var close = function () { wrap.remove(); };
    wrap.addEventListener("click", function (e) { if (e.target === wrap || e.target.closest("[data-close]")) close(); });
    wrap.querySelector("[data-confirm]").addEventListener("click", function () { if (onConfirm) onConfirm(); close(); });
    wrap.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); }); wrap.querySelector("textarea").focus();
  }
  function routeInactiveLinks() {
    document.querySelectorAll('a[data-inactive="1"], a[href="#"]').forEach(function (a) {
      var label = a.textContent.trim(), target = "entry.html";
      if (/เพิ่มความรู้|แก้ไขรายการ/.test(label)) target = "submit.html";
      else if (/ข้อมูลบุคลากร/.test(label)) target = "directory.html";
      else if (/การแจ้งเตือน/.test(label)) target = "notices.html";
      else if (/ของขวัญ|Gift Register/.test(label)) target = "entry-attach.html";
      else if (/ส่งออก|PDF/.test(label)) target = "#export";
      else if (/ยุติ|เก็บเป็นประวัติ|ส่งกลับ/.test(label)) target = "#action";
      a.removeAttribute("data-inactive"); a.style.cursor = "pointer"; a.setAttribute("href", target);
      if (target === "#export") a.addEventListener("click", function (e) { e.preventDefault(); toast("เตรียมเอกสาร PDF พร้อมลายน้ำแล้ว"); setTimeout(function () { window.print(); }, 650); });
      if (target === "#action") a.addEventListener("click", function (e) { e.preventDefault(); dialog(label.replace("…", ""), "กรุณาระบุเหตุผลก่อนบันทึกการดำเนินการ", function () { toast("บันทึกการดำเนินการเรียบร้อยแล้ว"); }); });
    });
  }
  function enhanceNavigation() {
    document.querySelectorAll("nav a").forEach(function (a) {
      var href = (a.getAttribute("href") || "").toLowerCase();
      if (href === file || (file === "entry-attach.html" && href === "entry.html")) a.setAttribute("aria-current", "page");
      if (file === "home-admin.html" && /index\.html$/.test(href)) a.setAttribute("href", "home-admin.html");
    });
    var viewer = document.querySelector(".viewer-bar select");
    if (viewer) viewer.addEventListener("change", function () { var admin = viewer.value === "6" || /ผู้ดูแลระบบฐานข้อมูลความรู้/.test(viewer.options[viewer.selectedIndex].text); toast("เปลี่ยนผู้ใช้งานแล้ว"); setTimeout(function () { location.href = admin ? "home-admin.html" : "home-employee.html"; }, 500); });
  }
  function enhanceSearch() {
    var form = document.querySelector('form[action*="search"], form.search-form, form.search-box'); if (!form && /^search-/.test(file)) form = document.querySelector("form:not(.viewer-bar)"); if (!form) return;
    var input = form.querySelector('input[type="search"], input[name="q"], input[type="text"]'); if (!input) return;
    form.setAttribute("action", "search-word.html"); form.addEventListener("submit", function (e) { e.preventDefault(); var q = input.value.trim(); if (!q) { location.href = "search-empty.html"; return; } try { localStorage.setItem("km_last_search", q); } catch (_) {} location.href = q.length > 18 || /\s/.test(q) ? "search-sentence.html" : "search-word.html"; });
    var recent = ""; try { recent = localStorage.getItem("km_last_search") || ""; } catch (_) {} if (file === "search-empty.html" && recent && !input.value) input.placeholder = "ลองค้นหา “" + recent + "” อีกครั้ง";
  }
  function enhanceSubmit() {
    if (file !== "submit.html") return; var form = document.querySelector("form"); if (!form) return; var submit = form.querySelector('button[type="submit"], input[type="submit"]'); if (submit) submit.classList.add("primary");
    form.addEventListener("submit", function (e) { e.preventDefault(); var required = Array.prototype.slice.call(form.querySelectorAll("[required]")); var missing = required.find(function (el) { return !String(el.value || "").trim(); }); if (missing) { missing.focus(); toast("กรุณากรอกข้อมูลที่จำเป็นให้ครบ"); return; } dialog("ส่งความรู้เข้าสู่ระบบ", "ระบบจะบันทึกฉบับร่างและส่งให้ผู้ตรวจสอบตามสายงาน", function () { try { localStorage.setItem("km_submission_saved", new Date().toISOString()); } catch (_) {} toast("ส่งความรู้เรียบร้อยแล้ว"); setTimeout(function () { location.href = "home-employee.html"; }, 1100); }); });
  }
  function enhanceTables() {
    var filter = document.querySelector('input[type="search"], input[placeholder*="ค้นหา"]'); if (!filter || /^search-/.test(file)) return; var rows = document.querySelectorAll("table tr, .home-list li"); if (!rows.length) return;
    filter.addEventListener("input", function () { var q = filter.value.trim().toLowerCase(); rows.forEach(function (row, i) { if (i === 0 && row.tagName === "TR") return; row.style.display = !q || row.textContent.toLowerCase().indexOf(q) >= 0 ? "" : "none"; }); });
  }
  function registerWebMCP() {
    var context = document.modelContext;
    if (!context || typeof context.registerTool !== "function") return;
    try {
      Promise.resolve(context.registerTool({
        name: "search_knowledge",
        title: "ค้นหาความรู้",
        description: "ค้นหาคลังความรู้ด้วยคำสำคัญหรือคำถาม และเปิดหน้าผลลัพธ์ที่เกี่ยวข้อง",
        inputSchema: { type: "object", properties: { query: { type: "string", minLength: 1, maxLength: 500 } }, required: ["query"], additionalProperties: false },
        annotations: { readOnlyHint: true, untrustedContentHint: false },
        execute: function (input) {
          var query = input && typeof input.query === "string" ? input.query.trim() : "";
          if (!query) throw new Error("กรุณาระบุคำค้นหา");
          try { localStorage.setItem("km_last_search", query); } catch (_) {}
          location.href = query.length > 18 || /\s/.test(query) ? "search-sentence.html" : "search-word.html";
          return { status: "opening_results", query: query };
        }
      })).catch(function () {});
    } catch (_) {}
  }
  routeInactiveLinks(); enhanceNavigation(); enhanceSearch(); enhanceSubmit(); enhanceTables(); registerWebMCP();
})();
