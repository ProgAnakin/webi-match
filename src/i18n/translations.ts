export type Lang = "it" | "en" | "pt" | "es" | "fr";

export interface T {
  splash: {
    headline: string;
    sub: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    tap: string;
    chooseLang: string;
  };
  welcome: {
    tagline: string;
    firstName: string;
    lastName: string;
    emailPlaceholder: string;
    firstNameError: string;
    lastNameError: string;
    emailError: string;
    cooldownError: (hours: number) => string;
    cta: string;
    subtitle: string;
    noStore: string;
    catalogOffline: string;
    privacy: string;
    noSpam: string;
  };
  quiz: {
    questionOf: (current: number, total: number) => string;
    chooseDestiny: string;
  };
  tutorial: {
    header: string;
    no: string;
    yes: string;
    ready: string;
  };
  swipe: {
    yes: string;
    no: string;
  };
  result: {
    gadgetIntro: (name: string) => string;
    scanning: string;
    match: string;
    perfectMatch: string;
    video: string;
    manual: string;
    discount: string;
    cta: string;
    emailSubtitle: string;
    productImageAlt: string;
    sendTo: string;
    changeEmail: string;
  };
  changeEmail: {
    accessTitle: string;
    pinPrompt: string;
    pinError: string;
    editTitle: string;
    currentEmail: string;
    emailInvalid: string;
    save: string;
    cancel: string;
    emailHint: string;
    connectionError: string;
  };
  success: {
    title: (name: string) => string;
    titleNoName: string;
    productOnWay: string;
    recipient: string;
    spamNote: string;
    restart: string;
    benefits: {
      video: { title: string; desc: string };
      manual: { title: string; desc: string };
      faq: { title: string; desc: string };
      discount: { title: string; desc: string };
    };
  };
  inactivity: {
    title: string;
    countdown: string;
    dismiss: string;
    restart: string;
  };
  questions: Record<number, string>;
}

export const LANGUAGES: { code: Lang; flag: string; label: string; name: string }[] = [
  { code: "it", flag: "🇮🇹", label: "IT", name: "Italiano" },
  { code: "en", flag: "🇬🇧", label: "EN", name: "English" },
  { code: "pt", flag: "🇧🇷", label: "PT", name: "Português" },
  { code: "es", flag: "🇪🇸", label: "ES", name: "Español" },
  { code: "fr", flag: "🇫🇷", label: "FR", name: "Français" },
];

