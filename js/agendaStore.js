// ========================= js/agendaStore.js v1.0.0 =========================
// Centrale agenda store — brug tussen alle admin modules en agenda.html
//
// Wijzigingen v1.0.0 (sessie 38):
//  - AgendaStore.register() — module registreert zichzelf met mapping config
//  - AgendaStore.sync()     — herberekent ag_cache uit alle geregistreerde bronnen
//  - AgendaStore.getAll()   — geeft genormaliseerde items terug (voor agenda.html)
//  - Agenda schrijft NOOIT terug naar bronmodules — bronpagina's zijn bron van waarheid
//  - ag_events (standalone) worden door agenda.html zelf beheerd, niet door deze store
//
// Gebruik in elke module na _save():
//   AgendaStore.sync();
//
// Gebruik in agenda.html:
//   const items = AgendaStore.getAll();
// ============================================================================

const AgendaStore = (() => {

  // ── Bron-registry: elke module registreert zichzelf ──
  // Wordt gevuld via AgendaStore.register() of via de standaard bronnen hieronder
  const _sources = [];

  // ── Kleur per bron (vaste toewijzing) ──
  const SOURCE_COLORS = {
    backlog:       '#60a5fa',  // blauw
    marketing:     '#a78bfa',  // paars
    roadmap:       '#fb923c',  // oranje
    releasenotes:  '#4ade80',  // groen
    standalone:    '#9ca3af',  // grijs — ag_events
  };

  // ── Standaard bronnen — worden automatisch geregistreerd ──
  // Elke bron beschrijft hoe zijn localStorage data gemapped wordt naar het
  // genormaliseerde agenda-formaat:
  //   { id, bron, bronUrl, kleur, titel, startdate, enddate, status, type, fase, prioriteit }
  const DEFAULT_SOURCES = [
    {
      key:    'backlog',          // unieke naam van de bron
      label:  'Backlog',         // leesbare naam voor legenda/filter
      lsKey:  'bl_items',        // localStorage sleutel
      url:    '/MyFamTreeCollab/admin/backlog.html',
      map: item => ({            // mapping van bronveld naar agenda-veld
        id:        item.id,
        bron:      'backlog',
        bronLabel: 'Backlog',
        bronUrl:   '/MyFamTreeCollab/admin/backlog.html',
        kleur:     SOURCE_COLORS.backlog,
        titel:     item.title    || '',
        startdate: item.startdate|| '',
        enddate:   item.enddate  || item.startdate || '',
        status:    item.status   || 'Open',
        type:      item.type     || '',
        fase:      item.phase    || '',
        prioriteit:item.priority || '',
        omschrijving: item.description || '',
        tags:      item.tags     || '',
        assignee:  item.assignee || '',
      }),
    },
    {
      key:    'marketing',
      label:  'Marketing',
      lsKey:  'mk_items',
      url:    '/MyFamTreeCollab/admin/marketing.html',
      map: item => ({
        id:        item.id,
        bron:      'marketing',
        bronLabel: 'Marketing',
        bronUrl:   '/MyFamTreeCollab/admin/marketing.html',
        kleur:     SOURCE_COLORS.marketing,
        titel:     item.title    || '',
        startdate: item.startdate|| '',
        enddate:   item.enddate  || item.startdate || '',
        status:    item.status   || 'Open',
        type:      item.type     || '',
        fase:      item.phase    || '',
        prioriteit:item.priority || '',
        omschrijving: item.description || '',
        tags:      item.tags     || '',
        assignee:  item.assignee || '',
      }),
    },
    {
      key:    'roadmap',
      label:  'Roadmap',
      lsKey:  'rm_items',
      url:    '/MyFamTreeCollab/admin/roadmap.html',
      map: item => ({
        id:        item.id,
        bron:      'roadmap',
        bronLabel: 'Roadmap',
        bronUrl:   '/MyFamTreeCollab/admin/roadmap.html',
        kleur:     SOURCE_COLORS.roadmap,
        titel:     item.titel    || item.title || '',
        startdate: item.startdate|| '',
        enddate:   item.enddate  || item.startdate || '',
        status:    item.status   || 'Open',
        type:      item.type     || '',
        fase:      item.fase     || item.phase || '',
        prioriteit:item.prioriteit|| item.priority || '',
        omschrijving: item.omschrijving || item.description || '',
        tags:      item.tags     || '',
        assignee:  item.assignee || '',
      }),
    },
    {
      key:    'releasenotes',
      label:  'Release Notes',
      lsKey:  'rn_items',
      url:    '/MyFamTreeCollab/admin/release-notes.html',
      map: item => ({
        id:        item.id,
        bron:      'releasenotes',
        bronLabel: 'Release Notes',
        bronUrl:   '/MyFamTreeCollab/admin/release-notes.html',
        kleur:     SOURCE_COLORS.releasenotes,
        titel:     item.titel    || item.title || '',
        startdate: item.datum    || item.startdate || '',
        enddate:   item.datum    || item.startdate || '',
        status:    item.status   || 'Open',
        type:      item.type     || 'Release',
        fase:      item.fase     || '',
        prioriteit:'',
        omschrijving: item.omschrijving || item.description || '',
        tags:      item.tags     || '',
        assignee:  '',
      }),
    },
  ];

  // ── Initialiseer standaard bronnen in de registry ──
  DEFAULT_SOURCES.forEach(src => _sources.push(src));

  // ═══════════════════════════════════════════════════════
  // PUBLIC API
  // ═══════════════════════════════════════════════════════

  /**
   * register() — externe module registreert een aangepaste bron
   * Gebruik: AgendaStore.register({ key, label, lsKey, url, map })
   * Roep aan vóór AgendaStore.sync() — bij voorkeur bij module init
   */
  function register(config) {
    // Verwijder eventuele bestaande registratie met dezelfde key
    const idx = _sources.findIndex(s => s.key === config.key);
    if(idx > -1) _sources.splice(idx, 1);
    _sources.push(config);
  }

  /**
   * sync() — herberekent ag_cache uit alle geregistreerde bronnen
   * Aanroepen na elke _save() in een bronmodule
   * Standalone events (ag_events) worden NIET via sync() beheerd
   */
  function sync() {
    const all = _collectAll();
    try {
      // Sla genormaliseerde cache op — agenda.html leest hieruit
      localStorage.setItem('ag_cache', JSON.stringify(all));
      localStorage.setItem('ag_cache_ts', Date.now().toString()); // timestamp voor debugging
    } catch(e) {
      console.warn('[AgendaStore] sync() mislukt:', e);
    }
  }

  /**
   * getAll() — geeft alle genormaliseerde agenda-items terug
   * Combineert ag_cache (bron-items) met ag_events (standalone)
   * Filtert items zonder startdate — die hebben geen kalenderplaats
   */
  function getAll() {
    // Bron-items uit cache (of direct berekend als cache leeg is)
    let cached = [];
    try {
      const raw = localStorage.getItem('ag_cache');
      cached = raw ? JSON.parse(raw) : _collectAll();
    } catch(e) {
      cached = _collectAll();
    }

    // Standalone events samenvoegen
    let standalone = [];
    try {
      const raw = localStorage.getItem('ag_events');
      const evts = raw ? JSON.parse(raw) : [];
      standalone = evts.map(e => ({
        id:          e.id,
        bron:        'standalone',
        bronLabel:   'Eigen event',
        bronUrl:     null,
        kleur:       SOURCE_COLORS.standalone,
        titel:       e.titel      || '',
        startdate:   e.startdate  || '',
        enddate:     e.enddate    || e.startdate || '',
        starttime:   e.starttime  || '',
        endtime:     e.endtime    || '',
        status:      e.status     || 'Open',
        type:        'Event',
        fase:        '',
        prioriteit:  '',
        omschrijving:e.omschrijving|| '',
        locatie:     e.locatie    || '',
        deelnemers:  e.deelnemers || '',
        herhaling:   e.herhaling  || 'geen',
        tags:        e.tags       || '',
        assignee:    '',
        isStandalone:true,
      }));
    } catch(e) {
      standalone = [];
    }

    // Combineer en filter: alleen items met startdate zijn kalender-relevant
    return [...cached, ...standalone].filter(i => i.startdate && i.startdate.trim());
  }

  /**
   * getSources() — geeft lijst van alle geregistreerde bronnen (voor legenda/filter)
   */
  function getSources() {
    return _sources.map(s => ({ key: s.key, label: s.label, kleur: SOURCE_COLORS[s.key] || '#9ca3af' }));
  }

  /**
   * getColors() — geeft het kleurobject terug (voor agenda.html rendering)
   */
  function getColors() {
    return { ...SOURCE_COLORS };
  }

  // ═══════════════════════════════════════════════════════
  // PRIVATE HULPFUNCTIES
  // ═══════════════════════════════════════════════════════

  /**
   * _collectAll() — leest alle geregistreerde bronnen uit localStorage
   * en normaliseert via hun map() functie
   */
  function _collectAll() {
    const result = [];
    for(const src of _sources) {
      try {
        const raw = localStorage.getItem(src.lsKey);
        if(!raw) continue;                       // Bron heeft nog geen data
        const items = JSON.parse(raw);
        if(!Array.isArray(items)) continue;      // Onverwacht formaat, overslaan
        items.forEach(item => {
          try {
            const normalized = src.map(item);    // Mapping toepassen
            if(normalized && normalized.id) result.push(normalized);
          } catch(mapErr) {
            console.warn(`[AgendaStore] map() fout in bron "${src.key}":`, mapErr);
          }
        });
      } catch(parseErr) {
        console.warn(`[AgendaStore] parse fout in bron "${src.key}":`, parseErr);
      }
    }
    return result;
  }

  // ── Public interface ──
  return { register, sync, getAll, getSources, getColors };

})();
