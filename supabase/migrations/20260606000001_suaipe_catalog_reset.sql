-- Suaipe rebrand — full catalogue reset + store rename.
--
-- ⚠️ DESTRUCTIVE. This wipes the ENTIRE live product catalogue (custom_products
-- is the single source of truth for the kiosk — see CLAUDE.md gotcha #1) and
-- replaces it with 10 fictional Suaipe-brand gadgets, each with a bilingual
-- consultant guide (product_guides). It also renames the four store ids to
-- city slugs and remaps existing staff roles accordingly.
--
-- ORDER OF OPERATIONS (important):
--   1. Generate the 10 product images and place them at /products/<id>.png,
--      then deploy the frontend (so the new image paths resolve).
--   2. Run this migration (supabase db push, or paste into the SQL editor).
-- Running it before the images exist only means broken thumbnails until they
-- are uploaded — the catalogue logic itself is fine.
--
-- The text fields use $t$…$t$ dollar-quoting (apostrophe-safe) and the FAQ uses
-- $j$…$j$ for raw JSON. Re-running is safe: it deletes then re-inserts a fixed
-- set, and the store_id remap is a no-op once applied.

BEGIN;

-- ── 1. Wipe the old catalogue and all per-product state ─────────────────────
-- product_settings (per-store active/price/image/video/discount overrides),
-- product_global_status (global hide flags) and product_guides all key off the
-- old product ids, so they are cleared too. Historical quiz_sessions (leads)
-- keep their product snapshot and are intentionally left untouched.
DELETE FROM public.product_settings;
DELETE FROM public.product_global_status;
DELETE FROM public.product_guides;
DELETE FROM public.custom_products;

-- ── 2. The 10 new products ──────────────────────────────────────────────────
INSERT INTO public.custom_products
  (id, name, description, price, rating, image_url, video_url, tags, faq, status)
VALUES
(
  'aurae-pulse-pro',
  $t$Aurae Pulse Pro$t$,
  $t$Auricolari true wireless con cancellazione attiva del rumore adattiva, driver dinamici da 11mm e modalità trasparenza. Audio nitido per musica e chiamate, fino a 30 ore con la custodia e ricarica rapida USB-C.$t$,
  '€89,00', 4.7, '/products/aurae-pulse-pro.png', '#',
  ARRAY['audio','productivity','travel'],
  $j$[{"q":"La cancellazione del rumore è efficace?","a":"Sì, l'ANC adattiva si regola in tempo reale sull'ambiente: silenzia aereo, ufficio e metropolitana mantenendo la musica pulita."},{"q":"Quanto durano le batterie?","a":"Fino a 7 ore con una carica e 30 ore totali con la custodia. Cinque minuti di ricarica danno circa un'ora di ascolto."},{"q":"Sono buoni per le chiamate?","a":"Sì, i microfoni con riduzione del rumore isolano la voce dal vento e dal traffico per chiamate chiare ovunque."}]$j$::jsonb,
  'active'
),
(
  'lunaring-halo',
  $t$Lunaring Halo – Anello Smart$t$,
  $t$Anello smart in titanio con monitoraggio 24/7 di frequenza cardiaca, SpO2, temperatura cutanea e fasi del sonno. Calcola un punteggio di recupero giornaliero, resistente all'acqua 10 ATM e fino a 6 giorni di autonomia.$t$,
  '€99,00', 4.6, '/products/lunaring-halo.png', '#',
  ARRAY['recovery','sport','tech'],
  $j$[{"q":"Come funziona il punteggio di recupero?","a":"Combina sonno, variabilità cardiaca e attività della giornata in un unico valore che ti dice quando spingere e quando riposare."},{"q":"Si può indossare in acqua?","a":"Sì, impermeabilità 10 ATM: nuoto, doccia e mare senza preoccupazioni."},{"q":"Quanto dura la batteria?","a":"Fino a 6 giorni con uso normale; si ricarica completamente in circa 80 minuti sulla base magnetica."}]$j$::jsonb,
  'active'
),
(
  'brevia-gopress',
  $t$Brevia GoPress – Espresso Portatile$t$,
  $t$Macchina da espresso portatile con 20 bar di pressione e riscaldamento dell'acqua integrato in meno di 3 minuti. Compatibile con capsule e caffè macinato, batteria da 7.800mAh per più tazze lontano da casa.$t$,
  '€119,00', 4.8, '/products/brevia-gopress.png', '#',
  ARRAY['travel','wellness','productivity'],
  $j$[{"q":"Scalda l'acqua da sola?","a":"Sì, la resistenza interna porta l'acqua a temperatura in meno di 3 minuti: ti serve solo acqua e caffè."},{"q":"Quante tazze fa per carica?","a":"La batteria da 7.800mAh prepara più espressi consecutivi prima di richiedere una ricarica USB-C."},{"q":"Che caffè posso usare?","a":"Capsule compatibili Nespresso oppure caffè macinato con il filtro incluso: massima libertà ovunque tu sia."}]$j$::jsonb,
  'active'
),
(
  'vibewave-open',
  $t$Vibewave Open – Auricolari Open-Ear$t$,
  $t$Auricolari open-ear a conduzione che lasciano le orecchie libere, con 32GB di memoria interna e certificazione IPX8. Trasmettono musica e podcast restando consapevole dell'ambiente: ideali per corsa, bici e nuoto.$t$,
  '€79,00', 4.6, '/products/vibewave-open.png', '#',
  ARRAY['audio','sport','travel'],
  $j$[{"q":"Si possono usare correndo in strada?","a":"Sì, il design open-ear lascia le orecchie aperte così senti traffico e ambiente mentre ascolti."},{"q":"Funzionano senza telefono?","a":"Sì, 32GB di memoria interna ospitano migliaia di brani da ascoltare senza smartphone."},{"q":"Resistono al sudore e all'acqua?","a":"Certificazione IPX8: sudore, pioggia e immersione in piscina non sono un problema."}]$j$::jsonb,
  'active'
),
(
  'pulsar-recover-x',
  $t$Pulsar Recover X – Pistola Massaggiante$t$,
  $t$Pistola massaggiante percussiva con motore brushless silenzioso, 5 livelli di intensità e 4 testine intercambiabili. Allevia le tensioni muscolari, migliora la circolazione e accelera il recupero post-allenamento.$t$,
  '€99,00', 4.7, '/products/pulsar-recover-x.png', '#',
  ARRAY['recovery','sport','wellness'],
  $j$[{"q":"È rumorosa?","a":"No, il motore brushless lavora sotto i 45dB: puoi usarla davanti alla TV senza disturbare."},{"q":"Quanto dura la batteria?","a":"Fino a 6 ore di utilizzo per carica, con indicatore di livello e spegnimento automatico di sicurezza."},{"q":"A cosa servono le testine?","a":"Quattro testine per zone diverse: sferica per i grandi muscoli, a cono per i punti precisi, a forcella per la colonna e piatta per i tendini."}]$j$::jsonb,
  'active'
),
(
  'voltik-snapcell',
  $t$Voltik SnapCell – Power Bank Magnetico$t$,
  $t$Power bank magnetico ultrasottile da 5.000mAh con ricarica wireless istantanea e porta USB-C PD da 20W. Si aggancia al telefono e ricarica mentre lo usi, con indicatore LED di carica residua.$t$,
  '€54,00', 4.6, '/products/voltik-snapcell.png', '#',
  ARRAY['travel','tech','productivity'],
  $j$[{"q":"Si aggancia bene al telefono?","a":"Sì, l'allineamento magnetico è compatibile con MagSafe (iPhone 12 e successivi) e con le custodie magnetiche."},{"q":"Posso usarlo anche via cavo?","a":"Sì, la porta USB-C PD da 20W ricarica rapidamente telefono, auricolari o piccoli dispositivi."},{"q":"Quanto è ingombrante?","a":"Solo 11mm di spessore: si infila in tasca e raddoppia l'autonomia del telefono senza pesare."}]$j$::jsonb,
  'active'
),
(
  'aeris-glow',
  $t$Aeris Glow – Asciugacapelli ad Alta Velocità$t$,
  $t$Asciugacapelli ad alta velocità con motore brushless da 110.000 RPM e ioni negativi per ridurre il crespo. Controllo intelligente della temperatura anti-danno, ultraleggero e silenzioso, con 3 accessori magnetici.$t$,
  '€89,00', 4.8, '/products/aeris-glow.png', '#',
  ARRAY['style','wellness','productivity'],
  $j$[{"q":"Asciuga davvero più in fretta?","a":"Sì, il flusso ad alta velocità riduce i tempi di asciugatura fino al 30% rispetto a un phon tradizionale."},{"q":"Rovina i capelli?","a":"No, il sensore di temperatura previene il surriscaldamento e gli ioni negativi lasciano i capelli lucidi e morbidi."},{"q":"Quali accessori include?","a":"Concentratore, diffusore e beccuccio lisciante, tutti ad aggancio magnetico per cambiarli al volo."}]$j$::jsonb,
  'active'
),
(
  'echobox-riff',
  $t$Echobox Riff – Speaker Bluetooth Retrò$t$,
  $t$Cassa Bluetooth portatile in metallo con design retrò, radio FM integrata e suono stereo ricco. Resistente agli urti, abbinamento rapido e fino a 10 ore di riproduzione: musica di carattere ovunque.$t$,
  '€64,00', 4.5, '/products/echobox-riff.png', '#',
  ARRAY['audio','style','travel'],
  $j$[{"q":"Ha la radio FM?","a":"Sì, sintonizzatore FM integrato: ascolti musica e notizie anche senza connessione o smartphone."},{"q":"Quanto dura la batteria?","a":"Fino a 10 ore di riproduzione continua a volume medio, ricarica via USB-C."},{"q":"È resistente?","a":"La scocca in metallo pieno resiste a urti e graffi quotidiani, perfetta da portare in viaggio."}]$j$::jsonb,
  'active'
),
(
  'nimbus-sip',
  $t$Nimbus Sip – Borraccia Smart$t$,
  $t$Borraccia smart termica in acciaio con promemoria luminoso di idratazione e tracciamento dei sorsi via app. Mantiene le bevande fredde 24 ore o calde 12, con tappo a tenuta e sensore touch sul fondo.$t$,
  '€45,00', 4.4, '/products/nimbus-sip.png', '#',
  ARRAY['sport','wellness','tech'],
  $j$[{"q":"Come ricorda di bere?","a":"Un anello luminoso si illumina con delicatezza quando è ora di idratarsi, in base ai tuoi obiettivi personali."},{"q":"Mantiene la temperatura?","a":"Sì, l'isolamento sottovuoto tiene le bevande fredde fino a 24 ore e calde fino a 12."},{"q":"Serve l'app?","a":"L'app sincronizza i sorsi e mostra i progressi, ma la borraccia e i promemoria funzionano anche da soli."}]$j$::jsonb,
  'active'
),
(
  'lumio-air',
  $t$Lumio Air – Mini Proiettore Portatile$t$,
  $t$Mini proiettore portatile Full HD con messa a fuoco automatica, correzione trapezoidale e sistema smart con app di streaming integrate. Batteria interna e altoparlanti, proietta fino a 120" ovunque.$t$,
  '€149,00', 4.5, '/products/lumio-air.png', '#',
  ARRAY['travel','tech','style'],
  $j$[{"q":"Quanto grande proietta?","a":"Da 40\" a 120\" in base alla distanza dalla parete, con messa a fuoco e correzione automatiche."},{"q":"Funziona senza presa di corrente?","a":"Sì, la batteria interna offre un film intero lontano dalla corrente; altoparlanti integrati per audio immediato."},{"q":"Serve un lettore esterno?","a":"No, il sistema smart integra le principali app di streaming; puoi anche collegare un HDMI o trasmettere dal telefono."}]$j$::jsonb,
  'active'
);

-- ── 3. Consultant guides (IT + EN) ──────────────────────────────────────────
INSERT INTO public.product_guides
  (product_id, product_name,
   description_it, description_en,
   insight_1_it, insight_1_en,
   insight_2_it, insight_2_en,
   manager_advice_it, manager_advice_en)
VALUES
(
  'aurae-pulse-pro', $t$Aurae Pulse Pro$t$,
  $t$Auricolari true wireless premium con cancellazione attiva del rumore adattiva e modalità trasparenza. Il prodotto audio di punta per chi vive tra spostamenti, lavoro e musica.$t$,
  $t$Premium true-wireless earbuds with adaptive active noise cancellation and transparency mode. The flagship audio pick for people who live between commuting, work and music.$t$,
  $t$Punta sul caso d'uso "ufficio + viaggio": l'ANC adattiva trasforma open space e aerei in una bolla di concentrazione.$t$,
  $t$Lead with the "office + travel" use case: adaptive ANC turns open spaces and planes into a focus bubble.$t$,
  $t$Ricorda la ricarica rapida: 5 minuti danno un'ora di ascolto, l'argomento che convince chi esce sempre di fretta.$t$,
  $t$Highlight fast charging: 5 minutes give an hour of playback — the clincher for people always rushing out.$t$,
  $t$Falli provare subito con la modalità trasparenza: il passaggio tra ANC e ambiente esterno è ciò che fa decidere il cliente.$t$,
  $t$Let them try transparency mode on the spot: switching between ANC and the outside world is what closes the sale.$t$
),
(
  'lunaring-halo', $t$Lunaring Halo – Anello Smart$t$,
  $t$Anello smart in titanio per salute e recupero: sonno, frequenza cardiaca, SpO2 e un punteggio di recupero quotidiano, senza schermo al polso.$t$,
  $t$A titanium smart ring for health and recovery: sleep, heart rate, SpO2 and a daily recovery score, with no screen on the wrist.$t$,
  $t$L'argomento vincente è la discrezione: tutti i dati di uno smartwatch senza notifiche e senza display, anche di notte.$t$,
  $t$The winning angle is discretion: all the data of a smartwatch with no notifications and no display, even at night.$t$,
  $t$Per gli sportivi, spiega il punteggio di recupero: dice quando allenarsi forte e quando riposare, evitando il sovrallenamento.$t$,
  $t$For athletes, explain the recovery score: it tells them when to train hard and when to rest, avoiding overtraining.$t$,
  $t$Misura sempre la taglia con l'anello di prova prima di vendere: saltare questo passo è il primo motivo di reso.$t$,
  $t$Always size the finger with the sizing kit before selling: skipping it is the number-one cause of returns.$t$
),
(
  'brevia-gopress', $t$Brevia GoPress – Espresso Portatile$t$,
  $t$Macchina da espresso portatile che scalda l'acqua da sola e raggiunge 20 bar di pressione. Un vero espresso in viaggio, in ufficio o in campeggio.$t$,
  $t$A portable espresso maker that heats its own water and reaches 20 bar of pressure. A real espresso while travelling, at the office or camping.$t$,
  $t$Il dettaglio che stupisce è il riscaldamento integrato: niente acqua calda esterna, basta la corrente o la batteria.$t$,
  $t$The wow detail is built-in heating: no external hot water needed — just power or the battery.$t$,
  $t$Vendi la libertà di scelta: capsule per comodità o macinato per i puristi, con la stessa macchina.$t$,
  $t$Sell freedom of choice: capsules for convenience or ground coffee for purists, all in one machine.$t$,
  $t$Posizionalo come regalo: chi ama il caffè e viaggia lo trova irresistibile, è un classico acquisto d'impulso premium.$t$,
  $t$Position it as a gift: travelling coffee lovers find it irresistible — a classic premium impulse buy.$t$
),
(
  'vibewave-open', $t$Vibewave Open – Auricolari Open-Ear$t$,
  $t$Auricolari open-ear che lasciano le orecchie libere, con memoria interna da 32GB e impermeabilità IPX8. Pensati per sport e sicurezza in strada.$t$,
  $t$Open-ear earphones that keep the ears free, with 32GB onboard memory and IPX8 waterproofing. Built for sport and street safety.$t$,
  $t$La sicurezza è il punto forte: chi corre o va in bici sente il traffico, a differenza degli auricolari tradizionali.$t$,
  $t$Safety is the strong point: runners and cyclists still hear traffic, unlike traditional earbuds.$t$,
  $t$Per i nuotatori, evidenzia i 32GB interni e l'IPX8: musica in vasca senza telefono.$t$,
  $t$For swimmers, highlight the 32GB onboard storage and IPX8: music in the pool without a phone.$t$,
  $t$Chiarisci che il suono è "aperto", non isolante: chi cerca il basso da palestra va indirizzato sugli auricolari ANC.$t$,
  $t$Make clear the sound is "open", not isolating: bass-seeking gym users are better steered to the ANC earbuds.$t$
),
(
  'pulsar-recover-x', $t$Pulsar Recover X – Pistola Massaggiante$t$,
  $t$Pistola massaggiante percussiva silenziosa con 5 intensità e 4 testine. Recupero muscolare e sollievo dalle tensioni a casa o in palestra.$t$,
  $t$A quiet percussion massage gun with 5 intensities and 4 heads. Muscle recovery and tension relief at home or in the gym.$t$,
  $t$Allarga il pubblico: non solo atleti, ma anche chi sta tante ore al PC e accumula tensioni a collo e spalle.$t$,
  $t$Widen the audience: not just athletes — also desk workers who build up neck and shoulder tension.$t$,
  $t$La silenziosità sotto i 45dB è un argomento concreto: si usa davanti alla TV senza disturbare la famiglia.$t$,
  $t$Sub-45dB quietness is a concrete selling point: use it in front of the TV without disturbing the family.$t$,
  $t$Mostra dal vivo la testina a cono sui trapezi: il sollievo immediato è la dimostrazione che vende da sola.$t$,
  $t$Demo the cone head on the traps live: the instant relief is a demonstration that sells itself.$t$
),
(
  'voltik-snapcell', $t$Voltik SnapCell – Power Bank Magnetico$t$,
  $t$Power bank magnetico ultrasottile da 5.000mAh con ricarica wireless e USB-C PD da 20W. Si aggancia al telefono e raddoppia l'autonomia senza cavi.$t$,
  $t$An ultra-thin 5,000mAh magnetic power bank with wireless charging and 20W USB-C PD. Snaps onto the phone and doubles battery life cable-free.$t$,
  $t$Vendi la comodità del "aggancia e vai": nessun cavo, si usa il telefono mentre si ricarica.$t$,
  $t$Sell the "snap and go" convenience: no cable, and you can use the phone while it charges.$t$,
  $t$Ottimo upsell con qualsiasi iPhone recente o custodia magnetica: è l'accessorio che manca quasi a tutti.$t$,
  $t$Great upsell with any recent iPhone or magnetic case: it's the accessory almost everyone is missing.$t$,
  $t$Verifica che il cliente abbia un telefono MagSafe-compatibile; con gli altri proponilo come power bank USB-C classico.$t$,
  $t$Check the customer has a MagSafe-compatible phone; for others, pitch it as a classic USB-C power bank.$t$
),
(
  'aeris-glow', $t$Aeris Glow – Asciugacapelli ad Alta Velocità$t$,
  $t$Asciugacapelli ad alta velocità con motore da 110.000 RPM, ioni negativi e controllo intelligente della temperatura. Asciuga in fretta proteggendo i capelli.$t$,
  $t$A high-speed hair dryer with a 110,000 RPM motor, negative ions and smart temperature control. Dries fast while protecting the hair.$t$,
  $t$Il risparmio di tempo è l'aggancio: fino al 30% più veloce, perfetto per chi ha i capelli lunghi.$t$,
  $t$Time saving is the hook: up to 30% faster, perfect for people with long hair.$t$,
  $t$Sottolinea la cura del capello: il sensore anti-surriscaldamento e gli ioni evitano i danni del calore.$t$,
  $t$Stress hair care: the anti-overheat sensor and ions prevent heat damage.$t$,
  $t$Fai sentire il peso in mano: la leggerezza rispetto a un phon tradizionale convince soprattutto chi lo usa ogni giorno.$t$,
  $t$Let them feel the weight: the lightness versus a traditional dryer convinces daily users most.$t$
),
(
  'echobox-riff', $t$Echobox Riff – Speaker Bluetooth Retrò$t$,
  $t$Cassa Bluetooth in metallo dal design retrò con radio FM e suono stereo ricco. Robusta e portatile, con 10 ore di autonomia.$t$,
  $t$A retro-design metal Bluetooth speaker with FM radio and rich stereo sound. Rugged and portable, with 10 hours of battery.$t$,
  $t$Il design è metà della vendita: la scocca in metallo retrò piace come oggetto, non solo come speaker.$t$,
  $t$The design is half the sale: the retro metal body appeals as an object, not just a speaker.$t$,
  $t$La radio FM è un plus inatteso: utile in spiaggia, in cantiere o dove manca la connessione.$t$,
  $t$FM radio is an unexpected plus: handy at the beach, on a worksite or where there's no signal.$t$,
  $t$Abbinalo come secondo speaker "da portare in giro" a chi ha già un impianto a casa: ticket medio più alto.$t$,
  $t$Bundle it as a "take-anywhere" second speaker for people who already have a home system: higher average ticket.$t$
),
(
  'nimbus-sip', $t$Nimbus Sip – Borraccia Smart$t$,
  $t$Borraccia smart termica in acciaio con promemoria luminoso di idratazione e tracciamento via app. Fredda 24 ore, calda 12.$t$,
  $t$A smart insulated steel water bottle with a glowing hydration reminder and app tracking. Cold for 24 hours, hot for 12.$t$,
  $t$Posizionala come abitudine di benessere: il promemoria luminoso aiuta davvero chi dimentica di bere.$t$,
  $t$Position it as a wellness habit: the glowing reminder genuinely helps people who forget to drink.$t$,
  $t$Per gli sportivi, l'isolamento termico è l'argomento: acqua fresca per tutto l'allenamento.$t$,
  $t$For athletes, thermal insulation is the angle: cold water for the whole workout.$t$,
  $t$È un ottimo prodotto d'ingresso a basso prezzo: usalo per aprire la conversazione e poi proporre l'anello o la pistola.$t$,
  $t$It's a great low-price entry product: use it to open the conversation, then pitch the ring or the massage gun.$t$
),
(
  'lumio-air', $t$Lumio Air – Mini Proiettore Portatile$t$,
  $t$Mini proiettore Full HD portatile con messa a fuoco automatica, app di streaming integrate e batteria. Trasforma ogni parete in un cinema fino a 120 pollici.$t$,
  $t$A portable Full HD mini projector with autofocus, built-in streaming apps and a battery. Turns any wall into a cinema up to 120 inches.$t$,
  $t$Vendi l'esperienza "cinema ovunque": giardino, camera, viaggio — senza installazione né cavi.$t$,
  $t$Sell the "cinema anywhere" experience: garden, bedroom, travel — no install and no cables.$t$,
  $t$Le app integrate e l'autofocus tolgono ogni complicazione: si accende e funziona, anche per i meno tecnologici.$t$,
  $t$Built-in apps and autofocus remove all friction: it turns on and works, even for less tech-savvy buyers.$t$,
  $t$Mostralo acceso in un angolo in ombra del negozio: l'immagine grande è la dimostrazione che converte di più.$t$,
  $t$Show it running in a shaded corner of the store: the big image is the demo that converts best.$t$
);

-- ── 4. Rename the four stores (ids → city slugs) ────────────────────────────
-- Keeps existing staff scoped to the right store after the rename. Managers
-- (store_id NULL) are unaffected. Historical leads/events keep their old ids.
UPDATE public.store_roles SET store_id = 'rio-de-janeiro' WHERE store_id = 'corso-vercelli';
UPDATE public.store_roles SET store_id = 'lisboa'         WHERE store_id = '5-giornate';
UPDATE public.store_roles SET store_id = 'dublino'        WHERE store_id = 'verona';
UPDATE public.store_roles SET store_id = 'milano'         WHERE store_id = 'bergamo';

COMMIT;

NOTIFY pgrst, 'reload schema';
