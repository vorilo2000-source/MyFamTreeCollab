// ======================= CREATOR BLOCKS =======================
"use strict";
function renderBlockEditor() {
  els.blockList.innerHTML = "";
  state.storyBlocks.forEach((block, i) => {
    const item = document.createElement("div");
    item.className  = `block-item block-item--${block.type}`;
    item.dataset.idx = i;
    const isFirst = i === 0;
    const isLast  = i === state.storyBlocks.length - 1;

    let bodyHtml = "";
    if (block.type === "text") {
      const escaped = (block.value || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      bodyHtml = `<div class="block-item__label">Tekst</div><textarea class="block-textarea input input--textarea" rows="4" placeholder="Schrijf een alinea\u2026" data-idx="${i}">${escaped}</textarea>`;
    } else if (block.type === "photo") {
      bodyHtml = `<div class="block-item__label">Foto (volledig breed)</div><input type="url" class="block-url-input input" placeholder="https://res.cloudinary.com/…" value="${block.value || ""}" data-idx="${i}"><div class="block-photo-preview" data-idx="${i}">${block.value ? `<img src="${block.value}" alt="" class="block-photo-preview__img" onerror="this.parentElement.hidden=true">` : ""}</div>`;
    } else if (block.type === "photo-grid") {
      const cols   = block.cols   || 2;
      const photos = block.photos || ["", ""];
      const photosHtml = photos.map((url, pi) => `<div class="photo-grid-entry"><input type="url" class="block-url-input input block-grid-url" placeholder="Cloudinary URL…" value="${url}" data-idx="${i}" data-pi="${pi}">${url ? `<img src="${url}" alt="" class="block-photo-preview__img" style="margin-top:4px;" onerror="this.remove()">` : ""}</div>`).join("");
      bodyHtml = `<div class="block-item__label">Foto grid</div><div class="block-grid-controls"><span style="font-size:var(--text-xs);color:var(--color-charcoal-soft);">Kolommen:</span><label class="block-grid-col-opt"><input type="radio" name="grid-cols-${i}" value="2" ${cols === 2 ? "checked" : ""} data-idx="${i}"> 2</label><label class="block-grid-col-opt"><input type="radio" name="grid-cols-${i}" value="3" ${cols === 3 ? "checked" : ""} data-idx="${i}"> 3</label></div><div class="photo-grid-inputs" data-idx="${i}" style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:6px;">${photosHtml}</div><button class="link-btn link-btn--small block-grid-add-photo" data-idx="${i}" style="margin-top:6px;">+ Foto toevoegen</button>`;
    } else if (block.type === "link") {
      bodyHtml = `<div class="block-item__label">Link</div><input type="text" class="block-link-name input" placeholder="Naam (bv. Route op AllTrails)" value="${block.name || ""}" data-idx="${i}" style="margin-bottom:6px;"><input type="url" class="block-link-url input" placeholder="https://…" value="${block.url || ""}" data-idx="${i}">`;
    }

    item.innerHTML = `<div class="block-controls"><button class="block-ctrl-btn" data-action="up" data-idx="${i}" title="Omhoog" ${isFirst ? "disabled" : ""}>↑</button><button class="block-ctrl-btn" data-action="down" data-idx="${i}" title="Omlaag" ${isLast ? "disabled" : ""}>↓</button></div><div class="block-body">${bodyHtml}</div><button class="block-remove-btn" data-action="remove" data-idx="${i}" title="Verwijder blok">✕</button>`;
    els.blockList.appendChild(item);
  });

  els.blockList.querySelectorAll("[data-action]").forEach((btn) => btn.addEventListener("click", handleBlockAction));
  els.blockList.querySelectorAll(".block-textarea").forEach((ta) => ta.addEventListener("input", (e) => { state.storyBlocks[parseInt(e.target.dataset.idx)].value = e.target.value; updatePreview(); }));
  els.blockList.querySelectorAll(".block-url-input:not(.block-grid-url)").forEach((inp) => {
    inp.addEventListener("blur", (e) => { const idx = parseInt(e.target.dataset.idx); const fixed = fixCloudinaryUrl(e.target.value.trim(), "w_800,f_auto"); if (fixed !== e.target.value.trim()) { e.target.value = fixed; state.storyBlocks[idx].value = fixed; } updatePreview(); });
    inp.addEventListener("input", (e) => { const idx = parseInt(e.target.dataset.idx); state.storyBlocks[idx].value = e.target.value; const preview = els.blockList.querySelector(`.block-photo-preview[data-idx="${idx}"]`); if (preview) { const url = e.target.value.trim(); preview.hidden = !url; preview.innerHTML = url ? `<img src="${url}" alt="" class="block-photo-preview__img" onerror="this.parentElement.hidden=true">` : ""; } updatePreview(); });
  });
  els.blockList.querySelectorAll(".block-grid-url").forEach((inp) => {
    inp.addEventListener("blur", (e) => { const idx = parseInt(e.target.dataset.idx); const pi = parseInt(e.target.dataset.pi); const fixed = fixCloudinaryUrl(e.target.value.trim(), "w_800,f_auto"); e.target.value = fixed; state.storyBlocks[idx].photos[pi] = fixed; updatePreview(); });
    inp.addEventListener("input", (e) => { state.storyBlocks[parseInt(e.target.dataset.idx)].photos[parseInt(e.target.dataset.pi)] = e.target.value; updatePreview(); });
  });
  els.blockList.querySelectorAll(".block-grid-col-opt input").forEach((radio) => radio.addEventListener("change", (e) => { state.storyBlocks[parseInt(e.target.dataset.idx)].cols = parseInt(e.target.value); renderBlockEditor(); updatePreview(); }));
  els.blockList.querySelectorAll(".block-grid-add-photo").forEach((btn) => btn.addEventListener("click", (e) => { state.storyBlocks[parseInt(e.target.dataset.idx)].photos.push(""); renderBlockEditor(); }));
  els.blockList.querySelectorAll(".block-link-name").forEach((inp) => inp.addEventListener("input", (e) => { state.storyBlocks[parseInt(e.target.dataset.idx)].name = e.target.value; updatePreview(); }));
  els.blockList.querySelectorAll(".block-link-url").forEach((inp) => inp.addEventListener("input", (e) => { state.storyBlocks[parseInt(e.target.dataset.idx)].url = e.target.value; updatePreview(); }));
}

function handleBlockAction(e) {
  const action = e.currentTarget.dataset.action;
  const idx    = parseInt(e.currentTarget.dataset.idx);
  if (action === "up"     && idx > 0)                         [state.storyBlocks[idx - 1], state.storyBlocks[idx]] = [state.storyBlocks[idx], state.storyBlocks[idx - 1]];
  else if (action === "down" && idx < state.storyBlocks.length - 1) [state.storyBlocks[idx], state.storyBlocks[idx + 1]] = [state.storyBlocks[idx + 1], state.storyBlocks[idx]];
  else if (action === "remove") state.storyBlocks.splice(idx, 1);
  renderBlockEditor();
  updatePreview();
}

els.btnAddTextBlock.addEventListener("click",      () => { state.storyBlocks.push({ type: "text",       value: "" });               renderBlockEditor(); updatePreview(); });
els.btnAddPhotoBlock.addEventListener("click",     () => { state.storyBlocks.push({ type: "photo",      value: "" });               renderBlockEditor(); updatePreview(); });
els.btnAddPhotoGridBlock.addEventListener("click", () => { state.storyBlocks.push({ type: "photo-grid", cols: 2, photos: ["", ""] }); renderBlockEditor(); updatePreview(); });
els.btnAddLinkBlock.addEventListener("click",      () => { state.storyBlocks.push({ type: "link",       name: "", url: "" });       renderBlockEditor(); updatePreview(); });

window.renderBlockEditor = renderBlockEditor;
