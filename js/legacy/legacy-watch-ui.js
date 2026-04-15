/* Extracted from legacy-engine-compute.js — watch modal helpers */
function isSportOrExpert(){
  const m = document.body.getAttribute("data-usemode");
  return (m === "sport" || m === "expert");
}
function openWatchInfoModal(content){
  const modal = $("watchInfoModal");
  const body  = $("watchInfoBody");
  if (!modal || !body) return;
  if (content && typeof content === 'object' && content.html) {
    body.innerHTML = content.html;
  } else {
    body.textContent = content || "Aucune information.";
  }
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
}
function closeWatchInfoModal(){
  const modal = $("watchInfoModal");
  if (!modal) return;
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
}

/* =====================================================================
   12) Compute (moteur)
   UI piloté: quasi tout (sorties tK/tP/tC/tF, notes, etc.)
   ===================================================================== */
/* ============================================================
   Carb repères : panneau explicatif (UI)
   - "Glucides calculés" = valeur avant plafonds
   - "Plafond pris en compte" = cap effectif (si contraignant ou non)
   ============================================================ */
