window.Engine = (() => {
  const AGE_POOLS={
    'joves adults':[18,20,23,26,29,32], 'adults':[35,39,42,48,55,61],
    'adults de 30 a 70 anys':[31,39,47,56,64,69], 'gent gran':[63,69,75,81], 'edats mixtes':[18,27,39,54,68,79]
  };
  const COLORS=['ivori','camel','taupe','verd oliva','blau petroli','terracota','bordeus','pruna','mostassa','cacau','grafit','gris pedra','blau tinta','rosa empolsat'];
  const ROLE_AGES={
    'Estudiant de Belles Arts':[18,35],'Estudiant de Disseny':[18,35],'Artista emergent':[20,45],'Fotògraf independent':[20,80],
    'Professor d’Art':[28,80],'Arquitecte':[24,80],'Interiorista':[22,80],'Galerista':[25,80],'Comissari':[25,80],
    'Conservador de museu':[28,80],'Crític cultural':[25,85],'Col·leccionista':[28,90],'Mecenes':[35,90],
    'Visitant habitual':[16,95],'Turista cultural':[16,95]
  };
  const MOVING_ACTIVITY='Caminant davant les obres';
  function pick(arr,seed){return arr[Math.abs(seed)%arr.length]}
  function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
  function seasonGuide(v){return {'Estiu':'teixits lleugers, seda, lli i cotó; màniga curta o sense mànigues; calçat lleuger; cap abric','Entretemps':'americanes lleugeres, jaquetes fines, capes subtils, mocassins i botins baixos','Hivern':'llana, tweed, caixmir, vestits de punt, abrics, capes i botes'}[v]||'vestuari coherent amb la climatologia i l’espai';}
  function imageTypeMeta(type){
    const map={
      'Fotografia realista documental':{objective:'Crear una fotografia documental fotorealista d’una escena d’exposició d’art, espontània, observacional, natural i creïble.',treatment:'Aparença de fotografia documental contemporània: llum creïble, textures reals, pell i teixits naturals, sensació d’instant captat sense posat, processat discret i colorimetria realista. Prioritzar autenticitat per sobre de perfecció comercial.',negatives:['no look publicitari','no retoc de bellesa excessiu','no pell plàstica','no il·luminació de producte','no poses de campanya','no estilització artificial']},
      'Imatge publicitària':{objective:'Crear una imatge publicitària fotorealista d’una escena d’exposició d’art, sofisticada, aspiracional, neta i creïble.',treatment:'Acabat publicitari premium: composició clara, direcció d’art controlada, il·luminació polida, materials nítids, contrast elegant i qualitat de campanya d’alta gamma.',negatives:['no aspecte amateur','no llum accidental pobra','no enquadrament descuidat','no soroll visual','no retoc plàstic']},
      'Imatge editorial':{objective:'Crear una fotografia editorial fotorealista d’una escena d’exposició d’art, neta, natural, creïble, sofisticada i controlada.',treatment:'Estètica editorial contemporània de revista: naturalitat amb direcció d’art subtil, composició sofisticada, llum controlada però creïble i narrativa visual.',negatives:['no look de catàleg banal','no publicitat massa brillant','no posats artificials','no retoc excessiu']},
      'Llibre per colorejar realista':{objective:'Crear una pàgina de llibre per colorejar realista basada en una escena d’exposició d’art, amb anatomia humana natural i proporcions creïbles.',treatment:'Line art realista: contorns negres nets sobre fons blanc pur, proporcions reals, detalls interiors selectius i àrees obertes per pintar. Sense color, grisos, ombrejat tonal ni degradats.',negatives:['no cartoon','no manga','no anime','no chibi','no caricatura','no pin-up','no color','no grisos','no ombrejat','no degradats','no trames tonals']},
      'Dibuix de línia realista B/N pur':{objective:'Crear un dibuix de línia realista en blanc i negre pur d’una escena d’exposició d’art, amb proporcions reals.',treatment:'Només línies negres nítides sobre blanc pur, sense cap altre valor tonal. Contorns precisos, aparença basada en una fotografia real.',negatives:['no color','no gris','no ombrejat','no degradats','no tramats','no pintura','no aquarel·la','no cartoon','no manga']}
    }; return map[type]||map['Fotografia realista documental'];
  }
  function standardNegatives(){return ['no clons','no fila perfecta','no perfils incompatibles amb l’edat','no vestuari incompatible amb la temporada o el gènere','no outfits repetits','no uniformitat cromàtica','no anatomia impossible','no peus tallats','no carteles grans','no logotips','no marques d’aigua','no subtítols','no postures hieràtiques','no cossos completament verticals i simètrics','no braços rectes enganxats al cos','no persones col·locades com maniquins','no poses de catàleg','no rigidesa corporal','no repetició de la mateixa postura'];}
  function selfieNegatives(){return ['no selfie de mirall','no figura principal de perfil extrem','no càmera massa allunyada que anul·li l’efecte selfie','no protagonista amagada o tapada','no motion blur a la figura principal','no tots els personatges amb motion blur','no blur global de tota la imatge','no obres desenfocades','no fons desenfocat per error','no efecte fantasma exagerat','no smear digital artificial'];}
  function profilePool(comp,eventType){
    if(comp==='estudiants i artistes emergents')return ['Estudiant de Belles Arts','Estudiant de Disseny','Artista emergent','Fotògraf independent','Comissari'];
    if(['Vernissage','Inauguració privada','Gran inauguració VIP','Fira internacional d’art'].includes(eventType))return ['Galerista','Comissari','Artista emergent','Crític cultural','Col·leccionista','Fotògraf independent','Mecenes'];
    if(comp==='col·leccionistes i galeristes')return ['Col·leccionista','Galerista','Comissari','Mecenes','Crític cultural'];
    return ['Visitant habitual','Turista cultural','Estudiant de Belles Arts','Estudiant de Disseny','Professor d’Art','Arquitecte','Interiorista','Fotògraf independent'];
  }
  function inferGender(comp,i){if(comp==='dones')return'Dona';if(comp==='homes')return'Home';if(comp==='parella')return i%2===0?'Home':'Dona';return i%2===0?'Dona':'Home';}
  function roleForAge(pool,age,seed){const eligible=pool.filter(p=>{const r=ROLE_AGES[p]||[16,95];return age>=r[0]&&age<=r[1];});return pick(eligible.length?eligible:['Visitant habitual','Turista cultural'],seed);}
  function displayProfile(profile,gender){
    if(gender!=='Dona')return profile;
    return {'Fotògraf independent':'Fotògrafa independent','Professor d’Art':'Professora d’Art','Arquitecte':'Arquitecta','Comissari':'Comissària','Conservador de museu':'Conservadora de museu','Crític cultural':'Crítica cultural'}[profile]||profile;
  }
  function outfitFor(profile,gender,season,dress,seed){
    const creative=['Estudiant de Belles Arts','Estudiant de Disseny','Artista emergent','Fotògraf independent'].includes(profile);
    let pool;
    if(gender==='Dona'){
      if(season==='Hivern') pool=creative?['pantalons de pana amb jersei de llana','faldilla midi amb jersei de coll alt i jaqueta curta','pantalons rectes amb cardigan de llana']:['vestit de punt amb abric lleuger','sastreria de llana suau','pantalons de llana amb brusa i americana'];
      else if(creative) pool=['faldilla llarga de segona mà amb top lleuger','pantalons amples amb camisa oversized','vestit midi de cotó amb jaqueta molt lleugera','carpenter pants amb top de punt'];
      else pool=['sastreria desestructurada lleugera','vestit midi de lli','pantalons fluids amb brusa de seda','faldilla midi amb top de seda'];
    }else{
      if(season==='Hivern') pool=creative?['pantalons de pana amb jersei de llana','pantalons rectes amb overshirt de llana','denim fosc amb jersei de coll alt i jaqueta curta']:['sastreria de llana suau','pantalons de llana amb jersei fi i americana','pantalons rectes amb camisa i abric lleuger'];
      else if(creative) pool=['carpenter pants amb camisa oversized','pantalons amples de cotó amb camisa lleugera','denim net amb overshirt de lli','pantalons rectes amb polo de punt'];
      else pool=['sastreria desestructurada lleugera','pantalons de lli amb camisa de coll obert','pantalons rectes amb polo de punt fi','pantalons lleugers amb camisa de cotó'];
    }
    if(['Alta costura','Avant-garde'].includes(dress)) pool=gender==='Dona'?['vestit escultòric lleuger','sastreria d’autor asimètrica','conjunt arquitectònic de seda i lli']:['sastreria d’autor desestructurada','conjunt arquitectònic de lli','pantalons amplis amb camisa escultòrica'];
    return `${pick(pool,seed)} en ${pick(COLORS,seed)}`;
  }
  function hairFor(gender,seed){return gender==='Dona'?pick(['bob curt','cabell solt natural','cua baixa','monyo baix','cabell curt texturitzat'],seed):pick(['curt natural','crop texturitzat','cabell ondulat curt','curt amb canes naturals','cabell mitjà discret'],seed);}
  function shoesFor(gender,season,seed){
    if(gender==='Dona')return season==='Hivern'?pick(['botins baixos','mocassins','botes de pell discretes','Oxford'],seed):pick(['mocassins','slingbacks','sandàlies minimalistes','Oxford','sneakers netes'],seed);
    return season==='Hivern'?pick(['botins de pell','mocassins','Derby','sneakers de pell'],seed):pick(['mocassins','Derby lleugers','sneakers retro','sabates de pell lleugeres'],seed);
  }
  function blurTargetCount(mode,count){if(mode==='Cap'||count===0)return 0;if(mode==='1 secundari amb blur suau')return 1;if(mode==='Alguns secundaris amb blur suau')return Math.max(1,Math.ceil(count/3));if(mode==='Alguns secundaris amb blur moderat')return Math.max(1,Math.min(count-1||1,Math.ceil(count/2)));return 0;}
  function blurIntensity(mode){return mode.includes('moderat')?'moderat':'suau';}
  function generateVisitors(state){
    const count=clamp(Number(state.visitorCount||0),0,12), profiles=profilePool(state.groupComposition,state.eventType), ages=AGE_POOLS[state.ageRange]||AGE_POOLS.adults, people=[];
    const nonce=Number(state.visitorNonce||0), blurN=blurTargetCount(state.secondaryMotionBlur,count);
    const activities=Object.keys(window.ACTIVITY_MAP);
    for(let i=0;i<count;i++){
      const age=pick(ages,i+nonce), gender=inferGender(state.groupComposition,i), rawProfile=roleForAge(profiles,age,i+nonce), look=window.LOOKS[rawProfile]||window.LOOKS['Visitant habitual'];
      const isBlur=i<blurN;
      const activity=isBlur?MOVING_ACTIVITY:pick(activities,i+nonce+1);
      people.push({id:i+1,typology:gender,age,profile:displayProfile(rawProfile,gender),profileKey:rawProfile,style:state.visualPersonality,outfit:outfitFor(rawProfile,gender,state.season,state.dressCode,i+nonce),bag:pick(look.bags,i+nonce),hair:hairFor(gender,i+nonce),shoes:shoesFor(gender,state.season,i+nonce),accessory:pick(look.accessories,i+nonce),activity,...window.ACTIVITY_MAP[activity],motionBlur:isBlur?blurIntensity(state.secondaryMotionBlur):'cap'});
    } return people;
  }
  function artistMatches(input){const names=(input||'').split(',').map(s=>s.trim()).filter(Boolean), lowerMap=new Map(window.ARTIST_CATALOG.map(a=>[a.nom.toLowerCase(),a]));return names.map(name=>lowerMap.get(name.toLowerCase())||{nom:name,custom:true});}
  function unique(list){return[...new Set(list)]}
  function artistReferencePhrase(a){
    if(a.custom)return`referència visual associada a ${a.nom}`;
    const movements=(a.moviments||[]).join(', '),disciplines=(a.disciplines||[]).join(', ');
    if(a.naixement!=null&&a.mort==null){const d=[movements,disciplines,a.periode].filter(Boolean).join(', ');return`característiques visuals generals associades a la pràctica de ${a.nom}${d?` — ${d}`:''}`;}
    if(a.mort!=null)return`l’estil visual de ${a.nom}${movements?` — ${movements}`:''}`;
    const d=[movements,disciplines,a.periode].filter(Boolean).join(', ');return`característiques visuals generals associades a la pràctica de ${a.nom}${d?` — ${d}`:''}`;
  }
  function framePhrase(frame){return frame==='sense marc'?'sense marc':`amb ${frame}`;}
  function is3DType(type){return['escultures','instal·lacions','obres tridimensionals','mixt expositiu'].includes(type);}
  function buildArtistBlock(state,matched,visibleWorks){
    const pure3D=['escultures','instal·lacions','obres tridimensionals'].includes(state.artType);
    const frameText=pure3D?'':`, ${framePhrase(state.frame)}`;
    const base=`${state.artCount} de tipus ${state.artType}, estil ${state.artStyle}${frameText}. Paleta: ${state.palette}.`;
    if(!visibleWorks && !pure3D)return`${base} Els marcs i passepartout han de ser visibles, però l’àrea interior de les obres de paret ha de quedar completament blanca, buida i sense contingut visual. Sense signatures ni text llegible.`;
    if(state.artistMode!=='Artista real (estil)'||matched.length===0)return`${base} Obres originals i fictícies, sense signatures ni text llegible.`;
    const refs=matched.map(artistReferencePhrase), intensity=state.artistReferenceIntensity.toLowerCase();
    if(state.artistApplication==='Només obra principal')return`${base} Obres originals i fictícies. Només l’obra principal utilitza com a referència ${refs.join('; ')}, amb intensitat ${intensity}. Evitar reproduccions literals, composicions recognoscibles, signatures o text llegible.`;
    if(state.artistApplication==='Una obra per artista si hi ha diversos noms'&&refs.length>1)return`${base} Obres originals i fictícies. Distribuir les referències entre les obres: ${refs.join('; ')}. Intensitat ${intensity}. Evitar reproduccions literals, composicions recognoscibles, signatures o text llegible.`;
    return`${base} Obres originals i fictícies basades en ${refs.join('; ')}, amb intensitat ${intensity}. Evitar reproduccions literals d’obres existents, composicions recognoscibles, signatures o text llegible.`;
  }
  function sculptureBlock(state){
    const implied=is3DType(state.artType), requested=state.sculpturePresence!=='Cap'; if(!implied&&!requested)return'';
    const presence=requested?state.sculpturePresence:'1 peça tridimensional principal coherent amb el tipus d’obra seleccionat';
    return`ESCULTURES I OBRES TRIDIMENSIONALS\nPresència: ${presence}. Tipologia: ${state.sculptureType}. Posició: ${state.sculpturePosition}. Suport: ${state.sculptureSupport}. Material: ${state.sculptureMaterial}. Escala: ${state.sculptureScale}.\nLes peces han de formar part real de l’espai, ocupar volum físic, projectar ombres coherents i respectar distàncies de circulació plausibles. No poden semblar objectes enganxats posteriorment a la fotografia.`;
  }
  function spatialBlock(state,isSelfie){
    const high=['Alta','Molt alta'].includes(state.spatialVariety)||['Alta','Molt alta'].includes(state.visualDepth);
    let text=`Geometria espacial: ${state.spaceGeometry}. Punt de vista: ${state.cameraView}. Profunditat visual: ${state.visualDepth}. Elements visibles: ${state.spatialElements}. Varietat espacial: ${state.spatialVariety}.`;
    if(state.spaceGeometry==='Paret frontal única') text+=' El fons principal és una única paret expositiva recta i contínua; no mostrar cantonades ni una segona paret lateral entrant en perspectiva.';
    else if(high) text+=' Fer llegibles altres plans arquitectònics: parets laterals, obertures, passadissos, envans o sales successives segons la configuració. Evitar una única paret frontal plana com a solució automàtica.';
    if(isSelfie) text+=' El selfie ha de respectar exactament aquesta geometria del fons; no inventar una cantonada de sala si no ha estat seleccionada.';
    return text;
  }
  function cameraBlock(state,isSelfie,isCCTV){
    if(isSelfie)return`Tipus de càmera: ${state.cameraType}. Composició tipus selfie, amb la figura principal dominant el primer terme i el braç estès cap a la càmera o mòbil. Mida de pla: ${state.shotSize}. Òptica: ${state.lens}. Les obres i l’arquitectura han de continuar sent recognoscibles al darrere, però no cal mostrar tota la sala. Punt de vista espacial de fons: ${state.cameraView}. Format: ${state.format}. La lectura òptica i l’exposició han de continuar sent fotogràficament plausibles; evitar una correcció digital perfecta de tots els plans.`;
    if(isCCTV)return`Tipus de càmera: Càmera de vigilància de sostre. ${state.shotSize}. Òptica: ${state.lens}. Punt de vista arquitectònic: ${state.cameraView}. Format: ${state.format}. Enquadrament fix de vigilància; no obligar a mostrar tota la sala si la mida de pla o l’enquadrament CCTV són tancats. Acceptar irregularitats d’exposició i contrast pròpies d’una càmera fixa real.`;
    const frontal=state.cameraView==='Frontal perpendicular';
    return`Tipus de càmera: ${state.cameraType}. ${frontal?'Vista frontal i clara.':'Vista arquitectònica '+state.cameraView.toLowerCase()+'.'} Mida de pla: ${state.shotSize}. Òptica: ${state.lens}. La figura principal és l’element humà dominant. La quantitat d’arquitectura visible ha de correspondre a la mida de pla: en plans mitjans o primers plans, no ampliar artificialment l’enquadrament per ensenyar tota la sala. Distribució natural i no simètrica. Format: ${state.format}. La càmera pot conservar petites imperfeccions plausibles d’exposició, contrast i lectura espacial; evitar la sensació de render neutralitzat o d’arquitectura excessivament corregida.`;
  }
  function mainLookFor(state){const key=state.mainProfile, gender=state.mainGender;return outfitFor(key,gender,state.season,state.dressCode,3);}
  function mainProfileDisplay(state){return displayProfile(state.mainProfile,state.mainGender);}
  function isRecoveredVenue(state){
    return ['Arquitectura recuperada / espai alternatiu','Espai industrial rehabilitat'].includes(state.venue);
  }
  function recoveredArchitectureBlock(state){
    if(!isRecoveredVenue(state))return '';
    return `ARQUITECTURA RECUPERADA — BLOQUEIG v9.0.2\nTipologia original: ${state.recoveredVenueType}. Estat: ${state.preservationState}. Grau d’intervenció: ${state.interventionDegree}. Rastre visible: ${state.buildingTrace}. Llum preexistent: ${state.existingLight}. Relació obra–arquitectura: ${state.architectureArtRelation}.\nL’edifici preexistent ha de continuar sent llegible. No convertir-lo en un white cube decorat. Conservar irregularitats, estructura, materials, rastres d’ús i proporcions pròpies. Els elements museogràfics nous han de ser distingibles i coherents amb el grau d’intervenció seleccionat. En v9.0.2, preservar també una certa rugositat visual: diferències reals entre superfícies, zones menys il·luminades, desgast coherent i resposta lumínica no idealitzada. Evitar que la rehabilitació sembli una escenografia perfecta o un render arquitectònic.`;
  }
  function siteResponsiveBlock(state){
    if(!isRecoveredVenue(state))return '';
    const conventional=['pintures','fotografies','gravats','collages','il·lustracions'].includes(state.artType);
    return `SITE-RESPONSIVE ART ENGINE v1.0\nEstratègia: ${state.siteStrategy}. Escala relativa: ${state.siteScale}. Mode: ${state.siteArtMode}.\nLa tipologia, escala, material i muntatge de l’obra principal han de derivar de l’arquitectura, la llum, les traces i l’ús anterior de l’edifici. Com a mínim una obra principal ha de dependre espacialment del lloc: pot ocupar, travessar, suspendre’s, seguir un rastre, activar la llum o l’acústica, reutilitzar un eix o establir un contrast deliberat amb l’arquitectura.\n${conventional?'El tipus d’obra convencional seleccionat ('+state.artType+') pot aparèixer només com a component secundari o documental. No resoldre l’exposició com una simple sèrie de peces emmarcades sobre paret.':'Les peces tridimensionals o instal·latives han de tenir una relació física explícita amb el lloc.'}\nRegla d’escala: “${state.siteScale}” és relativa a l’edifici; una gran nau o sala de turbines exigeix una resposta arquitectònica, monumental o ambiental, llevat que la petitesa sigui una decisió deliberada de desproporció.\nNo ocultar ${String(state.buildingTrace||'les traces originals').toLowerCase()}. No falsificar degradació escenogràfica. No afegir iconografia religiosa automàticament en capelles o esglésies si el projecte no la requereix.`;
  }
  function isPhotographicType(state){
    return ['Fotografia realista documental','Imatge publicitària','Imatge editorial'].includes(state.imageType);
  }
  function rawnessRank(v){return {'Net però natural':0,'Documental realista':1,'Cru observacional':2,'Molt cru accidental':3}[v]??1;}
  function effectiveRawness(state,isCCTV){
    const labels=['Net però natural','Documental realista','Cru observacional','Molt cru accidental'];
    let rank=rawnessRank(state.photographicRawness||'Documental realista');
    if(state.imageType==='Fotografia realista documental') rank=Math.max(rank,1);
    if(isRecoveredVenue(state)) rank=Math.min(3,Math.max(rank,1)+1);
    if(isCCTV) rank=Math.min(3,Math.max(rank,2));
    return labels[rank];
  }
  function realismBlock(state,isCCTV){
    if(!isPhotographicType(state)) return '';
    const selected=state.photographicRawness||'Documental realista';
    const effective=effectiveRawness(state,isCCTV);
    const levelText={
      'Net però natural':'Imatge cuidada però no perfecta: petites irregularitats d’exposició i reflex, textures naturals i llum no completament homogènia.',
      'Documental realista':'Prioritzar una captura creïble: diferències locals d’exposició, penombres plausibles, finestres o focus lleugerament més alts, contrast no uniforme i textura fotogràfica discreta.',
      'Cru observacional':'Aspecte clarament observacional: zones parcialment fosques, altes llums imperfectes, petits desequilibris de composició, superposicions i materials amb desgast o marques d’ús visibles.',
      'Molt cru accidental':'Captura aparentment trobada i no idealitzada: enquadrament funcional, llum desigual, zones amb menys detall, obstacles parcials i una resposta tonal deliberadament menys polida, sense arribar a semblar una mala fotografia.'
    }[effective];
    const typeRule=state.imageType==='Imatge publicitària'
      ? 'Mantenir l’elegància i la qualitat premium, però sense convertir l’espai en un showroom ni eliminar totes les irregularitats reals.'
      : state.imageType==='Imatge editorial'
      ? 'Mantenir una direcció d’art subtil, però evitar una perfecció editorial excessiva: la realitat física de l’espai ha de guanyar sobre el polish.'
      : 'La credibilitat documental té prioritat sobre la perfecció comercial o arquitectònica.';
    const recovered=isRecoveredVenue(state)?' En arquitectura recuperada, reduir encara més la perfecció global: no uniformitzar la llum, no netejar visualment les superfícies i conservar penombres, reparacions, pols subtil, rastres i diferències materials plausibles.':'';
    return `REALISME FOTOGRÀFIC / ANTI-PERFECCIÓ v1.0\nCruesa seleccionada: ${selected}. Cruesa efectiva segons escena: ${effective}.\n${levelText}\n${typeRule}${recovered}\nEvitar HDR perfecte, il·luminació homogènia de render, hiperdefinició uniforme, balanç tonal perfecte, superfícies esterilitzades i aspecte CGI. La imatge ha de semblar fotografiada dins d’un espai real en funcionament.`;
  }
  function imperfectCompositionBlock(state,isCCTV){
    if(!isPhotographicType(state)) return '';
    const effective=effectiveRawness(state,isCCTV);
    const extra=['Cru observacional','Molt cru accidental'].includes(effective)
      ? ' Permetre amb més claredat figures parcialment superposades, algun obstacle arquitectònic al primer terme, zones de buit menys equilibrades i una lectura no perfectament resolta de tots els plans.'
      : ' Permetre petits descentrats, superposicions naturals i espai buit no calculat al mil·límetre.';
    return `COMPOSICIÓ FOTOGRÀFICA MENYS RESOLTA v1.0\nLa composició no ha de semblar impecablement dissenyada per defecte. Evitar que totes les figures, obres i eixos arquitectònics ocupin simultàniament la posició més elegant o equilibrada.${extra} La imperfecció ha de ser subtil i plausible, no caòtica.${isCCTV?' En CCTV, prioritzar especialment una composició funcional i accidental.':''}`;
  }
  function materialRealityBlock(state){
    if(!isPhotographicType(state) || !isRecoveredVenue(state)) return '';
    return `MATERIALITAT I DESGAST CREÏBLES v1.0\nConservar petites variacions reals en parets, paviments, pilars, sostres i elements metàl·lics. Fer visibles, quan correspongui, reparacions, marques d’ús, pols subtil, irregularitats, canvis de textura i diferències de reflectància. No idealitzar ni homogeneïtzar les superfícies com si fossin acabats nous de showroom.`;
  }
  function buildPrompt(state,people,unified){
    const meta=imageTypeMeta(state.imageType),isSelfie=state.photoStyle==='Selfie amb obres al darrere',isCCTV=state.photoStyle==='Càmera de seguretat / CCTV',matched=artistMatches(state.artistNames),visibleWorks=state.artContent==='Obres visibles';
    const baseAct=window.ACTIVITY_MAP[state.mainActivity]||window.ACTIVITY_MAP['Observant l’obra'];
    const effectiveAct=isSelfie?{position:'en primer terme, amb el cos lleugerament descentrat però sense quedar arraconada',gaze:'mirant la pantalla o l’objectiu amb expressió natural; l’activitat seleccionada es manté només com a context secundari',gesture:'un braç estès sostenint la càmera o el mòbil i l’altre relaxat; gest espontani de selfie real',posture:'postura natural de selfie amb espatlles relaxades, lleugera asimetria i pes sobre una cama',object:'mòbil o càmera utilitzada per al selfie',interaction:'sense interacció directa tret que l’activitat base ho requereixi'}:baseAct;
    const negatives=unique([...standardNegatives(),...(isSelfie?selfieNegatives():[]),...(isCCTV?['no persones mirant o posant per a la càmera de seguretat','no composició publicitària deliberada','no càmera de vigilància a l’alçada dels ulls si la posició seleccionada és elevada']:[]),...(['Alta','Molt alta'].includes(state.spatialVariety)?['no resoldre sempre la sala com una única paret frontal paral·lela a la càmera','no fons tancat sistemàtic','no totes les obres al mateix mur principal','no museografia plana sense profunditat']:[]),...(state.spaceGeometry==='Paret frontal única'?['no cantonada visible de la sala','no dues parets convergents','no paret lateral dominant','no sala en forma de L']:[]),...(state.sculpturePresence!=='Cap'||is3DType(state.artType)?['no escultura enganxada a la paret per error','no escultura flotant sense suport','no ombres incoherents','no bloquejar passos de circulació']:[]),...(isRecoveredVenue(state)?['no convertir l’espai recuperat en un white cube genèric','no quatre obres convencionals emmarcades com a única resposta a una arquitectura monumental','no ocultar sistemàticament les traces de l’edifici','no decoració industrial falsa','no iconografia religiosa automàtica per la sola presència d’una capella o església']:[]),...(isPhotographicType(state)?['no HDR perfecte','no il·luminació massa uniforme a tota la imatge','no ombres perfectament obertes a tot arreu','no look de render arquitectònic','no look CGI','no hiperdefinició homogènia de totes les superfícies','no perfecció tonal global','no arquitectura esterilitzada sense rastre material','no brillantor artificial constant','no llum de showroom aplicada indiscriminadament','no profunditat massa resolta a tots els plans alhora','no acabat excessivament polit']:[]),...meta.negatives]);
    const visitorsText=people.length?people.map(p=>`VISITANT ${p.id}\n- Tipologia: ${p.typology}.\n- Edat: ${p.age} anys.\n- Rol: ${p.profile}.\n- Estil: ${p.style}.\n- Vestuari: ${p.outfit}.\n- Bossa: ${p.bag}.\n- Pentinat: ${p.hair}.\n- Calçat: ${p.shoes}.\n- Accessori: ${p.accessory}.\n- Activitat: ${p.activity}.\n- Posició: ${p.position}.\n- Mirada: ${p.gaze}.\n- Gest: ${p.gesture}.\n- Postura corporal: ${p.posture}.\n- Objecte: ${p.object}.\n- Interacció: ${p.interaction}.\n- Motion blur: ${p.motionBlur}.`).join('\n\n'):'';
    const sections=[];
    sections.push(`PROMPT MASTER — EXPOSICIONS v9.0.2 STABLE`);
    sections.push(`OBJECTIU\n${meta.objective}`);
    sections.push(`TIPUS D’IMATGE I TRACTAMENT VISUAL\nTipus: ${state.imageType}.\n${meta.treatment}\nL’acabat visual ha d’evitar l’excés de perfecció digital i mantenir una credibilitat fotogràfica consistent amb el tipus d’imatge seleccionat.`);
    const realism=realismBlock(state,isCCTV);if(realism)sections.push(realism);
    const imperfect=imperfectCompositionBlock(state,isCCTV);if(imperfect)sections.push(imperfect);
    sections.push(`ESTIL DE CAPTURA\n${isSelfie?'Mode selfie. Si hi ha un retrat de referència pujat, utilitzar-lo com a font d’identitat de la figura principal. No és un selfie de mirall. La figura principal apareix en primer terme, amb el rostre visible i una expressió natural.':isCCTV?'Mode càmera de seguretat / CCTV. Captura fixa, observacional i no dirigida. Les persones no són conscients de la càmera i no hi interactuen.':'Mode expositiu estàndard, amb lectura clara i creïble de la sala i de la relació entre la figura principal, les obres i l’arquitectura.'}`);
    sections.push(`ESCENA\n${state.eventType}. ${state.venue}. ${isRecoveredVenue(state)?`L’arquitectura original té prioritat sobre els acabats genèrics seleccionats; “paret ${state.wall}” i “terra de ${state.floor}” només s’apliquen a intervencions noves o zones rehabilitades quan sigui coherent.`:`Paret ${state.wall}, terra de ${state.floor}.`} ${state.lighting}. Mobiliari: ${state.furniture}.`);
    if(unified)sections.push(`IDENTITAT DE L’EXPOSICIÓ — UNIFIED EXHIBITION STATE / COHERENCE LOCK v1.0
Exposició fictícia: ${unified.title}. Artista fictici: ${unified.artist.name}.
Idea visual central: ${unified.centralIdea}.
Obres canòniques: ${unified.workDescription}.
Materials canònics: ${unified.materials.length?unified.materials.join(', '):'segons la selecció visual'}.
Principi espacial: ${unified.spatialPrinciple}.
BLOQUEIG: el prompt visual i el dossier curatorial descriuen la mateixa exposició. No afegir materials, disciplines, iconografia, processos o metàfores que contradiguin aquest estat canònic.`);
    sections.push(`ESPAI I COMPOSICIÓ ARQUITECTÒNICA\n${spatialBlock(state,isSelfie)}`);
    const recoveredBlock=recoveredArchitectureBlock(state);if(recoveredBlock)sections.push(recoveredBlock);
    const materialBlock=materialRealityBlock(state);if(materialBlock)sections.push(materialBlock);
    sections.push(`TEMPORADA I VESTUARI\nTemporada: ${state.season}. Codi de vestimenta: ${state.dressCode}. Guia estacional: ${seasonGuide(state.season)}.`);
    sections.push(`FIGURA PRINCIPAL — BLOQUEIG ABSOLUT\n- Tipologia: ${state.mainGender}.\n- Edat: ${state.mainAge} anys.\n- Rol: ${mainProfileDisplay(state)}.\n- Activitat base: ${state.mainActivity}.\n- Activitat efectiva: ${isSelfie?'Fent-se un selfie dins de l’exposició.':state.mainActivity+'.'}\n- Vestuari: ${mainLookFor(state)}.\n- Posició: ${effectiveAct.position}.\n- Mirada: ${effectiveAct.gaze}.\n- Gest: ${effectiveAct.gesture}.\n- Postura corporal: ${effectiveAct.posture}.\n- Objecte: ${effectiveAct.object}.\n- Interacció: ${effectiveAct.interaction}.\n${isSelfie?'La figura principal és el centre visual del selfie. Si s’aporta un retrat de referència, reproduir-ne la identitat, fesomia i aparença general sense substituir-la.':isCCTV?'La figura principal forma part d’una captura de vigilància espontània: no mira la càmera ni posa. Pot aparèixer d’esquena, de perfil o en tres quarts segons l’activitat i la posició real dins la sala.':'La figura principal es mostra d’esquena a la càmera i vinculada visualment a l’obra; no mostrar el rostre.'}`);
    sections.push(`GRUP\nNombre total de visitants secundaris: ${people.length}. ${people.length?`Composició: ${state.groupComposition}. Franja d’edat: ${state.ageRange}. Distribució: ${state.socialDistribution}.`:'No hi ha visitants secundaris.'}`);
    if(visitorsText)sections.push(`FITXES INDIVIDUALS\n${visitorsText}`);
    if(people.length>1)sections.push(`DIVERSITAT\nNivell: ${state.diversityLevel}. No repetir combinacions de silueta, color, bossa, pentinat, calçat, accessori, activitat o postura en persones properes.`);
    sections.push(`OBRES D’ART\n${buildArtistBlock(state,matched,visibleWorks)}`);
    const siteBlock=siteResponsiveBlock(state);if(siteBlock)sections.push(siteBlock);
    const sc=sculptureBlock(state);if(sc)sections.push(sc);
    sections.push(`MUSEOGRAFIA\n${isRecoveredVenue(state)?`La museografia respon a l’edifici existent i no imposa una alçada uniforme de white cube. ${state.architectureArtRelation}. ${state.interventionDegree}. Conservar visibles ${String(state.buildingTrace||'les traces originals').toLowerCase()}.`:`${state.museumMount}. Obres no excessivament altes.`} Carteles petites. Distàncies de circulació naturals. Repartir les obres entre diferents plans, estructures i buits quan la geometria espacial ho demani.`);
    if(isCCTV)sections.push(`CÀMERA DE SEGURETAT / CCTV\nSistema: Càmera de vigilància de sostre. Posició: ${state.cctvPosition}. Enquadrament: ${state.cctvFraming}. Estètica: ${state.cctvAesthetic}. sense overlay, timestamp ni text superposat.\nImatge captada per una càmera fixa real de vigilància de la sala. Punt de vista físicament plausible des de sostre, paret o porta segons la posició seleccionada. Les persones ignoren completament la càmera i no posen per a ella. La composició ha de semblar funcional i accidental, no dirigida per un fotògraf. CCTV no significa ull de peix automàticament.`);
    sections.push(`CÀMERA\n${cameraBlock(state,isSelfie,isCCTV)}`);
    sections.push(`POSTURES I GESTUALITAT NATURAL\nLes persones no posen per a la càmera. Cada visitant ha de tenir una distribució de pes, inclinació corporal, posició de cames i gest de braços diferents. Les persones que caminen apareixen a mig pas real; les que conversen formen angles oberts i naturals.${isCCTV?' En mode CCTV, ningú no mira voluntàriament la càmera ni modifica la conducta per la seva presència.':''}`);
    if(state.secondaryMotionBlur!=='Cap')sections.push(`MOTION BLUR SELECTIU\nAplicar motion blur només als secundaris marcats a les fitxes, prioritzant persones realment en moviment. La figura principal, les obres i l’arquitectura romanen nítides.`);
    if(isSelfie)sections.push(`COHERÈNCIA LUMÍNICA DEL SELFIE\nLa il·luminació de cara, braç, coll i roba ha de correspondre amb la direcció, temperatura de color, contrast, exposició, reflexos, ombres i balanç de blancs del fons. El selfie ha de semblar realment fet dins de l’espai, no una figura enganxada al davant.`);
    const add=(state.additional||'').trim();if(add && add!=='Cap indicació addicional.')sections.push(`INDICACIONS ADDICIONALS\n${add}`);
    sections.push(`NEGATIUS\n${negatives.join(', ')}.`);
    return sections.join('\n\n');
  }
  function disciplineCompatibility(state,artists){
    const map={'pintures':['Pintura'],'fotografies':['Fotografia'],'gravats':['Gravat'],'collages':['Collage','Pintura','Fotografia'],'il·lustracions':['Dibuix','Il·lustració','Gravat'],'escultures':['Escultura'],'instal·lacions':['Instal·lació','Art conceptual','Performance'],'obres tridimensionals':['Escultura','Instal·lació'],'mixt expositiu':[],'obres mixtes':[]};
    const wanted=map[state.artType]||[];if(!wanted.length)return[];
    return artists.filter(a=>!a.custom && !(a.disciplines||[]).some(d=>wanted.includes(d)));
  }
  function audit(state,people){
    const messages=[];let level='ok',isSelfie=state.photoStyle==='Selfie amb obres al darrere',isCCTV=state.photoStyle==='Càmera de seguretat / CCTV',artists=artistMatches(state.artistNames);
    if(state.artistMode==='Artista real (estil)'&&artists.length===0){messages.push('Has activat “Artista real (estil)” però no has seleccionat cap artista.');level='bad';}
    if(state.artistMode==='Artista real (estil)'&&state.artContent!=='Obres visibles'&&!is3DType(state.artType)){messages.push('Els quadres estan en blanc: la referència artística no es visualitzarà dins de les obres de paret.');if(level==='ok')level='warn';}
    if(state.artistMode==='Artista real (estil)'&&artists.length){const bad=disciplineCompatibility(state,artists);if(bad.length){messages.push(`Possible incompatibilitat entre “${state.artType}” i la disciplina de: ${bad.map(a=>a.nom).join(', ')}.`);if(level==='ok')level='warn';}}
    if(state.secondaryMotionBlur!=='Cap'&&people.length===0){messages.push('No hi ha visitants secundaris: el motion blur no s’aplicarà.');if(level==='ok')level='warn';}
    if(isSelfie)messages.push('Mode selfie actiu: adjunta una fotografia de referència del rostre i es mantindrà coherència lumínica figura/fons.');
    if(isCCTV)messages.push('Mode CCTV actiu: càmera fixa elevada, sense mirada a càmera ni composició dirigida.');
    if(isPhotographicType(state))messages.push(`Realisme v9.0.2 actiu: cruesa ${effectiveRawness(state,isCCTV)}${isRecoveredVenue(state)?' amb reforç automàtic per arquitectura recuperada':''}.`);
    if(state.spaceGeometry==='Paret frontal única')messages.push('Geometria de paret frontal única: el prompt bloqueja cantonades i segones parets laterals.');
    if(['Alta','Molt alta'].includes(state.spatialVariety))messages.push('Varietat espacial alta: es prioritzen obertures, parets laterals, passadissos i sales successives quan sigui coherent.');
    if(is3DType(state.artType)&&state.sculpturePresence==='Cap'){messages.push('El tipus d’obra és tridimensional: s’inferirà almenys una peça 3D principal encara que “Presència escultòrica” sigui Cap.');if(level==='ok')level='warn';}
    if(isRecoveredVenue(state)){messages.push(`Espai recuperat actiu: ${state.recoveredVenueType}. El Site-Responsive Art Engine força una relació física entre obra, escala, traces i arquitectura.`);if(['pintures','fotografies','gravats','collages','il·lustracions'].includes(state.artType)){messages.push(`“${state.artType}” es tractarà com a component secundari o contextual; l’obra principal serà site-responsive.`);if(level==='ok')level='warn';}}
    messages.push('Coherence Lock v1.0 actiu: prompt visual i dossier comparteixen tipus d’obra, materials, escala, paleta, arquitectura i museografia.');
    if(level==='ok'&&messages.length===0)messages.push('Escena vàlida.');return{level,messages};
  }
  return{generateVisitors,buildPrompt,audit,artistMatches,imageTypeMeta};
})();
