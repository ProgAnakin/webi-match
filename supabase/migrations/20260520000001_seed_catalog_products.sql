-- Stage A of the unified-catalog refactor.
--
-- The 10 "base" products were hardcoded in src/data/products.ts, which made
-- them impossible to delete or edit from the manager UI. This migration copies
-- them into `custom_products` so the whole catalog lives in one table — one
-- unified, fully editable/deletable list in Global Catalog Management.
--
-- Idempotent: ON CONFLICT (id) DO NOTHING — re-running it changes nothing, and
-- it will not overwrite a product the manager has already edited.
--
-- After this migration is applied, the code stops spreading the hardcoded
-- array into the product pools (separate commit), so `custom_products` becomes
-- the single source of truth for the quiz and the dashboards.

INSERT INTO public.custom_products
  (id, name, description, price, rating, image_url, video_url, tags, faq, status)
VALUES
(
  'blnd-blender',
  $t$BLND Blender Portatile$t$,
  $t$Frullatore portatile senza fili con motore ad alta velocità e lame in acciaio inox. Frulla frutta fresca e cubetti di ghiaccio, ricarica via USB-C, fino a 15 cicli per carica.$t$,
  '€49,00', 4.6, '/products/blnd-blender.png', '#',
  ARRAY['sport','wellness','travel'],
  $j$[{"q":"Può frullare il ghiaccio?","a":"Sì, le lame in acciaio inox triturano cubetti di ghiaccio e frutta congelata senza problemi."},{"q":"Come si ricarica?","a":"Via cavo USB-C — puoi ricaricarlo in auto, in ufficio o con qualsiasi power bank."},{"q":"Quante frullate fa con una carica?","a":"Fino a 15 cicli completi per carica, sufficienti per più giorni di utilizzo."}]$j$::jsonb,
  'active'
),
(
  'fitring-air',
  $t$FitRing Air – Anello Smart$t$,
  $t$Anello smart ultrasottile con monitoraggio continuo di frequenza cardiaca, SpO2 e qualità del sonno 24/7. Resistente all'acqua 5 ATM e fino a 7 giorni di autonomia.$t$,
  '€79,00', 4.7, '/products/fitring-air.png', '#',
  ARRAY['sport','tech','recovery'],
  $j$[{"q":"Si può indossare in piscina?","a":"Sì, resistenza 5 ATM — nuoto, doccia e mare senza problemi."},{"q":"Monitora il sonno?","a":"Sì, rileva le fasi del sonno ogni notte e ti mostra un punteggio di recupero."},{"q":"Quanto dura la batteria?","a":"Fino a 7 giorni con utilizzo normale, si ricarica in circa un'ora."}]$j$::jsonb,
  'active'
),
(
  'head-hdtw01',
  $t$HEAD HDTW01 – Conduzione Ossea$t$,
  $t$Auricolari a conduzione ossea impermeabili IPX8 con 32GB di memoria interna. Trasmettono il suono attraverso le ossa lasciando le orecchie libere. Ideali per nuoto e sport all'aperto.$t$,
  '€119,00', 4.7, '/products/head-hdtw01.png', '#',
  ARRAY['audio','sport','travel'],
  $j$[{"q":"Si possono usare nuotando?","a":"Sì, certificazione IPX8 — funzionano perfettamente sott'acqua."},{"q":"Serve lo smartphone?","a":"No, 32GB di memoria interna per caricare migliaia di brani e usarli in autonomia."},{"q":"Le orecchie restano libere?","a":"Sì, la conduzione ossea trasmette il suono attraverso le zigomi — le orecchie rimangono completamente aperte."}]$j$::jsonb,
  'active'
),
(
  'ksix-saturn',
  $t$Ksix Anello Saturn Smart$t$,
  $t$Anello smart con sensori integrati per frequenza cardiaca, ossigeno nel sangue e qualità del sonno. Si sincronizza con l'app KSIX Ring, resistente 5 ATM, batteria fino a 3 giorni.$t$,
  '€49,00', 4.5, '/products/ksix-saturn.png', '#',
  ARRAY['tech','productivity','recovery'],
  $j$[{"q":"Con quale app funziona?","a":"Con l'app KSIX Ring, disponibile su iOS e Android — visualizza tutti i tuoi dati in tempo reale."},{"q":"È resistente all'acqua?","a":"Sì, certificazione 5 ATM — puoi tenerlo anche in piscina e sotto la doccia."},{"q":"Quanto dura la batteria?","a":"Fino a 3 giorni di utilizzo, con ricarica magnetica rapida."}]$j$::jsonb,
  'active'
),
(
  'laifen-neo',
  $t$Laifen NEO – Asciugacapelli$t$,
  $t$Asciugacapelli ad alta velocità con motore brushless da 110.000 RPM e 200 milioni di ioni negativi. Controllo intelligente della temperatura, ultra-leggero (390g) e silenzioso (59dB).$t$,
  '€69,00', 4.8, '/products/laifen-neo.png', '#',
  ARRAY['style','wellness','productivity'],
  $j$[{"q":"Asciuga davvero più veloce?","a":"Sì, il motore a 110.000 RPM riduce i tempi di asciugatura del 30% rispetto ai modelli tradizionali."},{"q":"Danneggia i capelli?","a":"No, il controllo intelligente della temperatura previene il surriscaldamento; gli ioni negativi riducono il crespo e aumentano il brillo."},{"q":"È adatto ai viaggi?","a":"Sì, ultra-leggero e silenzioso — perfetto in hotel e appartamenti vacanza."}]$j$::jsonb,
  'active'
),
(
  'muzen-otr',
  $t$MUZEN OTR Metal Speaker$t$,
  $t$Cassa Bluetooth portatile in metallo con design retro e radio FM integrata. Connessione rapida con smartphone e tablet, suono di qualità ovunque tu voglia portarla.$t$,
  '€59,00', 4.6, '/products/muzen-otr.png', '#',
  ARRAY['audio','style','travel'],
  $j$[{"q":"Ha davvero la radio FM?","a":"Sì, sintonizzazione FM integrata — musica anche senza smartphone o connessione internet."},{"q":"È resistente agli urti?","a":"La scocca in metallo pieno la protegge da cadute e graffi quotidiani."},{"q":"Quanto dura la batteria?","a":"Fino a 6 ore di riproduzione continua a volume medio."}]$j$::jsonb,
  'active'
),
(
  'outin-nano',
  $t$Outin Nano – Macchina da Caffè$t$,
  $t$Macchina da espresso portatile con 20 bar di pressione e riscaldamento in 200 secondi. Compatibile con capsule e caffè macinato, batteria da 7.500mAh per più espressi in viaggio.$t$,
  '€129,00', 4.8, '/products/outin-nano.png', '#',
  ARRAY['travel','productivity','wellness'],
  $j$[{"q":"Quanti caffè fa con una carica?","a":"La batteria da 7.500mAh permette di preparare più espressi consecutivi prima di dover ricaricare."},{"q":"Funziona con le capsule?","a":"Sì, compatibile con capsule Nespresso e con caffè macinato — massima libertà di scelta."},{"q":"Il caffè è buono come al bar?","a":"I 20 bar di pressione garantiscono una crema densa e un espresso ricco, paragonabile a una macchina professionale."}]$j$::jsonb,
  'active'
),
(
  'terraillon-massager',
  $t$Terraillon – Massaggiatore a Pistola$t$,
  $t$Massaggiatore a pistola con 4 testine in silicone e beccuccio caldo/freddo. Allevia le tensioni muscolari, migliora la circolazione e accelera il recupero dopo l'allenamento.$t$,
  '€79,00', 4.6, '/products/terraillon-massager.png', '#',
  ARRAY['recovery','sport','wellness'],
  $j$[{"q":"A cosa serve il beccuccio caldo/freddo?","a":"Il calore prepara i muscoli prima dell'allenamento; il freddo riduce l'infiammazione e accelera il recupero dopo."},{"q":"È rumoroso?","a":"No, il motore è progettato per un funzionamento silenzioso, adatto anche in ambienti condivisi."},{"q":"Quante testine include?","a":"4 testine in silicone intercambiabili per trattare diverse zone corporee con la giusta intensità."}]$j$::jsonb,
  'active'
),
(
  'veho-pebble-mg5',
  $t$Veho Pebble MG5 MagSafe$t$,
  $t$Power bank MagSafe ultrasottile (8,3mm) da 5.000mAh con ricarica magnetica wireless e porta USB-C PD per ricarica rapida via cavo. Attacca, ricarica, vai.$t$,
  '€49,00', 4.7, '/products/veho-pebble-mg5.png', '#',
  ARRAY['travel','productivity','tech'],
  $j$[{"q":"Funziona con tutti gli iPhone?","a":"Sì, compatibile con iPhone 12 e successivi tramite connessione magnetica MagSafe."},{"q":"Quanto è sottile?","a":"Solo 8,3mm — spesso quanto una matita. Si aggiunge al telefono senza ingombrare."},{"q":"Si può usare anche con il cavo?","a":"Sì, la porta USB-C PD integrata permette la ricarica rapida anche via cavo con qualsiasi dispositivo."}]$j$::jsonb,
  'active'
),
(
  'veho-zb7',
  $t$Veho ZB-7 – Cuffie Wireless ANC$t$,
  $t$Cuffie over-ear wireless con cancellazione attiva del rumore (ANC), driver da 40mm, 32 ore di autonomia e Bluetooth 5.0. Padiglioni ultra-morbidi per un ascolto confortevole tutto il giorno.$t$,
  '€59,00', 4.7, '/products/veho-zb7.png', '#',
  ARRAY['audio','productivity','style'],
  $j$[{"q":"L'ANC funziona bene?","a":"Sì, elimina efficacemente i rumori di fondo come uffici aperti, mezzi di trasporto e ambienti affollati."},{"q":"Quanto dura la batteria?","a":"32 ore di riproduzione continua — più di un giorno intero senza ricaricare."},{"q":"Ha il microfono per le chiamate?","a":"Sì, microfono integrato per chiamate mani libere chiare e senza disturbi."}]$j$::jsonb,
  'active'
)
ON CONFLICT (id) DO NOTHING;
