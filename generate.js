(async function () {
  "use strict";

  const form = document.getElementById("contract-form");
  const statusEl = document.getElementById("form-status");
  const btnDownload = document.getElementById("btn-download");
  const templateRoot = document.getElementById("template-root");

  if (!form || !btnDownload || !templateRoot) return;

  function setStatus(msg, isError) {
    if (!statusEl) return;
    statusEl.textContent = msg || "";
    statusEl.style.color = isError ? "rgba(239, 68, 68, 0.95)" : "";
  }

  function getFormDataObject() {
    const fd = new FormData(form);
    const obj = {};
    fd.forEach((value, key) => {
      obj[key] = String(value ?? "").trim();
    });
    return obj;
  }

  function validate() {
    if (!form.checkValidity()) {
      form.reportValidity();
      setStatus("Please fix the highlighted fields.", true);
      return false;
    }
    const data = getFormDataObject();
    if (data.contractDate && data.contractDate.length < 6) {
      setStatus("Contract date looks too short. Use DD/MM/YYYY.", true);
      return false;
    }
    setStatus("");
    return true;
  }

  async function loadTemplateHtml() {
    const res = await fetch("./distributor-contract.html", { cache: "no-store" });
    if (!res.ok) throw new Error("Template not found");
    return await res.text();
  }

  function buildTemplateDom(templateHtml) {
    const wrapper = document.createElement("div");
    wrapper.innerHTML = templateHtml;

    wrapper.querySelectorAll(".no-print, .toolbar").forEach((el) => el.remove());

    const doc = wrapper.querySelector("main.doc");
    if (!doc) throw new Error("Template structure changed (main.doc missing).");

    doc.querySelectorAll(".page__footer").forEach((el) => el.remove());

    const FOOTER_STYLES = `
      <style>
        .footer {
          width: 100%;
          background: #fff;
          border-top: 3px solid #4a7c2f;
          overflow: hidden;
        }
        .footer-top {
          display: flex;
          align-items: center;
          padding: 12px 24px;
          gap: 32px;
          flex-wrap: wrap;
        }
        .footer-address {
          display: flex;
          align-items: flex-start;
          gap: 8px;
          color: #222;
          font-size: 13.5px;
          font-weight: 500;
          flex: 1;
        }
        .footer-address svg { flex-shrink: 0; margin-top: 2px; }
        .footer-phones {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #222;
          font-size: 13.5px;
          font-weight: 500;
          white-space: nowrap;
        }
        .divider { color: #666; font-weight: 300; }
        .footer-bottom {
          display: flex;
          align-items: stretch;
          height: 25px;
        }
        .footer-green {
          background: #4a7c2f;
          flex: 1;
          clip-path: polygon(0 0, calc(100% - 20px) 0, 100% 100%, 0 100%);
        }
        .footer-email {
          background: #f5a623;
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 0 28px 0 36px;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          white-space: nowrap;
          margin-left: -2px;
        }
      </style>
    `;

    const FOOTER_HTML = `
      <footer class="footer">
        <div class="footer-top">
          <div class="footer-address">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a7c2f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Shop-FF 6, Shivaay, Bakrol-Dhamatvan Road, Bakrol Bujrang, Ta.Daskroi, Dist. Ahmedabad-382430
          </div>
          <div class="footer-phones">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4a7c2f" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 11a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.82a16 16 0 0 0 6.29 6.29l1.17-.88a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.03z"/>
            </svg>
            +91 63522 11722 <span class="divider">|</span> +91 73591 85082
          </div>
        </div>
        <div class="footer-bottom">
          <div class="footer-green"></div>
          <div class="footer-email">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2"/>
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
            </svg>
            growmorecropscience@gmail.com
          </div>
        </div>
      </footer>
    `;

    doc.querySelectorAll(".footer-container").forEach((container) => {
      container.innerHTML = FOOTER_STYLES + FOOTER_HTML;
    });

    doc.querySelectorAll(".page").forEach((page) => {
      page.style.cssText = `
        box-shadow: none !important;
        border: none !important;
        margin: 0 !important;
        width: 210mm !important;
        height: auto !important;
        min-height: unset !important;
        display: block !important;
        page-break-after: avoid !important;
        break-after: avoid !important;
      `;
    });

    doc.style.cssText = "padding:0; gap:0; display:block; background:#fff;";

    return doc;
  }

  function fillTemplate(container, data) {
    container.querySelectorAll("[data-field]").forEach((el) => {
      const key = el.getAttribute("data-field");
      el.textContent = (key && data[key]) ? data[key] : "";
    });

    container.querySelectorAll("[data-check][data-check-value]").forEach((box) => {
      const key = box.getAttribute("data-check");
      const expected = box.getAttribute("data-check-value");
      const current = key ? data[key] : "";
      box.classList.toggle("is-checked", !!(current && current === expected));
    });
  }

  function mountPage(pageEl) {
    const holder = document.createElement("div");
    holder.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 794px;
      height: auto;
      overflow: visible;
      z-index: -9999;
      background: #fff;
      pointer-events: none;
    `;

    const fakeDoc = document.createElement("main");
    fakeDoc.className = "doc";
    fakeDoc.style.cssText = "padding:0; gap:0; display:block; background:#fff;";
    fakeDoc.appendChild(pageEl.cloneNode(true));

    // Link the main contract CSS so html2canvas can capture its styles
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "./distributor-contract.css";
    holder.appendChild(link);

    holder.appendChild(fakeDoc);
    document.body.appendChild(holder);
    return holder;
  }

  async function pageToCanvas(pageEl) {
    const holder = mountPage(pageEl);

    // Wait longer for CSS + SVGs + inline styles to fully render
    await new Promise((r) => setTimeout(r, 1500));

    const canvas = await window.html2canvas(holder.querySelector(".page"), {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      scrollX: 0,
      scrollY: 0,
    });

    document.body.removeChild(holder);
    return canvas;
  }

  async function generateAndDownload() {
    if (!validate()) return;

    setStatus("Generating PDF…");
    btnDownload.disabled = true;

    try {
      const data = getFormDataObject();
      const templateHtml = await loadTemplateHtml();
      const doc = buildTemplateDom(templateHtml);
      fillTemplate(doc, data);

      const pages = Array.from(doc.querySelectorAll(".page"));
      if (!pages.length) throw new Error("No pages found in template.");

      const A4_W = 210;
      const A4_H = 297;

      const { jsPDF } = window.jspdf;
      const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

      for (let i = 0; i < pages.length; i++) {
        setStatus(`Rendering page ${i + 1} of ${pages.length}…`);

        const canvas = await pageToCanvas(pages[i]);

        const imgData = canvas.toDataURL("image/jpeg", 0.98);
        const canvasW = canvas.width;
        const canvasH = canvas.height;

        const ratio = A4_W / (canvasW / 2);
        const imgH = (canvasH / 2) * ratio;

        if (i > 0) pdf.addPage();

        pdf.addImage(imgData, "JPEG", 0, 0, A4_W, Math.min(imgH, A4_H));
      }

      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "distributor-contract.pdf";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);

      setStatus("Downloaded.");
    } catch (err) {
      setStatus("Failed to generate PDF. Please try again.", true);
      console.error(err);
    } finally {
      btnDownload.disabled = false;
    }
  }

  btnDownload.addEventListener("click", () => generateAndDownload());
})();
