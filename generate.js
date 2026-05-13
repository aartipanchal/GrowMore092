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
    // Native validity first
    if (!form.checkValidity()) {
      form.reportValidity();
      setStatus("Please fix the highlighted fields.", true);
      return false;
    }

    const data = getFormDataObject();

    // Minimal extra rules (mostly for mapping accuracy)
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

    // Grab the main document section (exclude template's toolbar)
    const doc = wrapper.querySelector("main.doc");
    if (!doc) throw new Error("Template structure changed (main.doc missing).");

    // Clone styles from template by linking the same CSS in a container.
    // We'll include a <link> so html2pdf captures it.
    const container = document.createElement("div");
    container.className = "pdf-container";

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "./distributor-contract.css";
    container.appendChild(link);

    container.appendChild(doc);
    return container;
  }

  function fillTemplate(container, data) {
    // Fill text fields
    container.querySelectorAll("[data-field]").forEach((el) => {
      const key = el.getAttribute("data-field");
      const val = (key && data[key]) ? data[key] : "";

      // Special: address box fields live inside a div, allow wrapping
      if (el.classList.contains("own-right__box")) {
        el.textContent = val;
        return;
      }

      el.textContent = val;
    });

    // Fill checkboxes (firmType)
    container.querySelectorAll("[data-check][data-check-value]").forEach((box) => {
      const key = box.getAttribute("data-check");
      const expected = box.getAttribute("data-check-value");
      const current = key ? data[key] : "";
      if (current && expected && current === expected) {
        box.classList.add("is-checked");
      } else {
        box.classList.remove("is-checked");
      }
    });

    // Witness sign: if empty, keep blank
    if (!data.witnessSign && data.witnessName) {
      const el = container.querySelector('[data-field="witnessSign"]');
      if (el) el.textContent = "";
    }
  }

  async function generatePdfBlob(container) {
    // Ensure images/fonts/styles are loaded
    await new Promise((r) => setTimeout(r, 50));

    const opt = {
      margin: 0,
      filename: "distributor-contract.pdf",
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"] },
    };

    // html2pdf returns a worker; we can ask it for output as a Blob
    const worker = window.html2pdf().set(opt).from(container);
    const blob = await worker.outputPdf("blob");
    return blob;
  }

  async function generateAndDownload() {
    if (!validate()) return;

    setStatus("Generating PDF…");

    const data = getFormDataObject();
    const templateHtml = await loadTemplateHtml();
    const container = buildTemplateDom(templateHtml);
    fillTemplate(container, data);

    // Render container in hidden root so styles resolve correctly
    templateRoot.innerHTML = "";
    templateRoot.appendChild(container);

    try {
      const blob = await generatePdfBlob(container);

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
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      // keep templateRoot content for consistent subsequent renders
    }
  }

  btnDownload.addEventListener("click", () => generateAndDownload());
})();