export const translations: Record<Lang, T> = {
  // ── ITALIANO ──────────────────────────────────────────────────────────────
  it: {
    splash: {
      headline: "Trova il tuo gadget tech ideale",
      sub: "in soli 8 swipe",
      step1: "Il prodotto perfetto per te",
      step2: "L'idea regalo ideale",
      step3: "Il gadget che stavi cercando",
      step4: "Il tuo match tech personale",
      tap: "Tocca per iniziare",
      chooseLang: "Scegli la lingua",
    },
    welcome: {
      tagline: "Trova il tuo gadget perfetto! 🎯",
      firstName: "Nome",
      lastName: "Cognome",
      emailPlaceholder: "La tua email",
      firstNameError: "Inserisci il nome",
      lastNameError: "Inserisci il cognome",
      emailError: "Per favore, inserisci un'email valida.",
      cooldownError: (h) => `Hai già partecipato di recente. Riprova tra ${h} ore.`,
      cta: "🚀 INIZIA IL GIOCO!",
      subtitle: "Rispondi a 8 domande veloci e scopri il tuo match perfetto",
      noStore: "Sede non configurata",
      catalogOffline: "⚠ Catalogo offline — verifica connessione",
      privacy: "Dati crittografati · Conformità GDPR",
      noSpam: "Niente spam. Puoi cancellarti in qualsiasi momento.",
    },
    quiz: {
      questionOf: (c, t) => `Domanda ${c} di ${t}`,
      chooseDestiny: "SCEGLI IL TUO DESTINO",
    },
    tutorial: {
      header: "Come funziona?",
      no: "← Swipe per NO",
      yes: "Swipe per SÌ →",
      ready: "Sono pronto!",
    },
    swipe: { yes: "SÌ", no: "NO" },
    result: {
      gadgetIntro: (n) => `${n ? n + "," : ""} il tuo gadget ideale è...`,
      scanning: "analisi...",
      match: "match",
      perfectMatch: "🎉 MATCH PERFETTO!",
      video: "Video 30s",
      manual: "Manuale",
      discount: "Sconto VIP",
      cta: "🎁 Voglio riceverlo!",
      emailSubtitle: "Ricevi video, manuale, FAQ e sconto esclusivo via email",
      productImageAlt: "Immagine prodotto",
      sendTo: "Il match verrà inviato a:",
      changeEmail: "Cambia email",
    },
    changeEmail: {
      accessTitle: "Accesso consulente",
      pinPrompt: "Inserisci il PIN per modificare l'email",
      pinError: "PIN non corretto",
      editTitle: "Modifica email",
      currentEmail: "Email attuale:",
      emailInvalid: "Email non valida",
      save: "Salva email",
      cancel: "Annulla",
      emailHint: "Email non corretta? Chiedi a un consulente presente in negozio di modificarla.",
      connectionError: "Errore di connessione — riprova tra qualche secondo.",
    },
    success: {
      title: (n) => `Perfetto, ${n}!`,
      titleNoName: "Complimenti!",
      productOnWay: "Il tuo pacchetto esclusivo è in arrivo a:",
      recipient: "Destinatario",
      spamNote: "Non vedi l'email? Controlla anche la cartella spam.",
      restart: "🔄 Gioca di Nuovo",
      benefits: {
        video:    { title: "Video esclusivo",  desc: "Il consulente ti spiega tutto in 30 secondi" },
        manual:   { title: "Manuale completo", desc: "Guida passo-passo per iniziare subito" },
        faq:      { title: "FAQ",              desc: "Risposte alle domande più frequenti" },
        discount: { title: "Sconto speciale",  desc: "Riservato solo a chi ha giocato oggi!" },
      },
    },
    inactivity: {
      title: "Sei ancora lì?",
      countdown: "Il quiz si azzererà tra",
      dismiss: "Sono ancora qui! Continua →",
      restart: "Ricomincia dall'inizio",
    },
    questions: {
      1: "Ti alleni regolarmente o pratichi sport?",
      2: "La musica è sempre con te, anche durante l'allenamento?",
      3: "Cerchi sempre modi per ottimizzare il tuo tempo?",
      4: "Dedichi ogni giorno del tempo alla cura di te stesso?",
      5: "Sei spesso in movimento o viaggi fuori casa?",
      6: "Ami i gadget smart che tracciano salute e attività?",
      7: "Il design e l'estetica degli oggetti contano tanto per te?",
      8: "Il recupero fisico e il sonno di qualità sono una priorità?",
    },
  },

  // ── ENGLISH ───────────────────────────────────────────────────────────────
  en: {
    splash: {
      headline: "Find your ideal tech gadget",
      sub: "in just 8 swipes",
      step1: "The perfect product for you",
      step2: "The ideal gift idea",
      step3: "The gadget you were looking for",
      step4: "Your personal tech match",
      tap: "Tap to start",
      chooseLang: "Choose language",
    },
    welcome: {
      tagline: "Find your perfect gadget! 🎯",
      firstName: "First name",
      lastName: "Last name",
      emailPlaceholder: "Your email",
      firstNameError: "Enter your first name",
      lastNameError: "Enter your last name",
      emailError: "Please enter a valid email address.",
      cooldownError: (h) => `You've already played recently. Try again in ${h} hours.`,
      cta: "🚀 START THE GAME!",
      subtitle: "Answer 8 quick questions and find your perfect match",
      noStore: "Store not configured",
      catalogOffline: "⚠ Catalog offline — check connection",
      privacy: "Encrypted data · GDPR compliant",
      noSpam: "No spam. Unsubscribe anytime.",
    },
    quiz: {
      questionOf: (c, t) => `Question ${c} of ${t}`,
      chooseDestiny: "CHOOSE YOUR DESTINY",
    },
    tutorial: {
      header: "How does it work?",
      no: "← Swipe for NO",
      yes: "Swipe for YES →",
      ready: "I'm ready!",
    },
    swipe: { yes: "YES", no: "NO" },
    result: {
      gadgetIntro: (n) => `${n ? n + "," : ""} your ideal gadget is...`,
      scanning: "scanning...",
      match: "match",
      perfectMatch: "🎉 PERFECT MATCH!",
      video: "Video 30s",
      manual: "Manual",
      discount: "VIP Discount",
      cta: "🎁 I want it!",
      emailSubtitle: "Receive the video, manual, FAQ and exclusive discount by email",
      productImageAlt: "Product image",
      sendTo: "Your match will be sent to:",
      changeEmail: "Change email",
    },
    changeEmail: {
      accessTitle: "Consultant access",
      pinPrompt: "Enter the PIN to change the email",
      pinError: "Incorrect PIN",
      editTitle: "Edit email",
      currentEmail: "Current email:",
      emailInvalid: "Invalid email",
      save: "Save email",
      cancel: "Cancel",
      emailHint: "Incorrect email? Ask a store consultant to change it.",
      connectionError: "Connection error — please try again in a moment.",
    },
    success: {
      title: (n) => `Perfect, ${n}!`,
      titleNoName: "Congratulations!",
      productOnWay: "Your exclusive package is on its way to:",
      recipient: "Recipient",
      spamNote: "Can't find the email? Check your spam folder too.",
      restart: "🔄 Play Again",
      benefits: {
        video:    { title: "Exclusive video",   desc: "Our consultant explains everything in 30 seconds" },
        manual:   { title: "Full manual",       desc: "Step-by-step guide to get started right away" },
        faq:      { title: "FAQ",               desc: "Answers to the most common questions" },
        discount: { title: "Special discount",  desc: "Reserved only for today's players!" },
      },
    },
    inactivity: {
      title: "Still there?",
      countdown: "The quiz will reset in",
      dismiss: "I'm still here! Continue →",
      restart: "Restart from the beginning",
    },
    questions: {
      1: "Do you exercise or play sports regularly?",
      2: "Is music always with you, even during workouts?",
      3: "Do you always look for ways to optimize your time?",
      4: "Do you dedicate time every day to taking care of yourself?",
      5: "Are you always on the move or traveling?",
      6: "Do you love smart gadgets that track health and activity?",
      7: "Do design and aesthetics matter a lot to you?",
      8: "Are physical recovery and quality sleep a priority?",
    },
  },

  // ── PORTUGUÊS ─────────────────────────────────────────────────────────────
  pt: {
    splash: {
      headline: "Encontre o seu gadget tech ideal",
      sub: "em apenas 8 swipes",
      step1: "O produto perfeito para você",
      step2: "A ideia de presente ideal",
      step3: "O gadget que você procurava",
      step4: "O seu match tech pessoal",
      tap: "Toque para começar",
      chooseLang: "Escolher idioma",
    },
    welcome: {
      tagline: "Encontre o seu gadget perfeito! 🎯",
      firstName: "Nome",
      lastName: "Sobrenome",
      emailPlaceholder: "O seu email",
      firstNameError: "Insira o seu nome",
      lastNameError: "Insira o seu sobrenome",
      emailError: "Por favor, insira um email válido.",
      cooldownError: (h) => `Você já participou recentemente. Tente novamente em ${h} horas.`,
      cta: "🚀 COMEÇAR O JOGO!",
      subtitle: "Responda a 8 perguntas rápidas e descubra o seu match perfeito",
      noStore: "Loja não configurada",
      catalogOffline: "⚠ Catálogo offline — verifique a conexão",
      privacy: "Dados encriptados · Conformidade GDPR",
      noSpam: "Sem spam. Pode cancelar a qualquer momento.",
    },
    quiz: {
      questionOf: (c, t) => `Pergunta ${c} de ${t}`,
      chooseDestiny: "ESCOLHA O SEU DESTINO",
    },
    tutorial: {
      header: "Como funciona?",
      no: "← Swipe para NÃO",
      yes: "Swipe para SIM →",
      ready: "Estou pronto!",
    },
    swipe: { yes: "SIM", no: "NÃO" },
    result: {
      gadgetIntro: (n) => `${n ? n + "," : ""} o seu gadget ideal é...`,
      scanning: "analisando...",
      match: "match",
      perfectMatch: "🎉 MATCH PERFEITO!",
      video: "Vídeo 30s",
      manual: "Manual",
      discount: "Desconto VIP",
      cta: "🎁 Quero receber!",
      emailSubtitle: "Receba o vídeo, manual, FAQ e desconto exclusivo por email",
      productImageAlt: "Imagem do produto",
      sendTo: "O match será enviado para:",
      changeEmail: "Alterar email",
    },
    changeEmail: {
      accessTitle: "Acesso do consultor",
      pinPrompt: "Insira o PIN para alterar o email",
      pinError: "PIN incorreto",
      editTitle: "Alterar email",
      currentEmail: "Email atual:",
      emailInvalid: "Email inválido",
      save: "Guardar email",
      cancel: "Cancelar",
      emailHint: "Email incorreto? Peça a um consultor na loja para alterá-lo.",
      connectionError: "Erro de ligação — tente novamente em instantes.",
    },
    success: {
      title: (n) => `Perfeito, ${n}!`,
      titleNoName: "Parabéns!",
      productOnWay: "O seu pacote exclusivo está a caminho para:",
      recipient: "Destinatário",
      spamNote: "Não encontra o email? Verifique também a pasta de spam.",
      restart: "🔄 Jogar Novamente",
      benefits: {
        video:    { title: "Vídeo exclusivo",  desc: "O consultor explica tudo em 30 segundos" },
        manual:   { title: "Manual completo",  desc: "Guia passo a passo para começar já" },
        faq:      { title: "FAQ",              desc: "Respostas às perguntas mais frequentes" },
        discount: { title: "Desconto especial", desc: "Reservado só para quem jogou hoje!" },
      },
    },
    inactivity: {
      title: "Ainda está aí?",
      countdown: "O quiz será reiniciado em",
      dismiss: "Ainda estou aqui! Continuar →",
      restart: "Recomeçar do início",
    },
    questions: {
      1: "Você pratica esportes ou se exercita regularmente?",
      2: "A música está sempre com você, mesmo durante os treinos?",
      3: "Você sempre busca formas de otimizar seu tempo?",
      4: "Você dedica tempo todos os dias ao autocuidado?",
      5: "Você está sempre em movimento ou viajando?",
      6: "Você ama gadgets smart que monitoram saúde e atividade?",
      7: "Design e estética são importantes para você?",
      8: "Recuperação física e qualidade do sono são prioridades?",
    },
  },

  // ── ESPAÑOL ───────────────────────────────────────────────────────────────
  es: {
    splash: {
      headline: "Encuentra tu gadget tech ideal",
      sub: "en solo 8 swipes",
      step1: "El producto perfecto para ti",
      step2: "La idea de regalo ideal",
      step3: "El gadget que buscabas",
      step4: "Tu match tech personal",
      tap: "Toca para empezar",
      chooseLang: "Elegir idioma",
    },
    welcome: {
      tagline: "¡Encuentra tu gadget perfecto! 🎯",
      firstName: "Nombre",
      lastName: "Apellido",
      emailPlaceholder: "Tu email",
      firstNameError: "Introduce tu nombre",
      lastNameError: "Introduce tu apellido",
      emailError: "Por favor, introduce un email válido.",
      cooldownError: (h) => `Ya has participado recientemente. Inténtalo de nuevo en ${h} horas.`,
      cta: "🚀 ¡EMPEZAR EL JUEGO!",
      subtitle: "Responde 8 preguntas rápidas y descubre tu match perfecto",
      noStore: "Tienda no configurada",
      catalogOffline: "⚠ Catálogo sin conexión — comprueba la red",
      privacy: "Datos cifrados · Cumplimiento GDPR",
      noSpam: "Sin spam. Puedes darte de baja en cualquier momento.",
    },
    quiz: {
      questionOf: (c, t) => `Pregunta ${c} de ${t}`,
      chooseDestiny: "ELIGE TU DESTINO",
    },
    tutorial: {
      header: "¿Cómo funciona?",
      no: "← Swipe para NO",
      yes: "Swipe para SÍ →",
      ready: "¡Estoy listo!",
    },
    swipe: { yes: "SÍ", no: "NO" },
    result: {
      gadgetIntro: (n) => `${n ? n + "," : ""} tu gadget ideal es...`,
      scanning: "analizando...",
      match: "match",
      perfectMatch: "🎉 ¡MATCH PERFECTO!",
      video: "Vídeo 30s",
      manual: "Manual",
      discount: "Descuento VIP",
      cta: "🎁 ¡Lo quiero!",
      emailSubtitle: "Recibe el vídeo, manual, FAQ y descuento exclusivo por email",
      productImageAlt: "Imagen del producto",
      sendTo: "El match se enviará a:",
      changeEmail: "Cambiar email",
    },
    changeEmail: {
      accessTitle: "Acceso del consultor",
      pinPrompt: "Introduce el PIN para cambiar el email",
      pinError: "PIN incorrecto",
      editTitle: "Editar email",
      currentEmail: "Email actual:",
      emailInvalid: "Email no válido",
      save: "Guardar email",
      cancel: "Cancelar",
      emailHint: "¿Email incorrecto? Pide a un consultor en tienda que lo cambie.",
      connectionError: "Error de conexión — vuelve a intentarlo en un momento.",
    },
    success: {
      title: (n) => `¡Perfecto, ${n}!`,
      titleNoName: "¡Felicidades!",
      productOnWay: "Tu paquete exclusivo está en camino a:",
      recipient: "Destinatario",
      spamNote: "¿No ves el email? Revisa también la carpeta de spam.",
      restart: "🔄 Jugar de Nuevo",
      benefits: {
        video:    { title: "Vídeo exclusivo",    desc: "Nuestro consultor te explica todo en 30 segundos" },
        manual:   { title: "Manual completo",    desc: "Guía paso a paso para empezar ya" },
        faq:      { title: "FAQ",                desc: "Respuestas a las preguntas más frecuentes" },
        discount: { title: "Descuento especial", desc: "¡Solo para quienes han jugado hoy!" },
      },
    },
    inactivity: {
      title: "¿Sigues ahí?",
      countdown: "El quiz se reiniciará en",
      dismiss: "¡Sigo aquí! Continuar →",
      restart: "Volver a empezar desde el inicio",
    },
    questions: {
      1: "¿Practicas deporte o haces ejercicio regularmente?",
      2: "¿La música siempre te acompaña, incluso en tus entrenamientos?",
      3: "¿Siempre buscas formas de optimizar tu tiempo?",
      4: "¿Dedicas tiempo cada día al cuidado personal?",
      5: "¿Siempre estás en movimiento o de viaje?",
      6: "¿Te gustan los gadgets smart que monitorizan salud y actividad?",
      7: "¿El diseño y la estética son importantes para ti?",
      8: "¿La recuperación física y el sueño de calidad son prioridades?",
    },
  },

  // ── FRANÇAIS ──────────────────────────────────────────────────────────────
  fr: {
    splash: {
      headline: "Trouvez votre gadget tech idéal",
      sub: "en seulement 8 swipes",
      step1: "Le produit parfait pour vous",
      step2: "L'idée cadeau idéale",
      step3: "Le gadget que vous cherchiez",
      step4: "Votre match tech personnel",
      tap: "Touchez pour commencer",
      chooseLang: "Choisir la langue",
    },
    welcome: {
      tagline: "Trouvez votre gadget parfait ! 🎯",
      firstName: "Prénom",
      lastName: "Nom",
      emailPlaceholder: "Votre email",
      firstNameError: "Entrez votre prénom",
      lastNameError: "Entrez votre nom",
      emailError: "Veuillez entrer une adresse email valide.",
      cooldownError: (h) => `Vous avez déjà participé récemment. Réessayez dans ${h} heures.`,
      cta: "🚀 COMMENCER LE JEU !",
      subtitle: "Répondez à 8 questions rapides et découvrez votre match parfait",
      noStore: "Boutique non configurée",
      catalogOffline: "⚠ Catalogue hors ligne — vérifiez la connexion",
      privacy: "Données chiffrées · Conformité RGPD",
      noSpam: "Aucun spam. Désinscription possible à tout moment.",
    },
    quiz: {
      questionOf: (c, t) => `Question ${c} sur ${t}`,
      chooseDestiny: "CHOISISSEZ VOTRE DESTIN",
    },
    tutorial: {
      header: "Comment ça marche ?",
      no: "← Swipe pour NON",
      yes: "Swipe pour OUI →",
      ready: "Je suis prêt !",
    },
    swipe: { yes: "OUI", no: "NON" },
    result: {
      gadgetIntro: (n) => `${n ? n + "," : ""} votre gadget idéal est...`,
      scanning: "analyse...",
      match: "match",
      perfectMatch: "🎉 MATCH PARFAIT !",
      video: "Vidéo 30s",
      manual: "Manuel",
      discount: "Remise VIP",
      cta: "🎁 Je le veux !",
      emailSubtitle: "Recevez la vidéo, le manuel, la FAQ et la remise exclusive par email",
      productImageAlt: "Image du produit",
      sendTo: "Le match sera envoyé à :",
      changeEmail: "Changer l'email",
    },
    changeEmail: {
      accessTitle: "Accès consultant",
      pinPrompt: "Entrez le PIN pour modifier l'email",
      pinError: "PIN incorrect",
      editTitle: "Modifier l'email",
      currentEmail: "Email actuel :",
      emailInvalid: "Email invalide",
      save: "Enregistrer l'email",
      cancel: "Annuler",
      emailHint: "Email incorrect ? Demandez à un consultant en magasin de le modifier.",
      connectionError: "Erreur de connexion — réessayez dans un instant.",
    },
    success: {
      title: (n) => `Parfait, ${n} !`,
      titleNoName: "Félicitations !",
      productOnWay: "Votre colis exclusif est en route vers :",
      recipient: "Destinataire",
      spamNote: "Vous ne trouvez pas l'email ? Vérifiez aussi le dossier spam.",
      restart: "🔄 Rejouer",
      benefits: {
        video:    { title: "Vidéo exclusive",  desc: "Notre consultant vous explique tout en 30 secondes" },
        manual:   { title: "Manuel complet",   desc: "Guide étape par étape pour commencer tout de suite" },
        faq:      { title: "FAQ",              desc: "Réponses aux questions les plus fréquentes" },
        discount: { title: "Remise spéciale",  desc: "Réservée uniquement aux joueurs d'aujourd'hui !" },
      },
    },
    inactivity: {
      title: "Vous êtes encore là ?",
      countdown: "Le quiz sera réinitialisé dans",
      dismiss: "Je suis encore là ! Continuer →",
      restart: "Recommencer depuis le début",
    },
    questions: {
      1: "Faites-vous du sport ou de l'exercice régulièrement ?",
      2: "La musique vous accompagne-t-elle toujours, même à l'entraînement ?",
      3: "Cherchez-vous toujours à optimiser votre temps ?",
      4: "Consacrez-vous du temps chaque jour à prendre soin de vous ?",
      5: "Êtes-vous souvent en déplacement ou en voyage ?",
      6: "Aimez-vous les gadgets intelligents qui suivent santé et activité ?",
      7: "Le design et l'esthétique comptent-ils beaucoup pour vous ?",
      8: "La récupération physique et le sommeil de qualité sont-ils prioritaires ?",
    },
  },
};
