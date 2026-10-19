(() => {
const PIN_HASH = "17e34f6c328700a4e9b35f5f1ac5eaafddd3db074d47bcd4d345e0acaf233781";
const KEY = "espir-nenagh-orders-v1", SEQ = "espir-nenagh-seq-v1";
const $ = s => document.querySelector(s);
const eur = n => "€" + (Math.round((+n || 0) * 100) / 100).toLocaleString("en-IE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const P = id => CATALOG.find(p => p.id === id);
const load = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
const save = o => localStorage.setItem(KEY, JSON.stringify(o));
if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});

// ---------- order form ----------
let lines = [];
const newLine = () => ({ pid: "", size: "", colour: "", parts: {}, inits: [], qty: 1, unit: null, edited: false, oname: "", osize: "" });

function basePrice(l) {
  const p = P(l.pid); if (!p) return null;
  if (p.other) return l.unit;
  if (p.sizes) return l.size ? p.sizes[l.size] : Math.min(...Object.values(p.sizes));
  return p.price;
}
function initExtra(l) { const p = P(l.pid); if (!p || !p.initials) return 0; return p.initials.reduce((a, d, i) => a + ((l.inits[i] || "").trim() ? d.add : 0), 0); }
function unitOf(l) { return l.edited || P(l.pid)?.other ? (l.unit ?? 0) : (basePrice(l) ?? 0); }
function lineTotal(l) { if (!l.pid) return 0; return (unitOf(l) + initExtra(l)) * (l.qty || 0); }

function opt(v, label, sel) { return `<option value="${esc(v)}"${v === sel ? " selected" : ""}>${esc(label)}</option>`; }
function productSelect(l) {
  let h = opt("", "Choose item…", l.pid), g = null;
  for (const p of CATALOG) {
    if (p.group !== g) { if (g) h += "</optgroup>"; h += `<optgroup label="${esc(p.group)}">`; g = p.group; }
    const from = p.sizes ? Math.min(...Object.values(p.sizes)) : p.price;
    h += opt(p.id, p.name + (from != null ? `  –  ${p.sizes && new Set(Object.values(p.sizes)).size > 1 ? "from " : ""}${eur(from)}` : ""), l.pid);
  }
  return h + "</optgroup>";
}
function renderLines() {
  $("#lines").innerHTML = lines.map((l, i) => {
    const p = P(l.pid);
    let body = "";
    if (p?.other) {
      body += `<label class="lbl">What is it?</label><input data-i="${i}" data-k="oname" value="${esc(l.oname)}" placeholder="e.g. Goalkeeper gloves">
        <label class="lbl">Size</label><input data-i="${i}" data-k="osize" value="${esc(l.osize)}" placeholder="optional">`;
    }
    if (p?.sizes) {
      body += `<label class="lbl">Size *</label><select class="big" data-i="${i}" data-k="size">${opt("", "Choose size…", l.size)}${Object.entries(p.sizes).map(([s, pr]) => opt(s, `${s}  –  ${eur(pr)}`, l.size)).join("")}</select>`;
      if (p.note) body += `<div class="note">${esc(p.note)}</div>`;
    }
    if (p?.colours) body += `<label class="lbl">Colour *</label><select class="big" data-i="${i}" data-k="colour">${opt("", "Choose colour…", l.colour)}${p.colours.map(c => opt(c, c, l.colour)).join("")}</select>`;
    if (p?.parts) body += p.parts.map(([name, sizes]) => `<label class="lbl">${esc(name)} size *</label><select class="big" data-i="${i}" data-part="${esc(name)}">${opt("", "Choose size…", l.parts[name] || "")}${sizes.map(s => opt(s, s, l.parts[name] || "")).join("")}</select>`).join("");
    if (p?.initials) body += p.initials.map((d, j) => `<label class="lbl">${esc(d.label)} (optional, max ${d.max}, +${eur(d.add)})</label><input class="big" data-i="${i}" data-init="${j}" maxlength="${d.max}" autocapitalize="characters" value="${esc(l.inits[j] || "")}" placeholder="Leave blank for none">`).join("");
    if (p) {
      body += `<div class="row"><div><label class="lbl">Quantity</label><div class="qty"><button type="button" data-i="${i}" data-q="-1">−</button><input class="big" type="number" inputmode="numeric" min="1" data-i="${i}" data-k="qty" value="${l.qty}"><button type="button" data-i="${i}" data-q="1">+</button></div></div>
        <div><label class="lbl">Price each €</label><input class="big" type="number" inputmode="decimal" step="0.01" min="0" data-i="${i}" data-k="unit" value="${p.other ? (l.unit ?? "") : unitOf(l)}" placeholder="0.00"></div></div>`;
      body += `<div class="ltotal" id="lt-${i}">${lineSummary(l)}</div>`;
    }
    return `<section class="card line"><div class="lhead"><span>Item ${i + 1}</span>${lines.length > 1 ? `<button class="rm" data-rm="${i}">Remove</button>` : ""}</div>
      <label class="lbl">Item *</label><select class="big" data-i="${i}" data-k="pid">${productSelect(l)}</select>${body}</section>`;
  }).join("");
  updateTotals();
}
function lineSummary(l) { const x = initExtra(l); return `${l.qty} × ${eur(unitOf(l) + x)}${x ? ` <small>(incl. ${eur(x)} initials)</small>` : ""} = ${eur(lineTotal(l))}`; }
function updateTotals() {
  const t = lines.reduce((a, l) => a + lineTotal(l), 0), n = lines.filter(l => l.pid).reduce((a, l) => a + (+l.qty || 0), 0);
  $("#st-amt").textContent = eur(t);
  $("#st-items").textContent = n ? `${n} item${n > 1 ? "s" : ""}` : "No items yet";
  lines.forEach((l, i) => { const el = document.getElementById("lt-" + i); if (el) el.innerHTML = lineSummary(l); });
}
$("#lines").addEventListener("input", e => {
  const t = e.target, i = +t.dataset.i, l = lines[i]; if (!l) return;
  if (t.dataset.init != null) { l.inits[+t.dataset.init] = t.value.toUpperCase(); t.value = l.inits[+t.dataset.init]; return updateTotals(); }
  if (t.dataset.part) { l.parts[t.dataset.part] = t.value; return; }
  const k = t.dataset.k;
  if (k === "qty") { l.qty = Math.max(0, parseInt(t.value) || 0); return updateTotals(); }
  if (k === "unit") { l.unit = t.value === "" ? null : +t.value; l.edited = !P(l.pid)?.other; return updateTotals(); }
  if (k === "oname" || k === "osize") { l[k] = t.value; return; }
});
$("#lines").addEventListener("change", e => {
  const t = e.target, i = +t.dataset.i, l = lines[i]; if (!l) return;
  const k = t.dataset.k;
  if (k === "pid") { lines[i] = { ...newLine(), pid: t.value, qty: l.qty || 1 }; return renderLines(); }
  if (k === "size") { l.size = t.value; l.edited = false; return renderLines(); }
  if (k === "colour") { l.colour = t.value; return; }
  if (k === "qty" && l.qty < 1) { l.qty = 1; renderLines(); }
});
$("#lines").addEventListener("click", e => {
  const t = e.target;
  if (t.dataset.rm != null) { lines.splice(+t.dataset.rm, 1); return renderLines(); }
  if (t.dataset.q != null) { const l = lines[+t.dataset.i]; l.qty = Math.max(1, (l.qty || 0) + +t.dataset.q); return renderLines(); }
});
$("#addline").onclick = () => { lines.push(newLine()); renderLines(); window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" }); };

function describe(l) {
  const p = P(l.pid), bits = [];
  if (p.other) { if (l.osize) bits.push("Size " + l.osize); }
  if (l.size) bits.push("Size " + l.size);
  if (l.colour) bits.push(l.colour);
  if (p.parts) bits.push(p.parts.map(([n]) => `${n} ${l.parts[n]}`).join(", "));
  const inits = (p.initials || []).map((d, j) => (l.inits[j] || "").trim() ? `${d.label === "Initials" ? "Initials" : d.label}: ${l.inits[j].trim()}` : "").filter(Boolean);
  return { item: p.other ? (l.oname.trim() || "Other") : p.name, sizes: bits.join(" · "), initials: inits.join(" · ") };
}
$("#process").onclick = () => {
  const name = $("#cname").value.trim(), phone = $("#cphone").value.trim(), errs = [];
  if (!name) errs.push("Enter the customer's name.");
  if (phone.replace(/\D/g, "").length < 7) errs.push("Enter a valid phone number.");
  const used = lines.filter(l => l.pid);
  if (!used.length) errs.push("Add at least one item.");
  lines.forEach((l, i) => {
    const p = P(l.pid); if (!p) return;
    if (p.sizes && !l.size) errs.push(`Item ${i + 1}: choose a size.`);
    if (p.colours && !l.colour) errs.push(`Item ${i + 1}: choose a colour.`);
    if (p.parts) p.parts.forEach(([n]) => { if (!l.parts[n]) errs.push(`Item ${i + 1}: choose ${n} size.`); });
    if (p.other && !l.oname.trim()) errs.push(`Item ${i + 1}: say what the item is.`);
  });
  const box = $("#formerr");
  if (errs.length) { box.innerHTML = errs.map(esc).join("<br>"); box.hidden = false; box.scrollIntoView({ behavior: "smooth", block: "center" }); return; }
  box.hidden = true;
  const seq = (parseInt(localStorage.getItem(SEQ)) || 0) + 1; localStorage.setItem(SEQ, seq);
  const items = used.map(l => { const d = describe(l); return { ...d, qty: l.qty, unit: unitOf(l), initialsExtra: initExtra(l), total: lineTotal(l) }; });
  const order = { no: "N" + String(seq).padStart(3, "0"), created: new Date().toISOString(), name, phone, player: $("#cplayer").value.trim(), notes: $("#cnotes").value.trim(), items, total: items.reduce((a, x) => a + x.total, 0), status: "Awaiting payment", method: "", paidAt: "" };
  const all = load(); all.push(order); save(all);
  $("#d-no").textContent = "Order " + order.no;
  $("#d-sum").innerHTML = `<p><b>${esc(name)}</b> · ${esc(phone)}${order.player ? " · " + esc(order.player) : ""}</p>` + items.map(x => `<div class="sumline"><div>${x.qty} × ${esc(x.item)}<small>${esc([x.sizes, x.initials].filter(Boolean).join(" · "))}</small></div><b>${eur(x.total)}</b></div>`).join("");
  $("#d-total").textContent = "Total " + eur(order.total);
  show("done");
};
function resetForm() { ["#cname", "#cphone", "#cplayer", "#cnotes"].forEach(s => $(s).value = ""); lines = [newLine()]; renderLines(); }
$("#next").onclick = () => { resetForm(); show("form"); };

// ---------- orders view ----------
let filter = "await";
async function sha(s) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, "0")).join(""); }
async function tryPin() { if (await sha($("#pin").value.trim()) === PIN_HASH) { sessionStorage.setItem("unlocked", "1"); $("#pin").value = ""; $("#pinerr").hidden = true; renderOrders(); } else $("#pinerr").hidden = false; }
$("#pinok").onclick = tryPin; $("#pin").addEventListener("keydown", e => { if (e.key === "Enter") tryPin(); });
$("#lock").onclick = () => { sessionStorage.removeItem("unlocked"); renderOrders(); };
document.querySelectorAll(".tab").forEach(b => b.onclick = () => { filter = b.dataset.f; document.querySelectorAll(".tab").forEach(x => x.classList.toggle("on", x === b)); renderOrders(); });
$("#search").addEventListener("input", () => renderOrders());
function renderOrders() {
  const ok = sessionStorage.getItem("unlocked") === "1";
  $("#pinbox").hidden = ok; $("#orders").hidden = !ok; if (!ok) return;
  const all = load(), sum = f => all.filter(f).reduce((a, o) => a + o.total, 0);
  const aw = all.filter(o => o.status !== "Paid");
  $("#stats").innerHTML = `<div class="stat"><span>Awaiting (${aw.length})</span><b>${eur(sum(o => o.status !== "Paid"))}</b></div>
    <div class="stat"><span>Paid total</span><b>${eur(sum(o => o.status === "Paid"))}</b></div>
    <div class="stat"><span>Paid cash</span><b>${eur(sum(o => o.method === "Cash"))}</b></div>
    <div class="stat"><span>Paid card</span><b>${eur(sum(o => o.method === "Card"))}</b></div>`;
  const q = $("#search").value.trim().toLowerCase();
  const list = all.filter(o => filter === "all" || (filter === "paid" ? o.status === "Paid" : o.status !== "Paid"))
    .filter(o => !q || (o.name + " " + o.phone + " " + o.no + " " + o.player).toLowerCase().includes(q)).reverse();
  $("#olist").innerHTML = list.length ? list.map(o => `<section class="card order"><div class="oh"><div><div class="on">${esc(o.no)}</div><div class="cn">${esc(o.name)}</div>
      <a href="tel:${esc(o.phone.replace(/[^\d+]/g, ""))}">${esc(o.phone)}</a>${o.player ? ` · ${esc(o.player)}` : ""}<br><small>${new Date(o.created).toLocaleString("en-IE", { weekday: "short", hour: "2-digit", minute: "2-digit" })}</small></div>
      <div><div class="ot">${eur(o.total)}</div><span class="pill ${o.status === "Paid" ? "paid" : "await"}">${o.status === "Paid" ? "Paid · " + esc(o.method) : "Awaiting payment"}</span></div></div>
      <ul>${o.items.map(x => `<li>${x.qty} × ${esc(x.item)} ${x.sizes || x.initials ? `<small>(${esc([x.sizes, x.initials].filter(Boolean).join(" · "))})</small>` : ""} – ${eur(x.total)}</li>`).join("")}</ul>
      ${o.notes ? `<div class="note">Note: ${esc(o.notes)}</div>` : ""}
      ${o.status === "Paid" ? `<div class="paybtns"><button class="btn small" data-undo="${o.no}">Undo paid</button><button class="btn del" data-del="${o.no}">Delete</button></div>`
        : `<div class="paybtns"><button class="btn cash" data-pay="${o.no}" data-m="Cash">Paid – Cash</button><button class="btn cardp" data-pay="${o.no}" data-m="Card">Paid – Card</button></div><div class="paybtns"><button class="btn del" data-del="${o.no}">Delete order</button></div>`}
    </section>`).join("") : `<section class="card foot">No orders here yet.</section>`;
}
$("#olist").addEventListener("click", e => {
  const t = e.target, all = load();
  const o = all.find(x => x.no === (t.dataset.pay || t.dataset.undo || t.dataset.del)); if (!o) return;
  if (t.dataset.pay) { o.status = "Paid"; o.method = t.dataset.m; o.paidAt = new Date().toISOString(); }
  else if (t.dataset.undo) { o.status = "Awaiting payment"; o.method = ""; o.paidAt = ""; }
  else if (t.dataset.del) { if (!confirm(`Delete order ${o.no} for ${o.name}? This cannot be undone.`)) return; all.splice(all.indexOf(o), 1); }
  save(all); renderOrders();
});
function download(name, text, type) { const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); }
const stamp = () => new Date().toISOString().slice(0, 16).replace(/[:T]/g, "-");
function toCSV() {
  const cell = v => { v = String(v ?? ""); return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v; };
  const rows = [["Order", "Created", "Customer", "Phone", "Player", "Status", "Payment method", "Paid at", "Item", "Sizes / colour", "Initials", "Qty", "Unit price", "Initials extra (each)", "Line total", "Order total", "Notes"]];
  for (const o of load()) o.items.forEach(x => rows.push([o.no, new Date(o.created).toLocaleString("en-IE"), o.name, o.phone, o.player, o.status, o.method, o.paidAt ? new Date(o.paidAt).toLocaleString("en-IE") : "", x.item, x.sizes, x.initials, x.qty, x.unit.toFixed(2), x.initialsExtra.toFixed(2), x.total.toFixed(2), o.total.toFixed(2), o.notes]));
  return "\ufeff" + rows.map(r => r.map(cell).join(",")).join("\r\n");
}
window.__toCSV = toCSV;
$("#csv").onclick = () => download(`nenagh-afc-orders-${stamp()}.csv`, toCSV(), "text/csv");
$("#backup").onclick = () => download(`nenagh-afc-orders-backup-${stamp()}.json`, JSON.stringify({ seq: localStorage.getItem(SEQ), orders: load() }, null, 1), "application/json");
$("#restore").onchange = async e => {
  const f = e.target.files[0]; if (!f) return;
  try { const d = JSON.parse(await f.text()); const cur = load(), have = new Set(cur.map(o => o.no + o.created));
    const add = (d.orders || []).filter(o => !have.has(o.no + o.created)); save(cur.concat(add));
    if ((+d.seq || 0) > (parseInt(localStorage.getItem(SEQ)) || 0)) localStorage.setItem(SEQ, d.seq);
    alert(`Restored ${add.length} order(s).`); renderOrders(); } catch { alert("That file isn't a valid backup."); }
  e.target.value = "";
};

// ---------- routing ----------
function show(v) {
  for (const n of ["form", "done", "orders"]) $("#view-" + n).hidden = n !== v;
  $("#navbtn").textContent = v === "orders" ? "New order" : "Orders";
  $("#navbtn").href = v === "orders" ? "#" : "#orders";
  if (v === "orders") renderOrders();
  window.scrollTo(0, 0);
}
function route() { show(location.hash === "#orders" ? "orders" : ($("#view-done").hidden ? "form" : "done")); }
window.addEventListener("hashchange", () => { if (location.hash !== "#orders") $("#view-done").hidden = true; route(); });
window.addEventListener("beforeunload", e => { if (!$("#view-form").hidden && ($("#cname").value || lines.some(l => l.pid))) { e.preventDefault(); e.returnValue = ""; } });
resetForm(); route();
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
