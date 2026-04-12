export type Lang = "it" | "en" | "pt" | "es" | "fr";

export interface T {
  welcome: {
    tagline: string;
    firstName: string;
    lastName: string;
    emailPlaceholder: string;
    firstNameError: string;
    lastNameError: string;
    emailError: string;
    cta: string;
    subtitle: string;
  };
  quiz: {
    questionOf: (current: number, total: number) => string;
  };
  tutorial: {
    no: string;
    yes: string;
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
    emailInputLabel: string;
    productImageAlt: string;
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

export const LANGUAGES: { code: Lang; flag: string; label: string }[] = [
  { code: "it", flag: "🇮🇹", label: "IT" },
  { code: "en", flag: "🇬🇧", label: "EN" },
  { code: "pt", flag: "🇧🇷", label: "PT" },
  { code: "es", flag: "🇪🇸", label: "ES" },
  { code: "fr", flag: "🇫🇷", label: "FR" },
];

export const translations: Record<Lang, T> = {
  // ── ITALIANO ──────────────────────────────────────────────────────────────
  it: {
    welcome: {
      tagline: "Trova il tuo gadget perfetto! 🎯",
      firstName: "Nome",
      lastName: "Cognome",
      emailPlaceholder: "La tua email migliore 📧",
      firstNameError: "Inserisci il nome",
      lastNameError: "Inserisci il cognome",
      emailError: "Per favore, inserisci un'email valida.",
      cta: "🚀 INIZIA IL GIOCO!",
      subtitle: "Rispondi a 8 domande veloci e scopri il tuo match perfetto",
    },
    quiz: {
      questionOf: (c, t) => `Domanda ${c} di ${t}`,
    },
    tutorial: {
      no: "← Swipe per NO",
      yes: "Swipe per SÌ →",
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
      emailInputLabel: "Inserisci la tua email per ricevere il gift:",
      productImageAlt: "Immagine prodotto",
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
    welcome: {
      tagline: "Find your perfect gadget! 🎯",
      firstName: "First name",
      lastName: "Last name",
      emailPlaceholder: "Your best email 📧",
      firstNameError: "Enter your first name",
      lastNameError: "Enter your last name",
      emailError: "Please enter a valid email address.",
      cta: "🚀 START THE GAME!",
      subtitle: "Answer 8 quick questions and find your perfect match",
    },
    quiz: {
      questionOf: (c, t) => `Question ${c} of ${t}`,
    },
    tutorial: {
      no: "← Swipe for NO",
      yes: "Swipe for YES →",
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
      emailInputLabel: "Enter your email to receive the gift:",
      productImageAlt: "Product image",
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
    welcome: {
      tagline: "Encontre o seu gadget perfeito! 🎯",
      firstName: "Nome",
      lastName: "Sobrenome",
      emailPlaceholder: "O seu melhor email 📧",
      firstNameError: "Insira o seu nome",
      lastNameError: "Insira o seu sobrenome",
      emailError: "Por favor, insira um email válido.",
      cta: "🚀 COMEÇAR O JOGO!",
      subtitle: "Responda a 8 perguntas rápidas e descubra o seu match perfeito",
    },
    quiz: {
      questionOf: (c, t) => `Pergunta ${c} de ${t}`,
    },
    tutorial: {
      no: "← Swipe para NÃO",
      yes: "Swipe para SIM →",
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
      emailInputLabel: "Insira o seu email para receber o gift:",
      productImageAlt: "Imagem do produto",
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
    welcome: {
      tagline: "¡Encuentra tu gadget perfecto! 🎯",
      firstName: "Nombre",
      lastName: "Apellido",
      emailPlaceholder: "Tu mejor email 📧",
      firstNameError: "Introduce tu nombre",
      lastNameError: "Introduce tu apellido",
      emailError: "Por favor, introduce un email válido.",
      cta: "🚀 ¡EMPEZAR EL JUEGO!",
      subtitle: "Responde 8 preguntas rápidas y descubre tu match perfecto",
    },
    quiz: {
      questionOf: (c, t) => `Pregunta ${c} de ${t}`,
    },
    tutorial: {
      no: "← Swipe para NO",
      yes: "Swipe para SÍ →",
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
      emailInputLabel: "Introduce tu email para recibir el gift:",
      productImageAlt: "Imagen del producto",
    },
    success: {
      title: (n) => `¡Perfecto, ${n}!`,
      titleNoName: "¡Felicidades!",
      productOnWay: "Tu paquete exclusivo está en camino a:",
      recipient: "Destinatario",
      spamNote: "¿No ves el email? Revisa también la carpeta de spam.",
      restart: "🔄 Jugar de Nuevo",
      benefits: {
        video:    { title: "Vídeo exclusivo",   desc: "Nuestro consultor te explica todo en 30 segundos" },
        manual:   { title: "Manual completo",   desc: "Guía paso a paso para empezar ya" },
        faq:      { title: "FAQ",               desc: "Respuestas a las preguntas más frecuentes" },
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
    welcome: {
      tagline: "Trouvez votre gadget parfait ! 🎯",
      firstName: "Prénom",
      lastName: "Nom",
      emailPlaceholder: "Votre meilleur email 📧",
      firstNameError: "Entrez votre prénom",
      lastNameError: "Entrez votre nom",
      emailError: "Veuillez entrer une adresse email valide.",
      cta: "🚀 COMMENCER LE JEU !",
      subtitle: "Répondez à 8 questions rapides et découvrez votre match parfait",
    },
    quiz: {
      questionOf: (c, t) => `Question ${c} sur ${t}`,
    },
    tutorial: {
      no: "← Swipe pour NON",
      yes: "Swipe pour OUI →",
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
      emailInputLabel: "Entrez votre email pour recevoir le gift :",
      productImageAlt: "Image du produit",
    },
    success: {
      title: (n) => `Parfait, ${n} !`,
      titleNoName: "Félicitations !",
      productOnWay: "Votre colis exclusif est en route vers :",
      recipient: "Destinataire",
      spamNote: "Vous ne trouvez pas l'email ? Vérifiez aussi le dossier spam.",
      restart: "🔄 Rejouer",
      benefits: {
        video:    { title: "Vidéo exclusive",   desc: "Notre consultant vous explique tout en 30 secondes" },
        manual:   { title: "Manuel complet",    desc: "Guide étape par étape pour commencer tout de suite" },
        faq:      { title: "FAQ",               desc: "Réponses aux questions les plus fréquentes" },
        discount: { title: "Remise spéciale",   desc: "Réservée uniquement aux joueurs d'aujourd'hui !" },
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
