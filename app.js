const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const KEY = 'warRoomCommandConsole.v1';
let state = { locked:false, pins:[], mapDataUrl:null };

function setLocked(locked){
  state.locked = locked;
  $('#lockStatus').textContent = locked ? 'Locked' : 'Unlocked';
  $('#lockStatus').className = 'badge ' + (locked ? 'locked':'open');
  $$('#movementList input,#movementList textarea,#productionList input,#productionList textarea').forEach(el=>el.classList.toggle('lockedInput', locked));
}
function readState(){
  return {
    gameName: $('#gameName').value, round: $('#round').value, nation: $('#nation').value, player: $('#player').value,
    locked: state.locked, mapDataUrl: state.mapDataUrl, pins: state.pins,
    movement: $$('.movementCard').map(card=>({
      orderNumber: $('.orderNumber',card).value, commandId: $('.commandId',card).value, origin: $('.origin',card).value,
      destination: $('.destination',card).value, details: $('.details',card).value, notes: $('.notes',card).value
    })),
    production: $$('.productionCard').map(card=>({
      orderNumber: $('.orderNumber',card).value, build: $('.build',card).value, placement: $('.placement',card).value,
      cost: $('.cost',card).value, notes: $('.notes',card).value
    }))
  };
}
function applyState(data){
  $('#gameName').value=data.gameName||''; $('#round').value=data.round||1; $('#nation').value=data.nation||''; $('#player').value=data.player||'';
  $('#movementList').innerHTML=''; $('#productionList').innerHTML='';
  (data.movement||[]).forEach(addMovement); (data.production||[]).forEach(addProduction);
  state.pins=data.pins||[]; state.mapDataUrl=data.mapDataUrl||null; renderMap(); renderPins(); setLocked(!!data.locked); validate(); renderReveal();
}
function addMovement(data={}){
  const node = $('#movementTemplate').content.cloneNode(true); const card = node.querySelector('.movementCard');
  $('#movementList').appendChild(card);
  $('.orderNumber',card).value=data.orderNumber||($$('.movementCard').length);
  $('.commandId',card).value=data.commandId||''; $('.origin',card).value=data.origin||''; $('.destination',card).value=data.destination||'';
  $('.details',card).value=data.details||''; $('.notes',card).value=data.notes||'';
  $('.removeBtn',card).onclick=()=>{card.remove(); validate(); renderReveal();};
  $$('input,textarea',card).forEach(el=>el.addEventListener('input',()=>{validate(); renderReveal(); autosave();})); setLocked(state.locked);
}
function addProduction(data={}){
  const node = $('#productionTemplate').content.cloneNode(true); const card = node.querySelector('.productionCard');
  $('#productionList').appendChild(card);
  $('.orderNumber',card).value=data.orderNumber||($$('.productionCard').length);
  $('.build',card).value=data.build||''; $('.placement',card).value=data.placement||''; $('.cost',card).value=data.cost||''; $('.notes',card).value=data.notes||'';
  $('.removeBtn',card).onclick=()=>{card.remove(); validate(); renderReveal();};
  $$('input,textarea',card).forEach(el=>el.addEventListener('input',()=>{validate(); renderReveal(); autosave();})); setLocked(state.locked);
}
function validate(){
  const warnings=[]; const commands=new Map();
  $$('.movementCard').forEach((card,i)=>{
    const cmd=$('.commandId',card).value.trim(); const origin=$('.origin',card).value.trim(); const dest=$('.destination',card).value.trim();
    if(!cmd) warnings.push(`Movement order ${i+1}: missing Command / Force.`);
    if(!origin || !dest) warnings.push(`Movement order ${i+1}: missing origin or destination.`);
    if(origin && dest && origin.toLowerCase()===dest.toLowerCase()) warnings.push(`Movement order ${i+1}: origin and destination are the same.`);
    if(cmd){ if(commands.has(cmd)) warnings.push(`Duplicate Command / Force ${cmd}: War Room normally treats duplicate command orders as problematic, so check which one should stand.`); commands.set(cmd,true); }
  });
  $$('.productionCard').forEach((card,i)=>{ if(!$('.build',card).value.trim()) warnings.push(`Production order ${i+1}: missing build/action.`); });
  $('#warnings').innerHTML = warnings.length ? warnings.map(w=>`<div class="warning">${escapeHtml(w)}</div>`).join('') : '<p>No obvious issues found.</p>';
}
function renderReveal(){
  const d=readState();
  $('#revealSheet').innerHTML = `<h3>${escapeHtml(d.gameName||'War Room Game')} — Round ${escapeHtml(d.round||'')}</h3>
  <p><strong>Nation:</strong> ${escapeHtml(d.nation||'')} &nbsp; <strong>Player:</strong> ${escapeHtml(d.player||'')} &nbsp; <strong>Status:</strong> ${d.locked?'Locked':'Unlocked'}</p>
  <h4>Movement Orders</h4>${table(['#','Command','Origin','Destination','Details','Notes'], d.movement.map(o=>[o.orderNumber,o.commandId,o.origin,o.destination,o.details,o.notes]))}
  <h4>Production / Placement Orders</h4>${table(['#','Build / Action','Placement','Cost','Notes'], d.production.map(o=>[o.orderNumber,o.build,o.placement,o.cost,o.notes]))}`;
}
function table(headers, rows){ if(!rows.length) return '<p>None.</p>'; return `<table><thead><tr>${headers.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${r.map(c=>`<td>${escapeHtml(c||'')}</td>`).join('')}</tr>`).join('')}</tbody></table>`; }
function escapeHtml(s){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
function save(){ localStorage.setItem(KEY, JSON.stringify(readState())); }
function autosave(){ save(); }
function load(){ const raw=localStorage.getItem(KEY); if(raw) applyState(JSON.parse(raw)); else alert('No local save found.'); }
function renderMap(){ const img=$('#mapImg'), ph=$('#mapPlaceholder'); if(state.mapDataUrl){ img.src=state.mapDataUrl; img.style.display='block'; ph.style.display='none'; } else { img.removeAttribute('src'); img.style.display='none'; ph.style.display='block'; }}
function renderPins(){ const layer=$('#pinLayer'); layer.innerHTML=''; state.pins.forEach((p,i)=>{ const el=document.createElement('div'); el.className='pin'; el.style.left=p.x+'px'; el.style.top=p.y+'px'; el.textContent=i+1; el.title=p.note; el.onclick=()=>alert(p.note); layer.appendChild(el); }); }

$('#addMoveBtn').onclick=()=>{addMovement(); validate(); renderReveal();}; $('#addProdBtn').onclick=()=>{addProduction(); validate(); renderReveal();};
$('#lockBtn').onclick=()=>{setLocked(true); renderReveal(); save();}; $('#unlockBtn').onclick=()=>{ if(confirm('Unlock orders for editing?')) {setLocked(false); renderReveal(); save();} };
$('#saveBtn').onclick=()=>{save(); alert('Saved locally in this browser.');}; $('#loadBtn').onclick=load; $('#refreshRevealBtn').onclick=renderReveal; $('#printBtn').onclick=()=>{renderReveal(); window.print();};
$$('#gameName,#round,#nation,#player').forEach(el=>el.addEventListener('input',()=>{renderReveal(); autosave();}));
$('#exportBtn').onclick=()=>{ const blob=new Blob([JSON.stringify(readState(),null,2)],{type:'application/json'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='war-room-orders.json'; a.click(); URL.revokeObjectURL(a.href); };
$('#importJson').onchange=e=>{ const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=()=>applyState(JSON.parse(r.result)); r.readAsText(f); };
$('#mapUpload').onchange=e=>{ const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{state.mapDataUrl=r.result; renderMap(); save();}; r.readAsDataURL(f); };
$('#addPinBtn').onclick=()=>{ alert('Click the map where you want the note pin.'); $('#mapViewport').classList.add('addingPin'); };
$('#mapStage').onclick=e=>{ if(!$('#mapViewport').classList.contains('addingPin')) return; const rect=$('#mapStage').getBoundingClientRect(); const note=prompt('Pin note:'); if(note){ state.pins.push({x:e.clientX-rect.left,y:e.clientY-rect.top,note}); renderPins(); save(); } $('#mapViewport').classList.remove('addingPin'); };
$('#clearPinsBtn').onclick=()=>{ if(confirm('Clear all map note pins?')){state.pins=[];renderPins();save();} };
$('#territorySearch').addEventListener('input', e=>{ const q=e.target.value.toLowerCase(); $$('.pin').forEach((pin,i)=>{ pin.style.outline = state.pins[i]?.note.toLowerCase().includes(q) && q ? '4px solid white' : 'none'; }); });

addMovement(); addProduction(); validate(); renderReveal(); renderMap();
