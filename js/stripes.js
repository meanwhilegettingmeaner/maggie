// Essay pages: each white column keeps the print size, shrinking only if a page would overflow.
// The last page's column ends where its text ends, and the stripes take over below (as in print).
(function () {
  const fit = () => document.querySelectorAll(".sp").forEach(sp => {
    const page = sp.querySelector(".page"), col = sp.querySelector(".col");
    col.style.fontSize = ""; page.style.removeProperty("--end");
    if (sp.classList.contains("last")) {
      col.style.height = "auto";
      const U = page.offsetWidth / 1532;
      const end = Math.min(2390 * U, col.offsetTop + col.scrollHeight + 40 * U);
      col.style.height = "";
      page.style.setProperty("--end", end + "px");
      return;
    }
    let fs = parseFloat(getComputedStyle(col).fontSize), n = 0;
    while (col.scrollHeight > col.clientHeight + 1 && n++ < 40) { fs *= 0.985; col.style.fontSize = fs + "px"; }
  });
  addEventListener("load", fit);
  document.querySelectorAll(".col img").forEach(i => i.complete || i.addEventListener("load", fit, { once: true }));
  document.fonts && document.fonts.ready.then(fit);
  fit();
  let t; addEventListener("resize", () => { clearTimeout(t); t = setTimeout(fit, 120); });
})();
