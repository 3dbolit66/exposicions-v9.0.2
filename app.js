const $ = id => document.getElementById(id);
let people = [];
let selectedArtists = new Set();
let visitorNonce = 0;
const STORAGE_KEY = 'exposicions_v902_presets';
let exhibitionIdentity = null;
const LEGACY_KEYS = ['exposicions_v901_presets','exposicions_v900_presets','exposicions_v870_presets','exposicions_v850_presets','exposicions_v841_presets','exposicions_v840_presets'];

function escapeHtml(str){
  return String(str).replace(/[&<>\"]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]));
}
function fillSelects(){
  Object.entries(window.APP_DATA).forEach(([id, values]) => {
    const el = $(id); if(!el || el.tagName !== 'SELECT') return;
    el.innerHTML = values.map(v => `<option>${escapeHtml(v)}</option>`).join('');
  });
  fillArtistFilters();
}
function fillArtistFilters(){
  const disciplines = [...new Set(window.ARTIST_CATALOG.flatMap(a => a.disciplines || []))].sort((a,b)=>a.localeCompare(b,'ca'));
  const movements = [...new Set(window.ARTIST_CATALOG.flatMap(a => a.moviments || []))].sort((a,b)=>a.localeCompare(b,'ca'));
  const periods = [...new Set(window.ARTIST_CATALOG.map(a => a.periode).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ca'));
  $('artistDisciplineFilter').innerHTML = '<option value="">Totes les disciplines</option>' + disciplines.map(v=>`<option>${escapeHtml(v)}</option>`).join('');
  $('artistMovementFilter').innerHTML = '<option value="">Tots els moviments</option>' + movements.map(v=>`<option>${escapeHtml(v)}</option>`).join('');
  $('artistPeriodFilter').innerHTML = '<option value="">Tots els períodes</option>' + periods.map(v=>`<option>${escapeHtml(v)}</option>`).join('');
}
function state(){
  const s = {};
  Object.keys(window.APP_DATA).forEach(k => { const el=$(k); if(el) s[k]=el.value; });
  ['visitorCount','mainAge','additional','fictionCity','fictionInstitution','fictionArtist','curatorialTone','dossierLength'].forEach(k=>{const el=$(k);if(el)s[k]=el.value;});
  s.artistNames=[...selectedArtists].join(', ');
  s.visitorNonce=visitorNonce;
  return s;
}
function applyState(s, skipGenerate){
  const copy={...(s||{})};
  if(copy.additional==='Cap indicació addicional.') copy.additional='';
  Object.entries(copy).forEach(([k,v])=>{const el=$(k);if(el && v!=null) el.value=v;});
  selectedArtists=new Set((copy.artistNames||'').split(',').map(x=>x.trim()).filter(Boolean));
  syncArtistPickerVisibility(); syncSculptureVisibility(); syncSelfieCue(); syncCctvVisibility(); syncRecoveredVenueVisibility(); syncFictionControls(copy);
  renderArtistList(); renderArtistSelected(); updateArtistHelp();
  people=Engine.generateVisitors(state()); renderVisitorCards();
  if(!skipGenerate) generate(false);
}
function fillFictionControls(){
  $('fictionCity').innerHTML=window.FICTION_DB.cities.map(c=>`<option>${escapeHtml(c.name)}</option>`).join('');
  $('curatorialTone').innerHTML=window.FICTION_DB.tones.map(v=>`<option>${escapeHtml(v)}</option>`).join('');
  $('dossierLength').innerHTML=window.FICTION_DB.lengths.map(v=>`<option>${escapeHtml(v)}</option>`).join('');
  updateInstitutionOptions(); updateFictionArtistOptions();
}
function updateInstitutionOptions(preferred){
  const city=window.FICTION_DB.cities.find(c=>c.name===$('fictionCity').value)||window.FICTION_DB.cities[0];
  $('fictionInstitution').innerHTML=city.institutions.map(v=>`<option>${escapeHtml(v)}</option>`).join('');
  if(preferred && city.institutions.includes(preferred))$('fictionInstitution').value=preferred;
}
function updateFictionArtistOptions(preferred){
  const pool=ExhibitionEngine.compatibleArtists(state());
  $('fictionArtist').innerHTML='<option value="">— Aleatori compatible —</option>'+pool.map(a=>`<option>${escapeHtml(a.name)}</option>`).join('');
  if(preferred && pool.some(a=>a.name===preferred))$('fictionArtist').value=preferred;
}
function syncFictionControls(saved={}){
  if(!$('fictionCity').options.length)fillFictionControls();
  if(saved.fictionCity && [...$('fictionCity').options].some(o=>o.value===saved.fictionCity))$('fictionCity').value=saved.fictionCity;
  updateInstitutionOptions(saved.fictionInstitution);
  updateFictionArtistOptions(saved.fictionArtist);
  if(saved.curatorialTone)$('curatorialTone').value=saved.curatorialTone;
  if(saved.dossierLength)$('dossierLength').value=saved.dossierLength;
}
function syncCctvVisibility(){
  const cctv=$('photoStyle').value==='Càmera de seguretat / CCTV';
  $('cctvOptions').classList.toggle('hidden',!cctv);
  if(cctv)$('cameraType').value='Càmera de vigilància de sostre';
}
function syncRecoveredVenueVisibility(){
  const active=['Arquitectura recuperada / espai alternatiu','Espai industrial rehabilitat'].includes($('venue').value);
  $('recoveredVenueOptions').classList.toggle('hidden',!active);
  $('siteResponsiveOptions').classList.toggle('hidden',!active);
}
function regenerateExhibition(){
  exhibitionIdentity=ExhibitionEngine.makeIdentity({...state(),fictionInstitution:'',fictionArtist:''},exhibitionIdentity||{});
  $('fictionCity').value=exhibitionIdentity.city;
  updateInstitutionOptions(exhibitionIdentity.institution);
  updateFictionArtistOptions(exhibitionIdentity.artist.name);
  $('fictionArtist').value=exhibitionIdentity.artist.name;
  renderFictionIdentity();
  updateDossier();
}
function ensureExhibitionIdentity(){
  const s=state();
  const changed=!exhibitionIdentity || exhibitionIdentity.city!==s.fictionCity || exhibitionIdentity.institution!==s.fictionInstitution || (s.fictionArtist && exhibitionIdentity.artist.name!==s.fictionArtist) || (!s.fictionArtist && exhibitionIdentity.visualArtType!==s.artType);
  if(changed) exhibitionIdentity=ExhibitionEngine.makeIdentity(s,exhibitionIdentity||{});
  return exhibitionIdentity;
}
function renderFictionIdentity(){
  if(!exhibitionIdentity)return;
  const a=exhibitionIdentity.artist;
  $('fictionIdentity').innerHTML=`<b>${escapeHtml(exhibitionIdentity.title)}</b><br>${escapeHtml(a.name)} · ${escapeHtml(a.disciplines.join(' · '))}<br>${escapeHtml(exhibitionIdentity.institution)} · ${escapeHtml(exhibitionIdentity.city)}<br><span>${escapeHtml(exhibitionIdentity.dates)} · Comissariat: ${escapeHtml(exhibitionIdentity.curator)}</span>`;
}
function unifiedState(){
  const id=ensureExhibitionIdentity();
  return ExhibitionEngine.buildUnifiedExhibitionState(state(),id);
}
function updateDossier(){
  const id=ensureExhibitionIdentity();
  const unified=ExhibitionEngine.buildUnifiedExhibitionState(state(),id);
  renderFictionIdentity();
  $('dossierOutput').value=ExhibitionEngine.buildDossier(state(),id,unified);
}
function filteredArtists(){
  const q=$('artistSearch').value.trim().toLowerCase(), discipline=$('artistDisciplineFilter').value, movement=$('artistMovementFilter').value, period=$('artistPeriodFilter').value;
  return window.ARTIST_CATALOG.filter(a=>{
    if(discipline && !(a.disciplines||[]).includes(discipline)) return false;
    if(movement && !(a.moviments||[]).includes(movement)) return false;
    if(period && a.periode!==period) return false;
    if(q){const hay=[a.nom,a.periode,...(a.disciplines||[]),...(a.moviments||[]),...(a.paisos||[])].join(' ').toLowerCase();if(!hay.includes(q))return false;}
    return true;
  });
}
function renderArtistList(){
  const artists=filteredArtists();
  $('artistList').innerHTML=artists.slice(0,1000).map(a=>{
    const checked=selectedArtists.has(a.nom)?'checked':'';
    const years=a.mort?`${a.naixement||''}–${a.mort}`:(a.naixement?`n. ${a.naixement}`:'');
    const meta=[years,a.periode,...(a.moviments||[]).slice(0,2),...(a.disciplines||[]).slice(0,2)].filter(Boolean).join(' · ');
    return `<label class="artist-row"><input type="checkbox" data-artist="${escapeHtml(a.nom)}" ${checked}><span><b>${escapeHtml(a.nom)}</b><br><span class="artist-meta">${escapeHtml(meta)}</span></span></label>`;
  }).join('')||'<div class="note">No hi ha artistes que coincideixin amb aquests filtres.</div>';
  $('artistCountLabel').textContent=`${artists.length} disponibles · ${selectedArtists.size} seleccionat${selectedArtists.size===1?'':'s'}`;
  $('artistList').querySelectorAll('input[data-artist]').forEach(input=>input.addEventListener('change',()=>{
    if(input.checked) selectedArtists.add(input.dataset.artist); else selectedArtists.delete(input.dataset.artist);
    renderArtistSelected();updateArtistHelp();generate(false);
    $('artistCountLabel').textContent=`${artists.length} disponibles · ${selectedArtists.size} seleccionat${selectedArtists.size===1?'':'s'}`;
  }));
}
function renderArtistSelected(){
  const box=$('artistSelected');
  if(!selectedArtists.size){box.innerHTML='<span class="artist-meta">Cap artista seleccionat.</span>';return;}
  box.innerHTML=[...selectedArtists].map(name=>`<span class="selected-chip">${escapeHtml(name)} <button type="button" data-remove-artist="${escapeHtml(name)}" aria-label="Treure ${escapeHtml(name)}">×</button></span>`).join('');
  box.querySelectorAll('button[data-remove-artist]').forEach(btn=>btn.addEventListener('click',()=>{selectedArtists.delete(btn.dataset.removeArtist);renderArtistList();renderArtistSelected();updateArtistHelp();generate(false);}));
}
function syncArtistPickerVisibility(){$('artistPicker').classList.toggle('hidden',$('artistMode').value!=='Artista real (estil)');}
function isThreeDType(){return ['escultures','instal·lacions','obres tridimensionals','mixt expositiu'].includes($('artType').value);}
function syncSculptureVisibility(){
  const show=$('sculpturePresence').value!=='Cap'||isThreeDType();
  $('sculptureOptions').classList.toggle('hidden',!show);
}
function syncSelfieCue(){
  const selfie=$('photoStyle').value==='Selfie amb obres al darrere';
  $('selfieNotice').classList.toggle('hidden',!selfie);
  $('generateBtn').classList.toggle('selfie-action',selfie);
  $('generateBtn').textContent=selfie?'Genera Prompt Master + dossier · SELFIE':'Genera Prompt Master + dossier';
}
function updateArtistHelp(){
  const matched=Engine.artistMatches([...selectedArtists].join(', ')), box=$('artistHelp');
  if($('artistMode').value!=='Artista real (estil)'){box.innerHTML='<b>Autoria inventada.</b><div class="hint">Les obres es generaran com a originals i fictícies sense un artista real de referència.</div>';return;}
  if(!matched.length){box.innerHTML='<b>Selecciona almenys un artista.</b><div class="hint">Utilitza la cerca o els filtres i marca els artistes directament de la llista.</div>';return;}
  box.innerHTML=matched.map(a=>{
    const living=!a.custom && a.naixement!=null && a.mort==null;
    const details=a.custom?'Nom no inclòs al catàleg.':[a.periode,(a.moviments||[]).join(', '),(a.disciplines||[]).join(', '),(a.paisos||[]).join(', '),living?'artista viu/va':(a.mort?'artista històric/a':'classificació biogràfica no especificada')].filter(Boolean).join(' · ');
    return `<span class="chip"><b>${escapeHtml(a.nom)}</b> — ${escapeHtml(details)}</span>`;
  }).join('')+'<div class="hint">La validació també comprova si la disciplina seleccionada és coherent amb el tipus d’obra.</div>';
}
function renderVisitorCards(){
  $('visitorCards').innerHTML=people.length?people.map(p=>`<div class="card"><h3>Visitant ${p.id}</h3><p><b>${p.typology}, ${p.age} anys</b></p><p><b>Rol:</b> ${p.profile}</p><p><b>Vestuari:</b> ${p.outfit}</p><p><b>Bossa:</b> ${p.bag}</p><p><b>Pentinat:</b> ${p.hair}</p><p><b>Calçat:</b> ${p.shoes}</p><p><b>Activitat:</b> ${p.activity}</p><p><b>Motion blur:</b> ${p.motionBlur}</p></div>`).join(''):'<p class="note">No hi ha visitants secundaris.</p>';
}
function generate(regen=true){
  const n=Math.max(0,Math.min(12,Number($('visitorCount').value||0)));$('visitorCount').value=String(n);
  syncSelfieCue();syncSculptureVisibility();
  if(regen) people=Engine.generateVisitors(state());
  else if(!people.length && n>0) people=Engine.generateVisitors(state());
  if(people.length!==n) people=Engine.generateVisitors(state());
  renderVisitorCards();const id=ensureExhibitionIdentity();const unified=ExhibitionEngine.buildUnifiedExhibitionState(state(),id);$('output').value=Engine.buildPrompt(state(),people,unified);$('dossierOutput').value=ExhibitionEngine.buildDossier(state(),id,unified);renderFictionIdentity();renderAudit();
}
function renderAudit(){const {level,messages}=Engine.audit(state(),people);$('auditBox').className=`audit ${level}`;$('auditList').innerHTML=messages.map(m=>`<li>${escapeHtml(m)}</li>`).join('');}
function presets(){
  const base={...window.DEFAULT_PRESETS};let merged={...base};
  try{for(const key of LEGACY_KEYS) merged={...merged,...JSON.parse(localStorage.getItem(key)||'{}')};merged={...merged,...JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}')};}catch{}
  return merged;
}
function savePresetsMap(map){localStorage.setItem(STORAGE_KEY,JSON.stringify(map));refreshPresetSelect();}
function refreshPresetSelect(){const map=presets();$('presetSelect').innerHTML='<option value="">— Selecciona —</option>'+Object.keys(map).sort().map(name=>`<option>${escapeHtml(name)}</option>`).join('');}
function note(msg){$('presetStatus').textContent=msg;setTimeout(()=>$('presetStatus').textContent='',1600);}
function download(filename,content,mime){const blob=new Blob([content],{type:mime});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);}
function bind(){
  document.querySelectorAll('#tabs button').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('#tabs button,.tab').forEach(el=>el.classList.remove('active'));btn.classList.add('active');$(btn.dataset.tab).classList.add('active');}));
  const ids=['eventType','venue','wall','floor','lighting','furniture','spaceGeometry','cameraView','visualDepth','spatialElements','spatialVariety','season','dressCode','groupComposition','ageRange','visitorCount','diversityLevel','visualPersonality','socialDistribution','secondaryMotionBlur','artCount','artType','artStyle','frame','palette','museumMount','mainGender','mainAge','mainProfile','mainActivity','imageType','photographicRawness','photoStyle','format','artContent','artistApplication','artistReferenceIntensity','sculpturePresence','sculptureType','sculpturePosition','sculptureSupport','sculptureMaterial','sculptureScale','cameraType','shotSize','lens','cctvPosition','cctvFraming','cctvAesthetic','recoveredVenueType','interventionDegree','preservationState','buildingTrace','existingLight','architectureArtRelation','siteStrategy','siteScale','siteArtMode','curatorialLogic','conceptSource','curatorialDensity','metaphorAxis'];
  ids.forEach(id=>{const el=$(id);if(el)el.addEventListener('change',()=>{if(id==='photoStyle'){syncSelfieCue();syncCctvVisibility();}if(id==='venue')syncRecoveredVenueVisibility();if(id==='artType'||id==='sculpturePresence')syncSculptureVisibility();if(id==='artType')updateFictionArtistOptions($('fictionArtist').value);generate(true);});});
  $('additional').addEventListener('input',()=>generate(false));
  $('artistMode').addEventListener('change',()=>{syncArtistPickerVisibility();updateArtistHelp();generate(false);});
  $('artistSearch').addEventListener('input',renderArtistList);
  ['artistDisciplineFilter','artistMovementFilter','artistPeriodFilter'].forEach(id=>$(id).addEventListener('change',renderArtistList));
  $('randomArtistBtn').addEventListener('click',()=>{const pool=filteredArtists();if(!pool.length)return;selectedArtists.add(pool[Math.floor(Math.random()*pool.length)].nom);renderArtistList();renderArtistSelected();updateArtistHelp();generate(false);});
  $('clearArtistsBtn').addEventListener('click',()=>{selectedArtists.clear();renderArtistList();renderArtistSelected();updateArtistHelp();generate(false);});
  $('regenBtn').addEventListener('click',()=>{visitorNonce++;people=Engine.generateVisitors(state());renderVisitorCards();const id=ensureExhibitionIdentity();const unified=ExhibitionEngine.buildUnifiedExhibitionState(state(),id);$('output').value=Engine.buildPrompt(state(),people,unified);$('dossierOutput').value=ExhibitionEngine.buildDossier(state(),id,unified);renderFictionIdentity();renderAudit();});
  $('generateBtn').addEventListener('click',()=>generate(true));$('randomBtn').addEventListener('click',randomize);$('resetBtn').addEventListener('click',resetAll);
  $('copyBtn').addEventListener('click',async()=>{await navigator.clipboard.writeText($('output').value);$('status').textContent='Copiat.';setTimeout(()=>$('status').textContent='',1200);});
  $('downloadBtn').addEventListener('click',()=>download('prompt-exposicions-v9.0.2.txt',$('output').value,'text/plain;charset=utf-8'));
  $('downloadDossierBtn').addEventListener('click',()=>download('dossier-exposicio-ficticia-v9.0.2.txt',$('dossierOutput').value,'text/plain;charset=utf-8'));
  $('downloadJsonBtn').addEventListener('click',()=>download('exposicio-ficticia-v9.0.2.json',JSON.stringify(ExhibitionEngine.serialize(state(),ensureExhibitionIdentity(),$('output').value,$('dossierOutput').value,unifiedState()),null,2),'application/json'));
  $('savePresetBtn').addEventListener('click',()=>{const name=$('presetName').value.trim();if(!name)return note('Escriu un nom.');const map=presets();map[name]=state();savePresetsMap(map);$('presetSelect').value=name;note('Preset desat.');});
  $('loadPresetBtn').addEventListener('click',()=>{const name=$('presetSelect').value;if(!name)return note('Selecciona un preset.');applyState(presets()[name]);$('presetName').value=name;note('Preset carregat.');});
  $('deletePresetBtn').addEventListener('click',()=>{const name=$('presetSelect').value;if(!name)return note('Selecciona un preset.');const map=presets();delete map[name];savePresetsMap(map);note('Preset eliminat.');});
  $('exportPresetsBtn').addEventListener('click',()=>download('presets-exposicions-v9.0.2.json',JSON.stringify(presets(),null,2),'application/json'));
  $('importPresetsInput').addEventListener('change',async e=>{try{const incoming=JSON.parse(await e.target.files[0].text());savePresetsMap({...presets(),...incoming});note('Presets importats.');}catch{note('JSON no vàlid.');}});
  $('regenExhibitionBtn').addEventListener('click',()=>regenerateExhibition());
  $('fictionCity').addEventListener('change',()=>{updateInstitutionOptions();updateFictionArtistOptions();exhibitionIdentity=null;generate(false);});
  $('fictionInstitution').addEventListener('change',()=>{exhibitionIdentity=null;generate(false);});
  $('fictionArtist').addEventListener('change',()=>{exhibitionIdentity=null;generate(false);});
  ['curatorialTone','dossierLength'].forEach(id=>$(id).addEventListener('change',()=>updateDossier()));
  document.querySelectorAll('.output-switch button').forEach(btn=>btn.addEventListener('click',()=>{document.querySelectorAll('.output-switch button,.output-pane').forEach(el=>el.classList.remove('active'));btn.classList.add('active');$(btn.dataset.output).classList.add('active');}));

}
function randomize(){
  Object.entries(window.APP_DATA).forEach(([id,values])=>{const el=$(id);if(el&&el.tagName==='SELECT')el.selectedIndex=Math.floor(Math.random()*values.length);});
  $('visitorCount').value=String(Math.floor(Math.random()*6));$('mainAge').value=String(24+Math.floor(Math.random()*50));$('additional').value='';visitorNonce++;
  selectedArtists.clear();if($('artistMode').value==='Artista real (estil)'){const pool=window.ARTIST_CATALOG;selectedArtists.add(pool[Math.floor(Math.random()*pool.length)].nom);}
  syncArtistPickerVisibility();syncSculptureVisibility();syncSelfieCue();syncCctvVisibility();syncRecoveredVenueVisibility();renderArtistList();renderArtistSelected();updateArtistHelp();exhibitionIdentity=null;generate(true);
}
function resetAll(){
  visitorNonce=0;$('artistSearch').value='';$('artistDisciplineFilter').value='';$('artistMovementFilter').value='';$('artistPeriodFilter').value='';
  applyState({imageType:'Fotografia realista documental',photographicRawness:'Documental realista',photoStyle:'Frontal expositiu estàndard',eventType:'Visita quotidiana',venue:'Galeria contemporània minimalista',wall:'blanca',floor:'microciment',lighting:'il·luminació suau de museu',furniture:'sense bancs',spaceGeometry:'Obertura cap a una altra sala',cameraView:'Diagonal suau',visualDepth:'Alta',spatialElements:'Parets laterals i obertura al fons',spatialVariety:'Alta',season:'Estiu',dressCode:'Elegant',groupComposition:'grup mixt',ageRange:'adults',visitorCount:'3',format:'3:2 horitzontal',mainGender:'Dona',mainAge:'42',mainProfile:'Galerista',mainActivity:'Observant l’obra',diversityLevel:'Alta',visualPersonality:'Minimalista',socialDistribution:'Principalment individuals',secondaryMotionBlur:'Cap',artContent:'Obres visibles',artCount:'3 obres mitjanes',artType:'pintures',artStyle:'minimalista',frame:'sense marc',palette:'blanc i negre',museumMount:'centre visual a l’alçada dels ulls dels adults',artistMode:'Inventat',artistApplication:'Totes les obres amb el mateix artista',artistReferenceIntensity:'Mitjana',artistNames:'',sculpturePresence:'Cap',sculptureType:'Escultura exempta',sculpturePosition:'Centre de la sala',sculptureSupport:'Peanya blanca baixa',sculptureMaterial:'Bronze',sculptureScale:'Mitjana',cameraType:'Càmera fotogràfica documental',shotSize:'pla general: figures senceres amb una porció clara de sala',lens:'angular moderat 28–35 mm, perspectiva ambiental natural',cctvPosition:'Damunt de l’entrada d’una sala',cctvFraming:'Enquadrament funcional ampli',cctvAesthetic:'CCTV discret de museu',recoveredVenueType:'Antiga fàbrica / nau industrial',interventionDegree:'Reversible — elements museogràfics independents',preservationState:'Conservat amb desgast',buildingTrace:'Encavallades, pilars i conduccions originals',existingLight:'Grans finestrals industrials',architectureArtRelation:'Equilibri obra / arquitectura',siteStrategy:'Adaptació',siteScale:'Arquitectònica',siteArtMode:'Automàtic segons l’espai',curatorialLogic:'Material',conceptSource:'Obra',curatorialDensity:'3 — institucional estàndard',metaphorAxis:'Automàtic',fictionCity:'Barcelona',fictionInstitution:'Centre Llevant d’Art Contemporani',fictionArtist:'',curatorialTone:'Institucional',dossierLength:'Estàndard',additional:''});
}
document.addEventListener('DOMContentLoaded',()=>{fillSelects();fillFictionControls();bind();refreshPresetSelect();resetAll();syncCctvVisibility();syncRecoveredVenueVisibility();regenerateExhibition();});
