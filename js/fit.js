/* Fit each text frame to its box, like InDesign: if the web font sets
   wider than the print font, shrink the type a little until it fits. */
(function () {
  const fit = () => document.querySelectorAll(".txt").forEach(el => {
    el.style.fontSize = "";
    let s = parseFloat(getComputedStyle(el).fontSize), min = s * 0.8;
    while (el.scrollHeight > el.clientHeight + 1 && s > min) { s *= 0.97; el.style.fontSize = s + "px"; }
  });
  addEventListener("load", fit);
  if (document.fonts) document.fonts.ready.then(fit);
  let t; addEventListener("resize", () => { clearTimeout(t); t = setTimeout(fit, 120); });
})();
