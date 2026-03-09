export type Language = "fr" | "en" | "es" | "de" | "it" | "pt";

export const translations: Record<Language, Record<string, string>> = {
  fr: {
    // Application
    "app.title": "TerraCoast",

    // Navigation
    "nav.home": "Accueil",
    "nav.quizzes": "Quiz",
    "nav.leaderboard": "Classement",
    "nav.friends": "Amis",
    "nav.duels": "Duels",
    "nav.chat": "Chat",
    "nav.profile": "Profil",
    "nav.settings": "Paramètres",
    "nav.admin": "Admin",
    "nav.logout": "Déconnexion",
    "nav.social": "Social",

    // Authentification
    "auth.login": "Connexion",
    "auth.register": "Inscription",
    "auth.email": "Email",
    "auth.password": "Mot de passe",
    "auth.pseudo": "Pseudo",
    "auth.confirmPassword": "Confirmer le mot de passe",
    "auth.alreadyAccount": "Déjà un compte ?",
    "auth.noAccount": "Pas encore de compte ?",
    "auth.signIn": "Se connecter",
    "auth.signUp": "S'inscrire",

    // Common
    "common.save": "Enregistrer",
    "common.cancel": "Annuler",
    "common.loading": "Chargement...",
    "common.error": "Erreur",
    "common.success": "Succès",
    "common.back": "Retour",
    "common.close": "Fermer",
    "common.confirm": "Confirmer",
    "common.all": "Tous",
    "common.search": "Rechercher",
    "common.day": "jour",
    "common.days": "jours",
    "common.clickForDetails": "Clique pour plus de détails",

    // Home
    "home.welcome": "Bienvenue",
    "home.readyToTest": "Prêt à tester tes connaissances en géographie ?",
    "home.accountBanned": "Compte banni",
    "home.temporaryBanUntil": "Ton compte est temporairement banni jusqu'au",
    "home.permanentBan": "Ton compte est banni de manière permanente",
    "home.reason": "Raison",
    "home.notSpecified": "Non spécifiée",
    "home.warningsReceived": "Avertissements reçus",
    "home.warning": "Avertissement",
    "home.note": "Note",
    "home.respectRules":
      "Merci de respecter les règles de la communauté pour éviter d'autres sanctions",
    "home.gamesPlayed": "Parties jouées",
    "home.totalSessions": "Total de tes sessions",
    "home.currentStreak": "Série en cours",
    "home.record": "Record",
    "home.dailyPoints": "Points du jour",
    "home.pts": "pts",
    "home.quickActions": "Actions rapides",
    "home.exploreQuizzes": "Explorer les quiz",
    "home.discoverNewChallenges": "Découvre de nouveaux défis",
    "home.shareKnowledge": "Partage ton savoir",
    "home.trainingMode": "Mode Entraînement",
    "home.noTimeLimit": "Sans limite de temps",
    "home.challengeFriend": "Défie un ami",
    "home.realTimeDuel": "Duel en temps réel",
    "home.trendingQuizzes": "Quiz en tendance",
    "home.newAndPopular": "Nouveaux & populaires",
    "home.new": "NOUVEAU",
    "home.games": "parties",
    "home.thisWeek": "cette semaine",
    "home.easy": "Facile",
    "home.medium": "Moyen",
    "home.hard": "Difficile",

    // Quiz
    "quiz.create": "Créer un quiz",
    "quiz.edit": "Modifier",
    "quiz.delete": "Supprimer",
    "quiz.play": "Jouer",
    "quiz.share": "Partager",
    "quiz.publish": "Publier",
    "quiz.title": "Titre",
    "quiz.description": "Description",
    "quiz.category": "Catégorie",
    "quiz.difficulty": "Difficulté",
    "quiz.language": "Langue",
    "quiz.questions": "Questions",
    "quiz.submit": "Valider",
    "quiz.next": "Suivant",
    "quiz.finish": "Terminer",
    "quiz.replay": "Rejouer",
    "quiz.explore": "Explorer d'autres quiz",
    "quiz.myQuizzes": "Mes quiz",
    "quiz.publicQuizzes": "Quiz publics",
    "quiz.sharedQuizzes": "Quiz partagés",
    "quiz.noQuizzes": "Aucun quiz disponible",
    "quiz.backToList": "Retour à la liste",

    // Quizzes (liste)
    "quizzes.title": "Quiz de géographie",
    "quizzes.subtitle": "Explore et joue à des quiz créés par la communauté",
    "quizzes.searchPlaceholder": "Rechercher un quiz...",
    "quizzes.allCategories": "Toutes catégories",
    "quizzes.allDifficulties": "Toutes difficultés",
    "quizzes.allTypes": "Tous types",
    "quizzes.category.flags": "Drapeaux",
    "quizzes.category.capitals": "Capitales",
    "quizzes.category.maps": "Cartes",
    "quizzes.category.borders": "Frontières",
    "quizzes.category.regions": "Régions",
    "quizzes.category.mixed": "Mixte",
    "quizzes.difficulty.easy": "Facile",
    "quizzes.difficulty.medium": "Moyen",
    "quizzes.difficulty.hard": "Difficile",
    "quizzes.global": "Global",
    "quizzes.games": "parties",
    "quizzes.average": "Moy",
    "quizzes.trainingMode": "Mode entraînement",
    "quizzes.shareWithFriends": "Partager avec des amis",
    "quizzes.publishDirectly": "Publier directement",
    "quizzes.requestPublish": "Demander la publication",
    "quizzes.removeFromList": "Retirer de ma liste",
    "quizzes.noQuizFound": "Aucun quiz trouvé",
    "quizzes.noQuizCreated": "Tu n'as pas encore créé de quiz",
    "quizzes.noQuizShared": "Aucun quiz partagé avec toi",
    "quizzes.tryDifferentFilters": "Essaie de modifier tes filtres",
    "quizzes.confirmPublishRequest": 'Demander la publication de "{title}" ?',
    "quizzes.publishRequestError": "Erreur lors de la demande",
    "quizzes.publishRequestSuccess":
      "Demande envoyée ! Un administrateur validera ton quiz.",
    "quizzes.publishError": "Erreur lors de la publication",
    "quizzes.publishSuccess": "Quiz publié avec succès !",
    "quizzes.confirmRemoveShared":
      "Veux-tu retirer ce quiz de ta liste partagée ?",
    "quizzes.removeSuccess": "Quiz retiré de ta liste avec succès !",
    "quizzes.removeError": "Erreur lors de la suppression",
    "quizzes.confirmDelete":
      "Es-tu sûr de vouloir supprimer le quiz '{title}' ? Cette action est irréversible.",
    "quizzes.deleteSuccess": "Quiz supprimé avec succès !",
    "quizzes.deleteError": "Erreur lors de la suppression du quiz",
    "quizzes.deleteQuestionsError":
      "Erreur lors de la suppression des questions",
    "quizzes.deleteQuiz": "Supprimer le quiz",
    "profile.daysToBreakRecord": "jours pour battre ton record",

    // Create Quiz
    "createQuiz.title": "Créer un quiz",
    "createQuiz.subtitle": "Crée ton propre quiz de géographie",
    "createQuiz.quizType": "Type de quiz",
    "createQuiz.noType": "Aucun type",
    "createQuiz.randomizeQuestions": "Mélange l'ordre des questions",
    "createQuiz.randomizeAnswers": "Mélange l'ordre des réponses (QCM)",
    "createQuiz.publicQuizAdmin":
      "Quiz public - En tant qu'admin, ce sera un quiz global approuvé immédiatement",
    "createQuiz.submitValidation":
      "Soumettre pour validation ({count}/10 quiz publiés)",
    "createQuiz.addQuestion": "Ajouter une question",
    "createQuiz.questionPlaceholder":
      "Ex: Quelle est la capitale de la France ?",
    "createQuiz.questionImageDesc":
      "Ajoute une image pour illustrer ta question",
    "createQuiz.trueFalse.type": "Vrai / Faux",
    "createQuiz.trueFalse.description":
      "Pour les questions Vrai/Faux, les options sont automatiquement définies. Sélectionne simplement la bonne réponse ci-dessous.",
    "createQuiz.trueFalse.true": "Vrai",
    "createQuiz.trueFalse.false": "Faux",
    "createQuiz.optionsMinTwo": "Options (2 minimum)",
    "createQuiz.optionImageDesc":
      "Ajoute des images pour chaque option (ex: drapeaux). Parfait pour les quiz visuels !",
    "createQuiz.multipleCorrect":
      "Sélectionne une ou plusieurs réponses correctes (ex: Capitales d'Afrique du Sud)",
    "createQuiz.answerPlaceholder": "Ex: Paris",
    "createQuiz.variants": "Variantes acceptées (optionnel)",
    "createQuiz.variantPlaceholder": "Variante {number} (ex: paris, PARIS)",
    "createQuiz.addVariant": "Ajouter une variante",
    "createQuiz.variantsDesc":
      'Ajoute plusieurs variantes acceptées (ex: "Paris", "paris", "La capitale de la France")',
    "createQuiz.editingQuestion": "Modification de la question #{number}",
    "createQuiz.updateQuestion": "Mettre à jour",
    "createQuiz.addThisQuestion": "Ajouter cette question",
    "createQuiz.questionsAdded": "Questions ajoutées",
    "createQuiz.answer": "Réponse",
    "createQuiz.saveQuiz": "Enregistrer le quiz",
    "createQuiz.success": "Quiz créé avec succès !",
    "createQuiz.errors.questionEmpty": "La question ne peut pas être vide",
    "createQuiz.errors.answerEmpty":
      "La réponse correcte ne peut pas être vide",
    "createQuiz.errors.minTwoOptions": "Il faut au moins 2 options pour un QCM",
    "createQuiz.errors.answerMustBeOption":
      "La réponse correcte doit être dans les options",
    "createQuiz.errors.maxQuizReached":
      "Tu as atteint la limite de 10 quiz publics",
    "createQuiz.errors.createError": "Erreur lors de la création du quiz",
    "createQuiz.searchTags": "Tags de recherche (Europe, Asie ...)",
    "createQuiz.addTagPlaceholder": "Ajoute un tag et appuie sur Entrée...",
    "createQuiz.maxTags": "Maximum 10 tags",
    "createQuiz.complementIfWrongPlaceholder":
      "Texte affiché lorsque la réponse est fausse",
    "createQuiz.complementIfWrong":
      "Complément si mauvaise réponse (optionnel)",

    // Edit Quiz
    "editQuiz.confirmDeleteQuestion":
      "Veux-tu vraiment supprimer cette question ?",
    "editQuiz.titleRequired": "Un titre ou une image de couverture est requis",
    "editQuiz.atLeastOneQuestion": "Ajoute au moins une question",
    "editQuiz.updateSuccess": "Quiz mis à jour avec succès !",
    "editQuiz.updateError": "Erreur lors de la mise à jour du quiz",
    "editQuiz.loadingQuiz": "Chargement du quiz...",
    "editQuiz.backToQuizzes": "Retour aux quiz",
    "editQuiz.title": "Modifier le quiz",
    "editQuiz.subtitle": "Édite ton quiz de géographie",
    "editQuiz.quizInfo": "Informations du quiz",
    "editQuiz.quizTitle": "Titre du quiz",
    "editQuiz.titlePlaceholder": "Ex: Capitales d'Europe",
    "editQuiz.description": "Description",
    "editQuiz.descriptionPlaceholder": "Décris ton quiz...",
    "editQuiz.coverImage": "Image de couverture",
    "editQuiz.language": "Langue",
    "editQuiz.category": "Catégorie",
    "editQuiz.difficulty": "Difficulté",
    "editQuiz.timePerQuestion": "Temps par question (sec)",
    "editQuiz.questions": "Questions",
    "editQuiz.addQuestion": "Ajouter une question",
    "editQuiz.question": "Question",
    "editQuiz.questionImageOptional": "Image de la question (optionnel)",
    "editQuiz.questionType.label": "Type de question",
    "editQuiz.questionType.mcq": "QCM",
    "editQuiz.questionType.single_answer": "Réponse unique",
    "editQuiz.questionType.text_free": "Texte libre",
    "editQuiz.questionType.map_click": "Clic sur carte",
    "editQuiz.questionType.true_false": "Vrai/Faux",
    "editQuiz.points": "Points",
    "editQuiz.options": "Options",
    "editQuiz.option": "Option",
    "editQuiz.imageForOption": 'Image pour "{option}" (optionnel)',
    "editQuiz.correctAnswer": "Réponse correcte",
    "editQuiz.select": "Sélectionne",
    "editQuiz.imageIncluded": "Image incluse",
    "editQuiz.saving": "Enregistrement...",
    "editQuiz.saveChanges": "Enregistrer les modifications",
    "editQuiz.deleteQuestionSuccess": "Question supprimée avec succès !",
    "editQuiz.deleteQuestionError":
      "Erreur lors de la suppression de la question",

    // Play Quiz
    "playQuiz.selectAnswer": "Merci de sélectionner ou d'entrer une réponse",
    "playQuiz.loadingQuiz": "Chargement du quiz...",
    "playQuiz.trainingComplete": "Entraînement terminé !",
    "playQuiz.quizComplete": "Quiz terminé !",
    "playQuiz.trainingMessage": "Bon travail ! Continue à t'entraîner",
    "playQuiz.congratsMessage": "Félicitations pour avoir complété ce quiz",
    "playQuiz.totalScore": "Score total",
    "playQuiz.xpGained": "XP gagné",
    "playQuiz.accuracy": "Précision",
    "playQuiz.correctAnswers": "Bonnes réponses",
    "playQuiz.summary": "Récapitulatif",
    "playQuiz.yourAnswer": "Ta réponse",
    "playQuiz.noAnswer": "Pas de réponse",
    "playQuiz.correctAnswer": "Bonne réponse",
    "playQuiz.exploreOtherQuizzes": "Explorer d'autres quiz",
    "playQuiz.playAgain": "Rejouer",
    "playQuiz.confirmQuit":
      "Es-tu sûr de vouloir quitter ? Ta progression sera perdue.",
    "playQuiz.quit": "Quitter",
    "playQuiz.trainingMode": "Mode Entraînement",
    "playQuiz.question": "Question",
    "playQuiz.questionImage": "Question",
    "playQuiz.enterAnswer": "Entre ta réponse...",
    "playQuiz.mapClickComing": "Fonctionnalité de clic sur carte à venir",
    "playQuiz.correct": "Correct !",
    "playQuiz.incorrect": "Incorrect",
    "playQuiz.correctAnswerWas": "La bonne réponse était",
    "playQuiz.validate": "Valider",
    "playQuiz.variants": "Variantes",
    "playQuiz.acceptedVariants": "Variantes acceptées",
    "playQuiz.nextQuestion": "Question suivante",
    "playQuiz.explanation": "Explication",
    "playQuiz.finishQuiz": "Terminer le quiz",

    // Training
    "training.title": "Mode Entraînement",
    "training.subtitle": "Pratique sans limite de temps et sans gagner d'XP",
    "training.features": "Caractéristiques du mode entraînement",
    "training.feature1":
      "Pas de limite de temps - prends le temps de réfléchir",
    "training.feature2": "Pas de gain d'XP - juste pour s'entraîner",
    "training.feature3": "Choisis le nombre de questions",
    "training.feature4": "Validation immédiate avec explications",
    "training.step1": "1. Choisis un quiz",
    "training.step2": "2. Nombre de questions",
    "training.searchQuiz": "Rechercher un quiz...",
    "training.games": "parties",
    "training.questions": "questions",
    "training.max": "max",
    "training.start": "Commencer l'entraînement",

    // Profile
    "profile.back": "Retour",
    "profile.level": "Niveau",
    "profile.xp": "XP",
    "profile.games": "Parties",
    "profile.badges": "Badges",
    "profile.statistics": "Statistiques",
    "profile.titles": "Titres",
    "profile.active": "Actif",
    "profile.settings": "Paramètres",
    "profile.accountDetails": "Détails du compte",
    "profile.addFriend": "Ajouter en ami",
    "profile.requestSent": "Demande envoyée",
    "profile.requestPending": "Demande envoyée",
    "profile.friend": "Ami",
    "profile.friends": "Amis",
    "profile.history": "Historique",
    "profile.report": "Signaler",
    "profile.warnUser": "Avertir l'utilisateur",
    "profile.warningHistory": "Historique des avertissements",
    "profile.gamesPlayed": "Parties jouées",
    "profile.successRate": "Taux de réussite",
    "profile.noTitles": "Aucun titre obtenu",
    "profile.activateTitle": "Activer",
    "profile.activeTitle": "Actif",
    "profile.last7Days": "Points des 7 derniers jours",
    "profile.total": "Total",
    "profile.noGamesThisWeek": "Aucune partie jouée cette semaine",
    "profile.noBadges": "Aucun badge obtenu",
    "profile.recentGames": "Dernières parties",
    "profile.noGamesYet": "Aucune partie jouée",
    "profile.unknownQuiz": "Quiz inconnu",
    "profile.score": "Score",
    "profile.accuracy": "Précision",
    "profile.questions": "Questions",
    "profile.time": "Temps",
    "profile.completed": "Terminé",
    "profile.inProgress": "En cours",
    "profile.noGames": "Aucune partie jouée",
    "profile.progressChart": "Graphique de progression",
    "profile.myProgress": "Ma progression",
    "profile.user": "Utilisateur",
    "profile.clickPointInfo": "Clique sur un point pour voir les détails",
    "profile.streakDetails": "Détails de la série",
    "profile.streakStartedOn": "Série commencée le",

    "profile.currentStreak": "Série actuelle",
    "profile.longestStreak": "Meilleure série",
    "profile.keepGoing": "Continue comme ça !",
    "profile.playTodayToKeepStreak": "Joue aujourd'hui pour maintenir ta série",
    "profile.dayDetails": "Détails du jour",
    "profile.date": "Date",
    "profile.myScore": "Mon score",
    "profile.difference": "Différence",
    "profile.reportUser": "Signaler {user}",
    "profile.reportDescription":
      "Décris la raison de ton signalement. Un administrateur examinera ta demande.",
    "profile.reportReason": "Raison du signalement...",
    "profile.warnReason": "Raison de l'avertissement...",
    "profile.sendWarning": "Envoyer l'avertissement",
    "profile.sending": "Envoi...",
    "profile.noWarnings": "Aucun avertissement trouvé",
    "profile.status": "Statut",
    "profile.reportedBy": "Signalé par",
    "profile.unknown": "Inconnu",
    "profile.adminNotes": "Notes admin",
    "profile.tempBanUntil": "Ban temporaire jusqu'au",
    "profile.friendRequestError": "Erreur lors de l'envoi de la demande",
    "profile.friendRequestSent": "Demande d'ami envoyée !",
    "profile.reportError": "Erreur lors de l'envoi du signalement",
    "profile.reportSuccess": "Signalement envoyé avec succès",
    "profile.toNextLevel": "jusqu'au prochain niveau",
    "profile.you": "Toi",
    "profile.yourTotal": "Ton total",
    "profile.close": "Fermer",

    // Leaderboard
    "leaderboard.title": "Classement",
    "leaderboard.subtitle": "Les meilleurs joueurs de TerraCoast",
    "leaderboard.monthly": "Classement mensuel",
    "leaderboard.rank": "Rang",
    "leaderboard.global": "Classement mondial",
    "leaderboard.friends": "Entre amis",
    "leaderboard.thisMonth": "Ce mois-ci",
    "leaderboard.allTime": "Tous les temps",
    "leaderboard.monthlyReset":
      "Les scores sont réinitialisés chaque mois. Top 10 reçoivent un titre !",
    "leaderboard.loading": "Chargement du classement...",
    "leaderboard.noPlayers": "Aucun joueur",
    "leaderboard.emptyLeaderboard": "Le classement est vide pour le moment",
    "leaderboard.game": "partie",
    "leaderboard.games": "parties",
    "leaderboard.thisMonthShort": "ce mois",
    "leaderboard.top10": "Top 10",
    "leaderboard.totalPoints": "points totaux",

    // Friends
    "friends.title": "Amis",
    "friends.subtitle": "Gère tes amis et tchatte ensemble",
    "friends.addFriend": "Ajouter en ami",
    "friends.pending": "En attente",
    "friends.myFriends": "Mes amis",
    "friends.pendingRequests": "Demandes en attente",
    "friends.accept": "Accepter",
    "friends.reject": "Refuser",
    "friends.suggestions": "Suggestions d'amis",
    "friends.add": "Ajouter",
    "friends.searchTitle": "Rechercher des amis",
    "friends.searchPlaceholder": "Rechercher par pseudo...",
    "friends.myFriendsTitle": "Mes amis",
    "friends.noFriends": "Tu n'as pas encore d'amis",
    "friends.sendMessage": "Envoyer un message",
    "friends.removeFriend": "Retirer de mes amis",
    "friends.requestSent": "Demande envoyée !",
    "friends.confirmRemove": "Veux-tu vraiment retirer {name} de tes amis ?",

    // Duels
    "duels.title": "Duels",
    "duels.subtitle": "Affronte tes amis en temps réel",
    "duels.createDuel": "Créer un duel",
    "duels.activeDuels": "Duels actifs",
    "duels.invitations": "Invitations",
    "duels.history": "Historique",
    "duels.noActiveDuels": "Aucun duel actif",
    "duels.createOrAccept": "Crée un duel ou accepte une invitation",
    "duels.vs": "vs",
    "duels.youPlayed": "Tu as joué",
    "duels.waiting": "En attente",
    "duels.hasPlayed": "a joué",
    "duels.hasNotPlayed": "n'a pas joué",
    "duels.alreadyPlayed": "Déjà joué",
    "duels.receivedInvitations": "Invitations reçues",
    "duels.challengesYou": "te défie !",
    "duels.sentInvitations": "Invitations envoyées",
    "duels.invitationTo": "Invitation à",
    "duels.noInvitations": "Aucune invitation",
    "duels.createToChallenge": "Crée un duel pour défier tes amis",
    "duels.noCompletedDuels": "Aucun duel terminé",
    "duels.historyAppears": "Ton historique de duels apparaîtra ici",
    "duels.victory": "Victoire",
    "duels.defeat": "Défaite",
    "duels.draw": "Match nul",
    "duels.inProgress": "En cours",
    "duels.winner": "Vainqueur",
    "duels.you": "Toi",
    "duels.opponent": "Adversaire",
    "duels.score": "Score",
    "duels.accuracy": "Précision",
    "duels.rate": "Taux",
    "duels.gap": "Écart",
    "duels.yourScore": "Ton score",
    "duels.chooseFriend": "Choisir un ami",
    "duels.selectFriend": "Sélectionne un ami",
    "duels.chooseQuiz": "Choisir un quiz",
    "duels.selectQuiz": "Sélectionne un quiz",
    "duels.sending": "Envoi...",
    "duels.viewResults": "Voir les résultats",

    // Chat
    "chat.noMessages": "Aucun message",
    "chat.typeMessage": "Tape ton message...",
    "chat.send": "Envoyer",
    "chat.backToQuizzes": "Retour aux quiz",
    "chat.messages": "Messages",
    "chat.noFriends": "Aucun ami",
    "chat.user": "Utilisateur",
    "chat.deletedUser": "Utilisateur supprimé",
    "chat.selectFriend": "Sélectionne un ami pour commencer à discuter",

    // Share
    "share.title": "Partager le quiz",
    "share.success": "Quiz partagé !",
    "share.successMessage": "Tes amis peuvent maintenant y accéder",
    "share.shareWith": 'Partage "{title}" avec tes amis',
    "share.sharing": "Partage...",

    // Settings
    "settings.language": "Langue",
    "settings.showAllLanguages": "Afficher tous les quiz (toutes langues)",
    "settings.showOnlyMyLanguage":
      "Afficher uniquement les quiz dans ma langue",
    "settings.accountSettings": "Paramètres du compte",
    "settings.backToProfile": "Retour au profil",
    "settings.pseudoRequired": "Le pseudo ne peut pas être vide",
    "settings.pseudoUpdateError": "Erreur lors de la mise à jour du pseudo",
    "settings.pseudoUpdateSuccess": "Pseudo mis à jour avec succès",
    "settings.emailPasswordRequired": "Email et mot de passe actuel requis",
    "settings.incorrectPassword": "Mot de passe incorrect",
    "settings.emailUpdateError": "Erreur lors de la mise à jour de l'email",
    "settings.emailConfirmationSent":
      "Un email de confirmation a été envoyé à ta nouvelle adresse",
    "settings.supabaseChangeRequiresEmailConfirmation":
      "Pour certains changements sensibles (email, sécurité), Supabase envoie un email de confirmation.",
    "settings.allFieldsRequired": "Tous les champs sont requis",
    "settings.passwordsMismatch": "Les mots de passe ne correspondent pas",
    "settings.passwordTooShort":
      "Le mot de passe doit contenir au moins 6 caractères",
    "settings.currentPasswordIncorrect": "Mot de passe actuel incorrect",
    "settings.passwordUpdateError":
      "Erreur lors de la mise à jour du mot de passe",
    "settings.passwordUpdateSuccess": "Mot de passe mis à jour avec succès",
    "settings.deleteConfirmation":
      'Cette action est irréversible. Tape "SUPPRIMER" pour confirmer :',
    "settings.deleteKeyword": "SUPPRIMER",
    "settings.deleteAccountError": "Erreur lors de la suppression du compte",
    "settings.manageInfo": "Gère tes informations personnelles",
    "settings.languagePreferences": "Langue et préférences",
    "settings.interfaceLanguage": "Langue de l'interface",
    "settings.showAllLanguagesDescription":
      "Affiche tous les quiz dans toutes les langues (sinon, uniquement les quiz dans ma langue)",
    "settings.username": "Pseudo",
    "settings.newUsername": "Nouveau pseudo",
    "settings.yourUsername": "Ton pseudo",
    "settings.updateUsername": "Mettre à jour le pseudo",
    "settings.emailAddress": "Adresse email",
    "settings.newEmail": "Nouvelle adresse email",
    "settings.newEmailPlaceholder": "nouvelle@email.com",
    "settings.currentPassword": "Mot de passe actuel",
    "settings.updateEmail": "Mettre à jour l'email",
    "settings.password": "Mot de passe",
    "settings.newPassword": "Nouveau mot de passe",
    "settings.confirmNewPassword": "Confirmer le nouveau mot de passe",
    "settings.updatePassword": "Mettre à jour le mot de passe",
    "settings.dangerZone": "Zone de danger",
    "settings.deleteWarning":
      "Supprimer ton compte est une action irréversible. Toutes tes données seront perdues.",
    "settings.deleteAccount": "Supprimer mon compte",
    "settings.currentPasswordRequired": "Le mot de passe actuel est requis",
    "settings.twoFactorTitle": "Double authentification (2FA)",
    "settings.twoFactorStatus": "Statut",
    "settings.twoFactorEnabled": "Activée",
    "settings.twoFactorDisabled": "Désactivée",
    "settings.twoFactorStart": "Activer la 2FA",
    "settings.twoFactorStartError":
      "Impossible de démarrer la double authentification.",
    "settings.twoFactorScanInstructions":
      "Scanne le QR code avec ton application d'authentification puis saisis le code.",
    "settings.twoFactorBackupKey": "Clé de secours",
    "settings.twoFactorCodeLabel": "Code de vérification (6 chiffres)",
    "settings.twoFactorCodePlaceholder": "123456",
    "settings.twoFactorCodeRequired":
      "Entre le code de vérification à 6 chiffres.",
    "settings.twoFactorChallengeError":
      "Impossible de générer le challenge MFA.",
    "settings.twoFactorInvalidCode":
      "Code invalide. Vérifie le code généré et réessaie.",
    "settings.twoFactorEnabledSuccess":
      "Double authentification activée avec succès.",
    "settings.twoFactorDisablePassword":
      "Confirme avec ton mot de passe actuel",
    "settings.twoFactorDisableConfirm":
      "Désactiver la double authentification ?",
    "settings.twoFactorDisableButton": "Désactiver la 2FA",
    "settings.twoFactorDisableError":
      "Impossible de désactiver la double authentification.",
    "settings.twoFactorDisabledSuccess":
      "Double authentification désactivée.",
    "settings.twoFactorNoActiveFactor": "Aucun facteur MFA actif trouvé.",
    "settings.logout": "Se déconnecter",
    "settings.logoutConfirmation": "Es-tu sûr de vouloir te déconnecter ?",
    "settings.twoFactorConfirmActivation": "Se connecter",

    // Image Dropzone
    "imageDropzone.invalidType":
      "Merci de sélectionner une image (JPG, PNG, GIF, WebP)",
    "imageDropzone.fileTooLarge": "L'image ne doit pas dépasser 5 MB",
    "imageDropzone.uploadError": "Erreur lors de l'upload",
    "imageDropzone.imageLabel": "Image (URL)",
    "imageDropzone.preview": "Aperçu",
    "imageDropzone.uploading": "Upload en cours...",
    "imageDropzone.dragHere": "Glisse une image ici",
    "imageDropzone.orClickToSelect": "ou clique pour sélectionner",
    "imageDropzone.supportedFormats": "JPG, PNG, GIF, WebP (max 5 MB)",

    // Notifications
    "notifications.newMessage": "Nouveau message",
    "notifications.viewMessage": "Voir le message",
    "notifications.newFriendRequest": "Nouvelle demande d'ami",
    "notifications.wantsFriend": "veut être ton ami",
    "notifications.viewRequests": "Voir les demandes",
    "notifications.newDuel": "Nouveau duel",
    "notifications.duelAccepted": "Duel accepté",
    "notifications.victory": "🎉 Victoire",
    "notifications.defeat": "😔 Défaite",
    "notifications.draw": "🤝 Égalité",
    "notifications.challengedYou": "t'a défié sur",
    "notifications.acceptedDuel": "a accepté ton duel sur",
    "notifications.duelFinished": "Duel terminé contre",
    "notifications.on": "sur",
    "notifications.viewDuels": "Voir les duels",
    "notifications.toPlay": "À jouer",
    "notifications.newResults": "Nouveaux résultats",

    "leaderboard.monthlyPoints": "Points mensuels",
    "leaderboard.totalXP": "XP total",
    "leaderboard.you": "VOUS",
    // Landing Page
    "landing.nav.features": "Fonctionnalités",
    "landing.nav.about": "À propos",
    "landing.nav.contact": "Contact",

    "landing.hero.welcome": "Bienvenue sur",
    "landing.hero.subtitle":
      "La plateforme ultime pour apprendre la géographie,",
    "landing.hero.subtitleHighlight": "gratuitement et sans publicité",
    "landing.hero.startAdventure": "Commencer l'aventure",
    "landing.hero.login": "Se connecter",

    "landing.features.free.title": "100% Gratuit",
    "landing.features.free.desc":
      "Aucun abonnement, aucune publicité, aucun pop-up. La géographie doit être accessible à tous.",
    "landing.features.community.title": "Créé par la communauté",
    "landing.features.community.desc":
      "Crée tes propres quiz et partage-les avec la communauté. Tout le monde peut contribuer.",
    "landing.features.progress.title": "Progression & Défis",
    "landing.features.progress.desc":
      "Gagne de l'expérience, débloque des badges et affronte tes amis en duel.",

    "landing.about.title": "Qui sommes-nous ?",
    "landing.about.intro":
      "Nous sommes deux étudiants en informatique qui avons décidé de mêler nos compétences en développement pour l'un et sa passion géographique pour l'autre.",
    "landing.about.mission": "Notre Mission",
    "landing.about.missionText":
      "Nous avons créé ce site car les plateformes actuelles ne permettent pas de faire tout ce que l'on veut sans payer un abonnement. Notre vision est simple : la géographie doit être accessible à tous et GRATUITEMENT.",
    "landing.about.goal": "Objectif Principal",
    "landing.about.goalText":
      "À travers ce site, nous voulons donner la possibilité à n'importe qui de pouvoir apprendre la géographie sans contrainte d'abonnement, de publicité ou autres pop-ups intrusifs.",
    "landing.about.offers": "Ce que nous offrons",
    "landing.about.offer1":
      "Quiz variés : Drapeaux, capitales, cartes, frontières et bien plus",
    "landing.about.offer2":
      "Création de quiz : Crée tes propres quiz et partage-les avec la communauté",
    "landing.about.offer3":
      "Défis multijoueurs : Affronte tes amis en duel ou grimpe dans le classement",
    "landing.about.offer4":
      "Système de progression : Niveaux, XP, badges et titres exclusifs",
    "landing.about.offer5":
      "Fonctionnalités sociales : Chat en temps réel et système d'amis",
    "landing.about.joinTitle": "Rejoins l'aventure",
    "landing.about.joinText":
      "Que tu sois un passionné de géographie ou simplement curieux d'apprendre, TerraCoast t'offre un environnement stimulant pour développer tes connaissances tout en t'amusant.",

    "landing.stats.free": "Gratuit",
    "landing.stats.ads": "Publicités",
    "landing.stats.quizzes": "Quiz disponibles",
    "landing.stats.available": "Disponible",

    "landing.cta.ready": "Prêt à commencer ?",
    "landing.cta.createAccount": "Créer mon compte gratuitement",

    "landing.footer.tagline":
      "Fait avec passion pour rendre la géographie accessible à tous",
    "landing.footer.legal": "Mentions légales",
    "landing.footer.privacy": "Politique de confidentialité",
    "landing.footer.terms": "Conditions d'utilisation",
    "landing.footer.contact": "Contact",
    "landing.footer.social": "Communauté",

    // Banned Page
    "banned.permanentTitle": "Compte Désactivé",
    "banned.temporaryTitle": "Compte Temporairement Suspendu",
    "banned.permanentMessage":
      "Votre compte a été définitivement banni et ne peut plus être utilisé.",
    "banned.timeRemaining": "Votre compte sera réactivé dans :",
    "banned.endDate": "Date de fin :",
    "banned.reason": "Raison :",
    "banned.suspensionReason": "Raison de la suspension :",
    "banned.autoReconnect":
      "Vous pourrez vous reconnecter automatiquement une fois la suspension levée.",
    "banned.signOut": "Se Déconnecter",
    "banned.day": "jour",
    "banned.days": "jours",
    "banned.hour": "heure",
    "banned.hours": "heures",
    "banned.minute": "minute",
    "banned.minutes": "minutes",
    "banned.and": "et",

    // Auth - Login/Register
    "auth.username": "Pseudo",
    "auth.hasAccount": "Déjà un compte ?",
    "auth.emailPlaceholder": "votre@email.com",
    "auth.passwordPlaceholder": "••••••••",
    "auth.usernamePlaceholder": "VotreNom",
    "auth.connectionError": "Erreur de connexion",
    "auth.passwordMismatch": "Les mots de passe ne correspondent pas",
    "auth.registrationError": "Erreur d'inscription",
    "auth.pseudoPlaceholder": "Votre pseudo",
    "auth.passwordMinLength": "Minimum 6 caractères",
    "auth.passwordTooShort":
      "Le mot de passe doit contenir au moins 6 caractères",
    "auth.pseudoTooShort": "Le pseudo doit contenir au moins 3 caractères",
    "auth.emailAlreadyUsed": "Cet email est déjà utilisé",
    "auth.pseudoAlreadyTaken": "Ce pseudo est déjà pris",
    "auth.acceptTerms": "J'accepte les conditions d'utilisation",
    "auth.acceptPrivacy": "J'accepte la politique de confidentialité",
    "auth.mustAcceptTerms": "Vous devez accepter les conditions d'utilisation et la politique de confidentialité",
    "auth.readTerms": "Lire les conditions d'utilisation",
    "auth.readPrivacy": "Lire la politique de confidentialité",
    // Legal (pages CGU / confidentialité)
    "legal.title.terms": "Conditions d'utilisation",
    "legal.title.privacy": "Politique de confidentialité",
    "legal.terms.acceptance": "Acceptation des conditions",
    "legal.terms.acceptanceText":
      "En utilisant TerraCoast, vous acceptez les présentes conditions d'utilisation.",
    "legal.terms.useOfService": "Utilisation du service",
    "legal.terms.useOfServiceText":
      "TerraCoast est une plateforme gratuite d'apprentissage de la géographie. Vous vous engagez à utiliser le service de manière responsable.",
    "legal.terms.userContent": "Contenu utilisateur",
    "legal.terms.userContentText":
      "En créant des quiz, vous accordez à TerraCoast le droit de les diffuser sur la plateforme. Vous restez propriétaire de votre contenu.",
    "legal.terms.behavior": "Comportement",
    "legal.terms.behaviorText":
      "Tout comportement inapproprié (spam, harcèlement, contenu illégal) entraînera la suspension ou la suppression de votre compte.",
    "legal.terms.lastUpdated": "Dernière mise à jour : 17 novembre 2025",
    "legal.terms.fullText": `Bienvenue sur TerraCoast, un site de quiz consacré à la géographie. L’accès et l’utilisation du site impliquent l’acceptation pleine et entière des présentes Conditions d’utilisation. Si vous n’acceptez pas ces conditions, vous êtes invité à ne pas utiliser le service.

1. Objet du service
TerraCoast permet aux utilisateurs de :
- Créer un compte pour accéder aux quiz de géographie.
- Participer à des classements et obtenir des scores.
- Utiliser un système de chat privé pour échanger avec d’autres utilisateurs.

2. Création de compte et données collectées
Lors de l’inscription, les données suivantes sont collectées :
- Pseudo
- Adresse email
- Mot de passe
Les utilisateurs s’engagent à fournir des informations exactes et à les mettre à jour en cas de modification.

3. Protection et stockage des données
- Les données personnelles sont hébergées exclusivement en Europe.
- Les informations de connexion sont sécurisées et les mots de passe chiffrés.
- Les messages échangés via le chat sont privés et chiffrés de manière à ne pas être lisibles par des tiers.
Aucune donnée ne sera vendue ou transmise à des tiers sans consentement, sauf obligation légale.

4. Utilisation du site et comportement des utilisateurs
L’utilisateur s’engage à :
- Ne pas tenter d’accéder aux comptes d’autres utilisateurs.
- Ne pas diffuser de contenu insultant, discriminatoire, violent, illégal ou inapproprié.
- Respecter les autres membres et l’esprit éducatif du site.
Le non-respect de ces règles peut entraîner la suspension ou la suppression définitive du compte.

5. Responsabilités
- TerraCoast met tout en oeuvre pour assurer un service stable et sécurisé, mais ne peut garantir une disponibilité permanente du site.
- TerraCoast n’est pas responsable des pertes de données, des problèmes liés au réseau ou des comportements des utilisateurs dans le chat.

6. Propriété intellectuelle
Les contenus du site (textes, visuels, quiz, logo, nom TerraCoast, etc.) sont protégés par le droit de la propriété intellectuelle. Toute reproduction, représentation ou diffusion, sans autorisation, est interdite.

7. Suppression du compte et droit à l’effacement
Les utilisateurs peuvent demander la suppression de leur compte et de leurs données à tout moment via l’adresse suivante :
helpdesk@terracoast.ch

8. Modification des conditions
TerraCoast se réserve le droit de modifier les présentes Conditions d’utilisation à tout moment. Les utilisateurs seront informés en cas de changement majeur.

9. Contact
Pour toute question concernant l’utilisation du service ou les données personnelles :
helpdesk@terracoast.ch`,
    "legal.privacy.dataCollection": "Collecte des données",
    "legal.privacy.dataCollectionText":
      "TerraCoast collecte uniquement les données nécessaires au fonctionnement du service : adresse email, pseudo, et statistiques de jeu.",
    "legal.privacy.dataUse": "Utilisation des données",
    "legal.privacy.dataUseText":
      "Vos données sont utilisées uniquement pour améliorer votre expérience sur la plateforme. Nous ne vendons ni ne partageons vos données avec des tiers.",
    "legal.privacy.cookies": "Cookies",
    "legal.privacy.cookiesText":
      "Le site utilise des cookies essentiels pour assurer son bon fonctionnement et votre authentification.",
    "legal.privacy.rights": "Vos droits",
    "legal.privacy.rightsText":
      "Vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles.",
    "legal.privacy.lastUpdated": "Date de mise à jour : 15 novembre 2025",
    "legal.privacy.fullText": `La présente Politique de Confidentialité vise à informer les utilisateurs du site TerraCoast (ci-après « le Site ») sur la manière dont leurs données personnelles sont collectées, utilisées, protégées et, le cas échéant, partagées.

TerraCoast accorde une grande importance au respect de la vie privée et s’engage à prendre toutes les mesures nécessaires afin de garantir la protection des données personnelles des utilisateurs.

1. Données collectées
Lors de l’inscription et de l’utilisation du Site, TerraCoast collecte uniquement les données nécessaires au bon fonctionnement de la plateforme :
- Pseudo : identification dans le jeu et sur le chat (obligatoire)
- Adresse e-mail : gestion du compte et récupération du mot de passe (obligatoire)
- Mot de passe : accès sécurisé au compte (obligatoire)
- Messages du chat : communication privée entre utilisateurs (facultatif)
Aucune donnée sensible n’est collectée.

2. Utilisation des données
Les données collectées sont utilisées pour :
- La création, la gestion et la sécurisation du compte utilisateur
- L’accès aux quiz et aux fonctionnalités du Site
- L’utilisation du chat privé entre utilisateurs
- Le contact des utilisateurs en cas de nécessité (assistance, notifications, sécurité)
Aucune donnée n’est vendue, louée ou partagée à des fins commerciales.

3. Localisation et conformité du stockage des données
L’ensemble des données collectées est hébergé et traité en Europe, dans des pays suivant les conventions de l’Union européenne en matière de protection des données et offrant un niveau de protection adéquat.

4. Sécurité des données
TerraCoast met en place des mesures techniques et organisationnelles destinées à protéger les données contre :
- L’accès non autorisé
- La perte ou la destruction accidentelle
- La modification ou la divulgation illicite
Les discussions du chat sont chiffrées et strictement privées.
Les mots de passe sont stockés de manière chiffrée et jamais conservés en clair.

5. Durée de conservation
- Les données sont conservées tant que le compte est actif.
- En cas de suppression du compte, l’ensemble des données est effacé dans un délai maximum de 30 jours.

6. Droits des utilisateurs
Selon la législation applicable, chaque utilisateur dispose des droits suivants :
- Accès
- Rectification
- Effacement
- Limitation du traitement
- Opposition
- Portabilité des données
Toute demande peut être envoyée à : helpdesk@terracoast.ch
Une réponse sera fournie sous 30 jours maximum.

7. Cookies
TerraCoast utilise uniquement des cookies techniques nécessaires au fonctionnement du Site (connexion, maintien de session).
Aucun cookie publicitaire ou de tracking externe n’est utilisé.

8. Modification de la Politique de Confidentialité
TerraCoast se réserve le droit de modifier la présente Politique de Confidentialité à tout moment.
En cas de changement important, les utilisateurs seront informés par notification ou e-mail.

9. Contact
Pour toute question relative à la protection des données personnelles :
helpdesk@terracoast.ch`,
    // Force Username Change
    "forceUsername.title": "Changement de Pseudo Requis",
    "forceUsername.subtitle":
      "Vous devez choisir un nouveau pseudo pour continuer",
    "forceUsername.flaggedTitle": "Votre pseudo actuel a été signalé",
    "forceUsername.flaggedDesc":
      "Un administrateur vous demande de choisir un nouveau pseudo approprié.",
    "forceUsername.currentPseudo": "Pseudo Actuel",
    "forceUsername.newPseudo": "Nouveau Pseudo",
    "forceUsername.placeholder": "Entrez votre nouveau pseudo",
    "forceUsername.rules":
      "3-20 caractères, lettres, chiffres, underscores et espaces uniquement",
    "forceUsername.confirm": "Confirmer le Nouveau Pseudo",
    "forceUsername.updating": "Mise à jour...",
    "forceUsername.notice":
      "Vous ne pourrez pas accéder à l'application tant que vous n'aurez pas choisi un nouveau pseudo approprié.",
    "forceUsername.errorEmpty": "Veuillez entrer un nouveau pseudo",
    "forceUsername.errorLength":
      "Le pseudo doit contenir entre 3 et 20 caractères",
    "forceUsername.errorInvalid":
      "Le pseudo ne peut contenir que des lettres, chiffres, underscores et espaces",
    "forceUsername.errorTaken": "Ce pseudo est déjà pris",
    "forceUsername.errorUpdate": "Erreur lors de la mise à jour du pseudo",
    "forceUsername.errorGeneric": "Une erreur est survenue",
  },

  en: {
    "app.title": "TerraCoast",
    "nav.home": "Home",
    "nav.quizzes": "Quizzes",
    "nav.leaderboard": "Leaderboard",
    "nav.friends": "Friends",
    "nav.duels": "Duels",
    "nav.chat": "Chat",
    "nav.profile": "Profile",
    "nav.settings": "Settings",
    "nav.admin": "Admin",
    "nav.logout": "Logout",
    "auth.login": "Login",
    "auth.register": "Sign Up",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.pseudo": "Username",
    "auth.confirmPassword": "Confirm Password",
    "auth.alreadyAccount": "Already have an account?",
    "auth.noAccount": "Don't have an account?",
    "auth.signIn": "Sign In",
    "auth.signUp": "Sign Up",
    "auth.acceptTerms": "I accept the terms of use",
    "auth.acceptPrivacy": "I accept the privacy policy",
    "auth.mustAcceptTerms":
      "You must accept the terms of use and the privacy policy",
    "auth.readTerms": "Read the terms of use",
    "auth.readPrivacy": "Read the privacy policy",
    "legal.title.terms": "Terms of Use",
    "legal.title.privacy": "Privacy Policy",
    "legal.terms.acceptance": "Acceptance of terms",
    "legal.terms.acceptanceText":
      "By using TerraCoast, you accept these terms of use.",
    "legal.terms.useOfService": "Use of the service",
    "legal.terms.useOfServiceText":
      "TerraCoast is a free geography learning platform. You agree to use the service responsibly.",
    "legal.terms.userContent": "User content",
    "legal.terms.userContentText":
      "By creating quizzes, you grant TerraCoast the right to publish them on the platform. You remain the owner of your content.",
    "legal.terms.behavior": "Behavior",
    "legal.terms.behaviorText":
      "Any inappropriate behavior (spam, harassment, illegal content) will result in suspension or deletion of your account.",
    "legal.terms.lastUpdated": "Last updated: November 17, 2025",
    "legal.terms.fullText": `Welcome to TerraCoast, a quiz website dedicated to geography. Accessing and using the site implies full acceptance of these Terms of Use. If you do not accept these terms, you are invited not to use the service.

1. Purpose of the service
TerraCoast allows users to:
- Create an account to access geography quizzes.
- Participate in leaderboards and obtain scores.
- Use a private chat system to communicate with other users.

2. Account creation and collected data
During registration, the following data is collected:
- Username
- Email address
- Password
Users agree to provide accurate information and update it in case of changes.

3. Data protection and storage
- Personal data is hosted exclusively in Europe.
- Login information is secured and passwords are encrypted.
- Messages exchanged through chat are private and encrypted so they cannot be read by third parties.
No data will be sold or transmitted to third parties without consent, except where required by law.

4. Site usage and user behavior
Users agree to:
- Not attempt to access other users' accounts.
- Not publish insulting, discriminatory, violent, illegal or inappropriate content.
- Respect other members and the educational spirit of the site.
Failure to comply with these rules may result in suspension or permanent deletion of the account.

5. Responsibilities
- TerraCoast makes every effort to ensure a stable and secure service, but cannot guarantee permanent availability of the site.
- TerraCoast is not responsible for data loss, network-related issues, or user behavior in chat.

6. Intellectual property
Site content (texts, visuals, quizzes, logo, TerraCoast name, etc.) is protected by intellectual property law. Any reproduction, representation or distribution without authorization is prohibited.

7. Account deletion and right to erasure
Users may request deletion of their account and data at any time via:
helpdesk@terracoast.ch

8. Modification of terms
TerraCoast reserves the right to modify these Terms of Use at any time. Users will be informed in the event of major changes.

9. Contact
For any questions regarding service use or personal data:
helpdesk@terracoast.ch`,
    "legal.privacy.dataCollection": "Data collection",
    "legal.privacy.dataCollectionText":
      "TerraCoast only collects data necessary for the service: email, username, and game statistics.",
    "legal.privacy.dataUse": "Use of data",
    "legal.privacy.dataUseText":
      "Your data is used only to improve your experience. We do not sell or share your data with third parties.",
    "legal.privacy.cookies": "Cookies",
    "legal.privacy.cookiesText":
      "The site uses essential cookies for operation and authentication.",
    "legal.privacy.rights": "Your rights",
    "legal.privacy.rightsText":
      "You have the right to access, rectify and delete your personal data.",
    "legal.privacy.lastUpdated": "Last updated: November 15, 2025",
    "legal.privacy.fullText": `This Privacy Policy informs users of the TerraCoast website (the “Site”) about how their personal data is collected, used, protected and, where applicable, shared.

TerraCoast places great importance on privacy and is committed to taking all necessary measures to ensure the protection of users' personal data.

1. Data collected
When registering and using the Site, TerraCoast only collects data required for proper platform operation:
- Username: identification in the game and chat (required)
- Email address: account management and password recovery (required)
- Password: secure account access (required)
- Chat messages: private communication between users (optional)
No sensitive data is collected.

2. Use of data
Collected data is used for:
- Creating, managing and securing user accounts
- Accessing quizzes and Site features
- Using private chat between users
- Contacting users when necessary (support, notifications, security)
No data is sold, rented or shared for commercial purposes.

3. Data storage location and compliance
All collected data is hosted and processed in Europe, in countries that follow European Union data protection conventions and provide an adequate level of protection.

4. Data security
TerraCoast implements technical and organizational measures to protect data against:
- Unauthorized access
- Accidental loss or destruction
- Unlawful modification or disclosure
Chat conversations are encrypted and strictly private.
Passwords are stored in encrypted form and are never kept in plain text.

5. Retention period
- Data is kept as long as the account is active.
- If an account is deleted, all data is erased within a maximum of 30 days.

6. User rights
Under applicable law, each user has the following rights:
- Access
- Rectification
- Erasure
- Restriction of processing
- Objection
- Data portability
Requests can be sent to: helpdesk@terracoast.ch
A response will be provided within 30 days maximum.

7. Cookies
TerraCoast uses only technical cookies necessary for Site operation (login, session persistence).
No advertising cookies or external tracking cookies are used.

8. Changes to this Privacy Policy
TerraCoast reserves the right to modify this Privacy Policy at any time.
In case of significant changes, users will be informed by notification or email.

9. Contact
For any questions regarding personal data protection:
helpdesk@terracoast.ch`,
    "quiz.create": "Create Quiz",
    "quiz.edit": "Edit",
    "quiz.delete": "Delete",
    "quiz.play": "Play",
    "quiz.share": "Share",
    "quiz.publish": "Publish",
    "quiz.title": "Title",
    "quiz.description": "Description",
    "quiz.category": "Category",
    "quiz.difficulty": "Difficulty",
    "quiz.language": "Language",
    "quiz.questions": "Questions",
    "quiz.submit": "Submit",
    "quiz.next": "Next",
    "quiz.finish": "Finish",
    "quiz.replay": "Replay",
    "quiz.explore": "Explore other quizzes",
    "quiz.myQuizzes": "My Quizzes",
    "quiz.publicQuizzes": "Public Quizzes",
    "quiz.sharedQuizzes": "Shared Quizzes",
    "quiz.noQuizzes": "No quizzes available",
    "quiz.backToList": "Back to list",
    "settings.language": "Language",
    "settings.showAllLanguages": "Show all quizzes (all languages)",
    "settings.showOnlyMyLanguage": "Show only quizzes in my language",
    "settings.accountSettings": "Account Settings",
    "settings.backToProfile": "Back to Profile",

    "common.save": "Save",
    "common.cancel": "Cancel",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.success": "Success",
    "common.back": "Back",
    "common.close": "Close",
    "common.confirm": "Confirm",
    "common.all": "All",
    "common.search": "Search",
    "profile.level": "Level",
    "profile.xp": "XP",
    "profile.badges": "Badges",
    "profile.statistics": "Statistics",
    "leaderboard.monthly": "Monthly Leaderboard",
    "leaderboard.rank": "Rank",
    "friends.addFriend": "Add Friend",
    "friends.pending": "Pending",
    "friends.myFriends": "My Friends",
    "chat.noMessages": "No messages",
    "chat.typeMessage": "Type your message...",
    "chat.send": "Send",
    "home.welcome": "Welcome",
    "home.readyToTest": "Ready to test your geography knowledge?",
    "home.accountBanned": "Account Banned",
    "home.temporaryBanUntil": "Your account is temporarily banned until",
    "home.permanentBan": "Your account is permanently banned",
    "home.reason": "Reason",
    "home.notSpecified": "Not specified",
    "home.warningsReceived": "Warnings Received",
    "home.warning": "Warning",
    "home.note": "Note",
    "home.respectRules":
      "Please respect community rules to avoid further sanctions",
    "home.gamesPlayed": "Games Played",
    "home.totalSessions": "Total sessions",
    "home.currentStreak": "Current Streak",
    "home.record": "Record",
    "home.dailyPoints": "Daily Points",
    "home.pts": "pts",
    "home.quickActions": "Quick Actions",
    "home.exploreQuizzes": "Explore Quizzes",
    "home.discoverNewChallenges": "Discover new challenges",
    "home.shareKnowledge": "Share your knowledge",
    "home.trainingMode": "Training Mode",
    "home.noTimeLimit": "No time limit",
    "home.challengeFriend": "Challenge a Friend",
    "home.realTimeDuel": "Real-time duel",
    "home.trendingQuizzes": "Trending Quizzes",
    "home.newAndPopular": "New & Popular",
    "home.new": "NEW",
    "home.games": "games",
    "home.thisWeek": "this week",
    "home.easy": "Easy",
    "home.medium": "Medium",
    "home.hard": "Hard",
    "common.day": "day",
    "common.days": "days",
    "quizzes.title": "Geography Quizzes",
    "quizzes.subtitle": "Explore and play quizzes created by the community",
    "quizzes.searchPlaceholder": "Search for a quiz...",
    "quizzes.allCategories": "All categories",
    "quizzes.allDifficulties": "All difficulties",
    "quizzes.allTypes": "All types",
    "quizzes.category.flags": "Flags",
    "quizzes.category.capitals": "Capitals",
    "quizzes.category.maps": "Maps",
    "quizzes.category.borders": "Borders",
    "quizzes.category.regions": "Regions",
    "quizzes.category.mixed": "Mixed",
    "quizzes.difficulty.easy": "Easy",
    "quizzes.difficulty.medium": "Medium",
    "quizzes.difficulty.hard": "Hard",
    "quizzes.global": "Global",
    "quizzes.games": "games",
    "quizzes.average": "Avg",
    "quizzes.trainingMode": "Training mode",
    "quizzes.shareWithFriends": "Share with friends",
    "quizzes.publishDirectly": "Publish directly",
    "quizzes.requestPublish": "Request publication",
    "quizzes.removeFromList": "Remove from my list",
    "quizzes.noQuizFound": "No quiz found",
    "quizzes.noQuizCreated": "You haven't created any quiz yet",
    "quizzes.noQuizShared": "No quiz shared with you",
    "quizzes.tryDifferentFilters": "Try changing your filters",
    "quizzes.confirmPublishRequest": 'Request publication of "{title}"?',
    "quizzes.publishRequestError": "Error during request",
    "quizzes.publishRequestSuccess":
      "Request sent! An admin will validate your quiz.",
    "quizzes.publishError": "Error during publication",
    "quizzes.publishSuccess": "Quiz published successfully!",
    "quizzes.confirmRemoveShared":
      "Do you want to remove this quiz from your shared list?",
    "quizzes.removeSuccess": "Quiz successfully removed from your list!",
    "quizzes.removeError": "Error during deletion",
    "quizzes.confirmDelete":
      "Are you sure you want to delete the quiz '{title}'? This action is irreversible.",
    "quizzes.deleteSuccess": "Quiz successfully deleted!",
    "quizzes.deleteError": "Error deleting quiz",
    "quizzes.deleteQuestionsError": "Error deleting questions",
    "quizzes.deleteQuiz": "Delete quiz",
    "leaderboard.title": "Leaderboard",
    "leaderboard.subtitle": "The best TerraCoast players",
    "leaderboard.global": "Global Ranking",
    "leaderboard.friends": "Among Friends",
    "leaderboard.thisMonth": "This Month",
    "leaderboard.allTime": "All Time",
    "leaderboard.monthlyReset":
      "Scores reset every month. Top 10 receive a title!",
    "leaderboard.loading": "Loading leaderboard...",
    "leaderboard.noPlayers": "No players",
    "leaderboard.emptyLeaderboard": "The leaderboard is empty for now",
    "leaderboard.game": "game",
    "leaderboard.games": "games",
    "leaderboard.thisMonthShort": "this month",
    "leaderboard.top10": "Top 10",
    "leaderboard.totalPoints": "total points",
    "friends.title": "Friends",
    "friends.subtitle": "Manage your friends and chat together",
    "friends.pendingRequests": "Pending Requests",
    "friends.accept": "Accept",
    "friends.reject": "Reject",
    "friends.suggestions": "Friend Suggestions",
    "friends.add": "Add",
    "friends.searchTitle": "Search Friends",
    "friends.searchPlaceholder": "Search by username...",
    "friends.myFriendsTitle": "My Friends",
    "friends.noFriends": "You don't have any friends yet",
    "friends.sendMessage": "Send message",
    "friends.removeFriend": "Remove from friends",
    "friends.requestSent": "Request sent!",
    "friends.confirmRemove":
      "Do you really want to remove {name} from your friends?",
    "duels.title": "Duels",
    "duels.subtitle": "Challenge your friends in real-time",
    "duels.createDuel": "Create a Duel",
    "duels.activeDuels": "Active Duels",
    "duels.invitations": "Invitations",
    "duels.history": "History",
    "duels.noActiveDuels": "No active duels",
    "duels.createOrAccept": "Create a duel or accept an invitation",
    "duels.vs": "vs",
    "duels.youPlayed": "You played",
    "duels.waiting": "Waiting",
    "duels.hasPlayed": "has played",
    "duels.hasNotPlayed": "has not played",
    "duels.alreadyPlayed": "Already played",
    "duels.receivedInvitations": "Received Invitations",
    "duels.challengesYou": "challenges you!",
    "duels.sentInvitations": "Sent Invitations",
    "duels.viewResults": "View Results",
    "duels.invitationTo": "Invitation to",
    "duels.noInvitations": "No invitations",
    "duels.createToChallenge": "Create a duel to challenge your friends",
    "duels.noCompletedDuels": "No completed duels",
    "duels.historyAppears": "Your duel history will appear here",
    "duels.victory": "Victory",
    "duels.defeat": "Defeat",
    "duels.draw": "Draw",
    "duels.inProgress": "In Progress",
    "duels.winner": "Winner",
    "duels.you": "You",
    "duels.opponent": "Opponent",
    "duels.score": "Score",
    "duels.accuracy": "Accuracy",
    "duels.rate": "Rate",
    "duels.gap": "Gap",
    "duels.yourScore": "Your score",
    "duels.chooseFriend": "Choose a friend",
    "duels.selectFriend": "Select a friend",
    "duels.chooseQuiz": "Choose a quiz",
    "duels.selectQuiz": "Select a quiz",
    "duels.sending": "Sending...",
    "chat.backToQuizzes": "Back to quizzes",
    "chat.messages": "Messages",
    "chat.noFriends": "No friends",
    "chat.user": "User",
    "chat.deletedUser": "Deleted user",
    "chat.selectFriend": "Select a friend to start chatting",
    "training.title": "Training Mode",
    "training.subtitle": "Practice without time limit and without earning XP",
    "training.features": "Training mode features",
    "training.feature1": "No time limit - take your time to think",
    "training.feature2": "No XP gain - just for practice",
    "training.feature3": "Choose the number of questions",
    "training.feature4": "Immediate validation with explanations",
    "training.step1": "1. Choose a quiz",
    "training.step2": "2. Number of questions",
    "training.searchQuiz": "Search for a quiz...",
    "training.games": "games",
    "training.questions": "questions",
    "training.max": "max",
    "training.start": "Start training",
    "share.title": "Share Quiz",
    "share.success": "Quiz shared!",
    "share.successMessage": "Your friends can now access it",
    "share.shareWith": 'Share "{title}" with your friends',
    "share.sharing": "Sharing...",
    "profile.friendRequestError": "Error sending friend request",
    "profile.friendRequestSent": "Friend request sent!",
    "profile.reportError": "Error sending report",
    "profile.reportSuccess": "Report sent successfully",
    "profile.addFriend": "Add friend",
    "profile.requestSent": "Request sent",
    "profile.friend": "Friend",
    "profile.history": "History",
    "profile.report": "Report",
    "profile.gamesPlayed": "Games played",
    "profile.successRate": "Success rate",
    "profile.titles": "Titles",
    "profile.active": "Active",
    "profile.noTitles": "No titles earned",
    "profile.last7Days": "Points from last 7 days",
    "profile.total": "Total",
    "profile.noGamesThisWeek": "No games played this week",
    "profile.noBadges": "No badges earned",
    "profile.recentGames": "Recent games",
    "profile.score": "Score",
    "profile.accuracy": "Accuracy",
    "profile.noGames": "No games played",
    "profile.reportUser": "Report {user}",
    "profile.reportDescription":
      "Describe the reason for your report. An administrator will review your request.",
    "profile.reportReason": "Report reason...",
    "profile.sending": "Sending...",
    "profile.warningHistory": "Warning history",
    "profile.noWarnings": "No warnings found",
    "profile.reportedBy": "Reported by",
    "profile.unknown": "Unknown",
    "profile.adminNotes": "Admin notes",
    "profile.tempBanUntil": "Temporary ban until",
    "settings.pseudoRequired": "Username cannot be empty",
    "settings.pseudoUpdateError": "Error updating username",
    "settings.pseudoUpdateSuccess": "Username updated successfully",
    "settings.emailPasswordRequired": "Email and current password required",
    "settings.incorrectPassword": "Incorrect password",
    "settings.emailUpdateError": "Error updating email",
    "settings.emailConfirmationSent":
      "A confirmation email has been sent to your new address",
    "settings.supabaseChangeRequiresEmailConfirmation":
      "For some sensitive changes (email, security), Supabase sends a confirmation email.",
    "settings.allFieldsRequired": "All fields are required",
    "settings.passwordsMismatch": "Passwords do not match",
    "settings.passwordTooShort": "Password must be at least 6 characters",
    "settings.currentPasswordIncorrect": "Current password incorrect",
    "settings.passwordUpdateError": "Error updating password",
    "settings.passwordUpdateSuccess": "Password updated successfully",
    "settings.deleteConfirmation":
      'This action is irreversible. Type "DELETE" to confirm:',
    "settings.deleteKeyword": "DELETE",
    "settings.deleteAccountError": "Error deleting account",
    "settings.manageInfo": "Manage your personal information",
    "settings.languagePreferences": "Language and preferences",
    "settings.interfaceLanguage": "Interface language",
    "settings.showAllLanguagesDescription":
      "Show all quizzes in all languages (otherwise, only quizzes in my language)",
    "settings.username": "Username",
    "settings.newUsername": "New username",
    "settings.yourUsername": "Your username",
    "settings.updateUsername": "Update username",
    "settings.emailAddress": "Email address",
    "settings.newEmail": "New email address",
    "settings.newEmailPlaceholder": "new@email.com",
    "settings.currentPassword": "Current password",
    "settings.updateEmail": "Update email",
    "settings.password": "Password",
    "settings.newPassword": "New password",
    "settings.confirmNewPassword": "Confirm new password",
    "settings.updatePassword": "Update password",
    "settings.dangerZone": "Danger zone",
    "settings.deleteWarning":
      "Deleting your account is irreversible. All your data will be lost.",
    "settings.deleteAccount": "Delete my account",
    "settings.currentPasswordRequired": "Current password is required",
    "settings.twoFactorTitle": "Two-factor authentication (2FA)",
    "settings.twoFactorStatus": "Status",
    "settings.twoFactorEnabled": "Enabled",
    "settings.twoFactorDisabled": "Disabled",
    "settings.twoFactorStart": "Enable 2FA",
    "settings.twoFactorStartError": "Unable to start two-factor authentication.",
    "settings.twoFactorScanInstructions":
      "Scan the QR code with your authenticator app, then enter the code.",
    "settings.twoFactorBackupKey": "Backup key",
    "settings.twoFactorCodeLabel": "Verification code (6 digits)",
    "settings.twoFactorCodePlaceholder": "123456",
    "settings.twoFactorCodeRequired":
      "Enter the 6-digit verification code.",
    "settings.twoFactorChallengeError": "Unable to create MFA challenge.",
    "settings.twoFactorInvalidCode":
      "Invalid code. Check your app and try again.",
    "settings.twoFactorEnabledSuccess":
      "Two-factor authentication enabled successfully.",
    "settings.twoFactorDisablePassword":
      "Confirm with your current password",
    "settings.twoFactorDisableConfirm": "Disable two-factor authentication?",
    "settings.twoFactorDisableButton": "Disable 2FA",
    "settings.twoFactorDisableError":
      "Unable to disable two-factor authentication.",
    "settings.twoFactorDisabledSuccess":
      "Two-factor authentication disabled.",
    "settings.twoFactorNoActiveFactor": "No active MFA factor found.",
    "imageDropzone.invalidType": "Please select an image (JPG, PNG, GIF, WebP)",
    "imageDropzone.fileTooLarge": "Image must not exceed 5 MB",
    "imageDropzone.uploadError": "Upload error",
    "imageDropzone.imageLabel": "Image (URL)",
    "imageDropzone.preview": "Preview",
    "imageDropzone.uploading": "Uploading...",
    "imageDropzone.dragHere": "Drag an image here",
    "imageDropzone.orClickToSelect": "or click to select",
    "imageDropzone.supportedFormats": "JPG, PNG, GIF, WebP (max 5 MB)",
    "editQuiz.confirmDeleteQuestion":
      "Do you really want to delete this question?",
    "editQuiz.titleRequired": "Title cannot be empty",
    "editQuiz.atLeastOneQuestion": "Add at least one question",
    "editQuiz.updateSuccess": "Quiz updated successfully!",
    "editQuiz.updateError": "Error updating quiz",
    "editQuiz.loadingQuiz": "Loading quiz...",
    "editQuiz.backToQuizzes": "Back to quizzes",
    "editQuiz.title": "Edit Quiz",
    "editQuiz.subtitle": "Edit your geography quiz",
    "editQuiz.quizInfo": "Quiz Information",
    "editQuiz.quizTitle": "Quiz Title",
    "editQuiz.titlePlaceholder": "E.g: European Capitals",
    "editQuiz.description": "Description",
    "editQuiz.descriptionPlaceholder": "Describe your quiz...",
    "editQuiz.coverImage": "Cover Image",
    "editQuiz.language": "Language",
    "editQuiz.category": "Category",
    "editQuiz.difficulty": "Difficulty",
    "editQuiz.timePerQuestion": "Time per question (sec)",
    "editQuiz.questions": "Questions",
    "editQuiz.addQuestion": "Add Question",
    "editQuiz.question": "Question",
    "editQuiz.questionImageOptional": "Question image (optional)",
    "editQuiz.questionType.label": "Question Type",
    "editQuiz.questionType.mcq": "Multiple Choice",
    "editQuiz.questionType.single_answer": "Single Answer",
    "editQuiz.questionType.text_free": "Free Text",
    "editQuiz.questionType.map_click": "Map Click",
    "editQuiz.questionType.true_false": "True/False",
    "editQuiz.points": "Points",
    "editQuiz.options": "Options",
    "editQuiz.option": "Option",
    "editQuiz.imageForOption": 'Image for "{option}" (optional)',
    "editQuiz.correctAnswer": "Correct Answer",
    "editQuiz.select": "Select",
    "editQuiz.imageIncluded": "Image included",
    "editQuiz.saving": "Saving...",
    "editQuiz.saveChanges": "Save Changes",
    "editQuiz.deleteQuestionSuccess": "Question deleted successfully!",
    "editQuiz.deleteQuestionError": "Error deleting question",
    "createQuiz.title": "Create Quiz",
    "createQuiz.subtitle": "Create your own geography quiz",
    "createQuiz.quizType": "Quiz Type",
    "createQuiz.noType": "No type",
    "createQuiz.randomizeQuestions": "Shuffle question order",
    "createQuiz.randomizeAnswers": "Shuffle answer order (Multiple Choice)",
    "createQuiz.publicQuizAdmin":
      "Public quiz - As admin, this will be a globally approved quiz immediately",
    "createQuiz.submitValidation":
      "Submit for validation ({count}/10 quizzes published)",
    "createQuiz.addQuestion": "Add Question",
    "createQuiz.questionPlaceholder": "E.g: What is the capital of France?",
    "createQuiz.questionImageDesc": "Add an image to illustrate your question",
    "createQuiz.trueFalse.type": "True / False",
    "createQuiz.trueFalse.description":
      "For True/False questions, options are automatically set. Simply select the correct answer below.",
    "createQuiz.trueFalse.true": "True",
    "createQuiz.trueFalse.false": "False",
    "createQuiz.optionsMinTwo": "Options (2 minimum)",
    "createQuiz.optionImageDesc":
      "Add images for each option (e.g: flags). Perfect for visual quizzes!",
    "createQuiz.multipleCorrect":
      "Select one or more correct answers (e.g: Capitals of South Africa)",
    "createQuiz.answerPlaceholder": "E.g: Paris",
    "createQuiz.variants": "Accepted variants (optional)",
    "createQuiz.variantPlaceholder": "Variant {number} (e.g: paris, PARIS)",
    "createQuiz.addVariant": "Add variant",
    "createQuiz.variantsDesc":
      'Add multiple accepted variants (e.g: "Paris", "paris", "The capital of France")',
    "createQuiz.editingQuestion": "Editing question #{number}",
    "createQuiz.updateQuestion": "Update",
    "createQuiz.addThisQuestion": "Add this question",
    "createQuiz.questionsAdded": "Questions added",
    "createQuiz.answer": "Answer",
    "createQuiz.saveQuiz": "Save quiz",
    "createQuiz.success": "Quiz created successfully!",
    "createQuiz.errors.questionEmpty": "Question cannot be empty",
    "createQuiz.errors.answerEmpty": "Correct answer cannot be empty",
    "createQuiz.errors.minTwoOptions":
      "At least 2 options required for multiple choice",
    "createQuiz.errors.answerMustBeOption":
      "Correct answer must be one of the options",
    "createQuiz.errors.maxQuizReached":
      "You have reached the limit of 10 public quizzes",
    "createQuiz.errors.createError": "Error creating quiz",
    "playQuiz.selectAnswer": "Please select or enter an answer",
    "playQuiz.loadingQuiz": "Loading quiz...",
    "playQuiz.trainingComplete": "Training complete!",
    "playQuiz.quizComplete": "Quiz complete!",
    "playQuiz.trainingMessage": "Good work! Keep practicing",
    "playQuiz.congratsMessage": "Congratulations on completing this quiz",
    "playQuiz.totalScore": "Total Score",
    "playQuiz.xpGained": "XP Gained",
    "playQuiz.accuracy": "Accuracy",
    "playQuiz.correctAnswers": "Correct Answers",
    "playQuiz.summary": "Summary",
    "playQuiz.yourAnswer": "Your answer",
    "playQuiz.noAnswer": "No answer",
    "playQuiz.correctAnswer": "Correct answer",
    "playQuiz.exploreOtherQuizzes": "Explore other quizzes",
    "playQuiz.playAgain": "Play Again",
    "playQuiz.confirmQuit":
      "Are you sure you want to quit? Your progress will be lost.",
    "playQuiz.quit": "Quit",
    "playQuiz.trainingMode": "Training Mode",
    "playQuiz.question": "Question",
    "playQuiz.questionImage": "Question",
    "playQuiz.enterAnswer": "Enter your answer...",
    "playQuiz.mapClickComing": "Map click feature coming soon",
    "playQuiz.correct": "Correct!",
    "playQuiz.incorrect": "Incorrect",
    "playQuiz.correctAnswerWas": "The correct answer was",
    "playQuiz.validate": "Validate",
    "playQuiz.variants": "Variants",
    "playQuiz.acceptedVariants": "Accepted variants",
    "profile.toNextLevel": "to next level",
    "profile.you": "You",
    "profile.yourTotal": "Your total",
    "createQuiz.searchTags": "Search Tags (Europe, Asia...)",
    "createQuiz.addTagPlaceholder": "Add a tag and press Enter...",
    "createQuiz.maxTags": "Maximum 10 tags",
    "notifications.newMessage": "New message",
    "notifications.viewMessage": "View message",
    "notifications.newFriendRequest": "New friend request",
    "notifications.wantsFriend": "wants to be your friend",
    "notifications.viewRequests": "View requests",
    "notifications.newDuel": "New duel",
    "notifications.duelAccepted": "Duel accepted",
    "notifications.victory": "🎉 Victory",
    "notifications.defeat": "😔 Defeat",
    "notifications.draw": "🤝 Draw",
    "notifications.challengedYou": "challenged you on",
    "notifications.acceptedDuel": "accepted your duel on",
    "notifications.duelFinished": "Duel finished against",
    "notifications.on": "on",
    "notifications.viewDuels": "View duels",
    "notifications.toPlay": "To play",
    "notifications.newResults": "New results",
    "nav.social": "Social",
    "profile.daysToBreakRecord": "days to break your streak",
    "profile.keepGoing": "Keep going, you're smashing it!",

    "common.clickForDetails": "Click for more details",
    "createQuiz.complementIfWrongPlaceholder": "Text displayed when the answer is incorrect",
    "createQuiz.complementIfWrong": "Complement if wrong answer (optional)",
    "playQuiz.nextQuestion": "Next question",
    "playQuiz.explanation": "Explanation",
    "playQuiz.finishQuiz": "Finish the quiz",
    "profile.back": "Back",
    "profile.games": "Games",
    "profile.settings": "Settings",
    "profile.accountDetails": "Account details",
    "profile.requestPending": "Request sent",
    "profile.friends": "Friends",
    "profile.warnUser": "Warn user",
    "profile.activateTitle": "Activate",
    "profile.activeTitle": "Active",
    "profile.noGamesYet": "No games played",
    "profile.unknownQuiz": "Unknown quiz",
    "profile.questions": "Questions",
    "profile.time": "Time",
    "profile.completed": "Completed",
    "profile.inProgress": "In progress",
    "profile.progressChart": "Progress chart",
    "profile.myProgress": "My progress",
    "profile.user": "User",
    "profile.clickPointInfo": "Click on a point to see details",
    "profile.streakDetails": "Streak details",
    "profile.streakStartedOn": "Streak started on",
    "profile.currentStreak": "Current streak",
    "profile.longestStreak": "Longest streak",
    "profile.playTodayToKeepStreak": "Play today to keep your streak",
    "profile.dayDetails": "Day details",
    "profile.date": "Date",
    "profile.myScore": "My score",
    "profile.difference": "Difference",
    "profile.warnReason": "Warning reason...",
    "profile.sendWarning": "Send warning",
    "profile.status": "Status",
    "profile.close": "Close",
    "settings.logout": "Log out",
    "settings.logoutConfirmation": "Are you sure you want to log out?",
    "leaderboard.monthlyPoints": "Monthly points",
    "leaderboard.totalXP": "Total XP",
    "leaderboard.you": "YOU",
    "landing.nav.features": "Features",
    "landing.nav.about": "About",
    "landing.nav.contact": "Contact",
    "landing.hero.welcome": "Welcome to",
    "landing.hero.subtitle": "The ultimate platform to learn geography,",
    "landing.hero.subtitleHighlight": "for free and without ads",
    "landing.hero.startAdventure": "Start the adventure",
    "landing.hero.login": "Log in",
    "landing.features.free.title": "100% Free",
    "landing.features.free.desc": "No subscriptions, no ads, no pop-ups. Geography should be accessible to everyone.",
    "landing.features.community.title": "Created by the community",
    "landing.features.community.desc": "Create your own quizzes and share them with the community. Everyone can contribute.",
    "landing.features.progress.title": "Progression & Challenges",
    "landing.features.progress.desc": "Earn experience, unlock badges and challenge your friends to duels.",
    "landing.about.title": "Who are we?",
    "landing.about.intro": "We are two computer science students who decided to combine development skills for one and a passion for geography for the other.",
    "landing.about.mission": "Our Mission",
    "landing.about.missionText": "We created this site because current platforms do not allow you to do everything you want without paying a subscription. Our vision is simple: geography should be accessible to everyone and FOR FREE.",
    "landing.about.goal": "Main Goal",
    "landing.about.goalText": "Through this site, we want to give anyone the opportunity to learn geography without the constraints of subscriptions, ads, or other intrusive pop-ups.",
    "landing.about.offers": "What we offer",
    "landing.about.offer1": "Various quizzes: Flags, capitals, maps, borders and much more",
    "landing.about.offer2": "Quiz creation: Create your own quizzes and share them with the community",
    "landing.about.offer3": "Multiplayer challenges: Duel your friends or climb the leaderboard",
    "landing.about.offer4": "Progression system: Levels, XP, badges and exclusive titles",
    "landing.about.offer5": "Social features: Real-time chat and friends system",
    "landing.about.joinTitle": "Join the adventure",
    "landing.about.joinText": "Whether you are a geography enthusiast or simply curious to learn, TerraCoast offers you a stimulating environment to develop your knowledge while having fun.",
    "landing.stats.free": "Free",
    "landing.stats.ads": "Ads",
    "landing.stats.quizzes": "Available quizzes",
    "landing.stats.available": "Available",
    "landing.cta.ready": "Ready to start?",
    "landing.cta.createAccount": "Create my account for free",
    "landing.footer.tagline": "Made with passion to make geography accessible to everyone",
    "landing.footer.legal": "Legal mentions",
    "landing.footer.privacy": "Privacy Policy",
    "landing.footer.terms": "Terms of Use",
    "landing.footer.contact": "Contact",
    "landing.footer.social": "Community",
    "banned.permanentTitle": "Account Disabled",
    "banned.temporaryTitle": "Account Temporarily Suspended",
    "banned.permanentMessage": "Your account has been permanently banned and can no longer be used.",
    "banned.timeRemaining": "Your account will be reactivated in:",
    "banned.endDate": "End date:",
    "banned.reason": "Reason:",
    "banned.suspensionReason": "Reason for suspension:",
    "banned.autoReconnect": "You will be able to reconnect automatically once the suspension is lifted.",
    "banned.signOut": "Log Out",
    "banned.day": "day",
    "banned.days": "days",
    "banned.hour": "hour",
    "banned.hours": "hours",
    "banned.minute": "minute",
    "banned.minutes": "minutes",
    "banned.and": "and",
    "auth.username": "Username",
    "auth.hasAccount": "Already have an account?",
    "auth.emailPlaceholder": "your@email.com",
    "auth.passwordPlaceholder": "••••••••",
    "auth.usernamePlaceholder": "YourName",
    "auth.connectionError": "Connection error",
    "auth.passwordMismatch": "Passwords do not match",
    "auth.registrationError": "Registration error",
    "auth.pseudoPlaceholder": "Your username",
    "auth.passwordMinLength": "Minimum 6 characters",
    "auth.passwordTooShort": "The password must contain at least 6 characters",
    "auth.pseudoTooShort": "The username must contain at least 3 characters",
    "auth.emailAlreadyUsed": "This email is already in use",
    "auth.pseudoAlreadyTaken": "This username is already taken",
    "forceUsername.title": "Username Change Required",
    "forceUsername.subtitle": "You must choose a new username to continue",
    "forceUsername.flaggedTitle": "Your current username has been flagged",
    "forceUsername.flaggedDesc": "An administrator requires you to choose an appropriate new username.",
    "forceUsername.currentPseudo": "Current Username",
    "forceUsername.newPseudo": "New Username",
    "forceUsername.placeholder": "Enter your new username",
    "forceUsername.rules": "3-20 characters, letters, numbers, underscores and spaces only",
    "forceUsername.confirm": "Confirm New Username",
    "forceUsername.updating": "Updating...",
    "forceUsername.notice": "You will not be able to access the application until you have chosen an appropriate new username.",
    "forceUsername.errorEmpty": "Please enter a new username",
    "forceUsername.errorLength": "The username must be between 3 and 20 characters",
    "forceUsername.errorInvalid": "The username can only contain letters, numbers, underscores and spaces",
    "forceUsername.errorTaken": "This username is already taken",
    "forceUsername.errorUpdate": "Error updating the username",
    "forceUsername.errorGeneric": "An error occurred",
    "settings.twoFactorConfirmActivation": "Login"
  },
  es: {
    "app.title": "TerraCoast",
    "nav.home": "Inicio",
    "nav.quizzes": "Cuestionarios",
    "nav.leaderboard": "Clasificación",
    "nav.friends": "Amigos",
    "nav.duels": "Duelos",
    "nav.chat": "Chat",
    "nav.profile": "Perfil",
    "nav.settings": "Configuración",
    "nav.admin": "Admin",
    "nav.logout": "Cerrar sesión",
    "auth.login": "Iniciar sesión",
    "auth.register": "Registrarse",
    "auth.email": "Correo electrónico",
    "auth.password": "Contraseña",
    "auth.pseudo": "Nombre de usuario",
    "auth.confirmPassword": "Confirmar contraseña",
    "auth.alreadyAccount": "¿Ya tienes una cuenta?",
    "auth.noAccount": "¿No tienes cuenta?",
    "auth.signIn": "Iniciar sesión",
    "auth.signUp": "Registrarse",
    "quiz.create": "Crear cuestionario",
    "quiz.edit": "Editar",
    "quiz.delete": "Eliminar",
    "quiz.play": "Jugar",
    "quiz.share": "Compartir",
    "quiz.publish": "Publicar",
    "quiz.title": "Título",
    "quiz.description": "Descripción",
    "quiz.category": "Categoría",
    "quiz.difficulty": "Dificultad",
    "quiz.language": "Idioma",
    "quiz.questions": "Preguntas",
    "quiz.submit": "Enviar",
    "quiz.next": "Siguiente",
    "quiz.finish": "Finalizar",
    "quiz.replay": "Repetir",
    "quiz.explore": "Explorar otros cuestionarios",
    "quiz.myQuizzes": "Mis cuestionarios",
    "quiz.publicQuizzes": "Cuestionarios públicos",
    "quiz.sharedQuizzes": "Cuestionarios compartidos",
    "quiz.noQuizzes": "No hay cuestionarios disponibles",
    "quiz.backToList": "Volver a la lista",
    "settings.language": "Idioma",
    "settings.showAllLanguages":
      "Mostrar todos los cuestionarios (todos los idiomas)",
    "settings.showOnlyMyLanguage": "Mostrar solo cuestionarios en mi idioma",
    "settings.accountSettings": "Configuración de cuenta",
    "settings.backToProfile": "Volver al perfil",
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.loading": "Cargando...",
    "common.error": "Error",
    "common.success": "Éxito",
    "common.back": "Volver",
    "common.close": "Cerrar",
    "common.confirm": "Confirmar",
    "common.all": "Todos",
    "common.search": "Buscar",
    "profile.level": "Nivel",
    "profile.xp": "XP",
    "profile.badges": "Insignias",
    "profile.statistics": "Estadísticas",
    "leaderboard.monthly": "Clasificación mensual",
    "leaderboard.rank": "Rango",
    "friends.addFriend": "Añadir amigo",
    "friends.pending": "Pendiente",
    "friends.myFriends": "Mis amigos",
    "chat.noMessages": "Sin mensajes",
    "chat.typeMessage": "Escribe tu mensaje...",
    "chat.send": "Enviar",
    "home.welcome": "Bienvenido",
    "home.readyToTest": "¿Listo para probar tus conocimientos de geografía?",
    "home.accountBanned": "Cuenta baneada",
    "home.temporaryBanUntil": "Tu cuenta está temporalmente baneada hasta",
    "home.permanentBan": "Tu cuenta está permanentemente baneada",
    "home.reason": "Razón",
    "home.notSpecified": "No especificado",
    "home.warningsReceived": "Advertencias recibidas",
    "home.warning": "Advertencia",
    "home.note": "Nota",
    "home.respectRules":
      "Por favor respeta las reglas de la comunidad para evitar más sanciones",
    "home.gamesPlayed": "Partidas jugadas",
    "home.totalSessions": "Sesiones totales",
    "home.currentStreak": "Racha actual",
    "home.record": "Récord",
    "home.dailyPoints": "Puntos diarios",
    "home.pts": "pts",
    "home.quickActions": "Acciones rápidas",
    "home.exploreQuizzes": "Explorar cuestionarios",
    "home.discoverNewChallenges": "Descubre nuevos desafíos",
    "home.shareKnowledge": "Comparte tu conocimiento",
    "home.trainingMode": "Modo entrenamiento",
    "home.noTimeLimit": "Sin límite de tiempo",
    "home.challengeFriend": "Desafiar a un amigo",
    "home.realTimeDuel": "Duelo en tiempo real",
    "home.trendingQuizzes": "Cuestionarios populares",
    "home.newAndPopular": "Nuevo y popular",
    "home.new": "NUEVO",
    "home.games": "partidas",
    "home.thisWeek": "esta semana",
    "home.easy": "Fácil",
    "home.medium": "Medio",
    "home.hard": "Difícil",
    "common.day": "día",
    "common.days": "días",
    "quizzes.title": "Cuestionarios de geografía",
    "quizzes.subtitle":
      "Explora y juega cuestionarios creados por la comunidad",
    "quizzes.searchPlaceholder": "Buscar un cuestionario...",
    "quizzes.allCategories": "Todas las categorías",
    "quizzes.allDifficulties": "Todas las dificultades",
    "quizzes.allTypes": "Todos los tipos",
    "quizzes.category.flags": "Banderas",
    "quizzes.category.capitals": "Capitales",
    "quizzes.category.maps": "Mapas",
    "quizzes.category.borders": "Fronteras",
    "quizzes.category.regions": "Regiones",
    "quizzes.category.mixed": "Mixto",
    "quizzes.difficulty.easy": "Fácil",
    "quizzes.difficulty.medium": "Medio",
    "quizzes.difficulty.hard": "Difícil",
    "quizzes.global": "Global",
    "quizzes.games": "partidas",
    "quizzes.average": "Media",
    "quizzes.trainingMode": "Modo entrenamiento",
    "quizzes.shareWithFriends": "Compartir con amigos",
    "quizzes.publishDirectly": "Publicar directamente",
    "quizzes.requestPublish": "Solicitar publicación",
    "quizzes.removeFromList": "Eliminar de mi lista",
    "quizzes.noQuizFound": "No se encontró ningún cuestionario",
    "quizzes.noQuizCreated": "Aún no has creado ningún cuestionario",
    "quizzes.noQuizShared": "No hay cuestionarios compartidos contigo",
    "quizzes.tryDifferentFilters": "Prueba a cambiar tus filtros",
    "quizzes.confirmPublishRequest": '¿Solicitar publicación de "{title}"?',
    "quizzes.publishRequestError": "Error durante la solicitud",
    "quizzes.publishRequestSuccess":
      "¡Solicitud enviada! Un administrador validará tu cuestionario.",
    "quizzes.publishError": "Error durante la publicación",
    "quizzes.publishSuccess": "¡Cuestionario publicado con éxito!",
    "quizzes.confirmRemoveShared":
      "¿Quieres eliminar este cuestionario de tu lista compartida?",
    "quizzes.removeSuccess": "¡Cuestionario eliminado con éxito de tu lista!",
    "quizzes.removeError": "Error durante la eliminación",
    "quizzes.confirmDelete":
      '¿Estás seguro de que deseas eliminar el cuestionario "{title}"? Esta acción es irreversible.',
    "quizzes.deleteSuccess": "¡Cuestionario eliminado con éxito!",
    "quizzes.deleteError": "Error al eliminar el cuestionario",
    "quizzes.deleteQuestionsError": "Error al eliminar las preguntas",
    "quizzes.deleteQuiz": "Eliminar cuestionario",
    "leaderboard.title": "Clasificación",
    "leaderboard.subtitle": "Los mejores jugadores de TerraCoast",
    "leaderboard.global": "Clasificación global",
    "leaderboard.friends": "Entre amigos",
    "leaderboard.thisMonth": "Este mes",
    "leaderboard.allTime": "De todos los tiempos",
    "leaderboard.monthlyReset":
      "Las puntuaciones se reinician cada mes. ¡Los 10 mejores reciben un título!",
    "leaderboard.loading": "Cargando clasificación...",
    "leaderboard.noPlayers": "Sin jugadores",
    "leaderboard.emptyLeaderboard": "La clasificación está vacía por ahora",
    "leaderboard.game": "partida",
    "leaderboard.games": "partidas",
    "leaderboard.thisMonthShort": "este mes",
    "leaderboard.top10": "Top 10",
    "leaderboard.totalPoints": "puntos totales",
    "friends.title": "Amigos",
    "friends.subtitle": "Gestiona tus amigos y chatea juntos",
    "friends.pendingRequests": "Solicitudes pendientes",
    "friends.accept": "Aceptar",
    "friends.reject": "Rechazar",
    "friends.suggestions": "Sugerencias de amigos",
    "friends.add": "Añadir",
    "friends.searchTitle": "Buscar amigos",
    "friends.searchPlaceholder": "Buscar por nombre de usuario...",
    "friends.myFriendsTitle": "Mis amigos",
    "friends.noFriends": "Aún no tienes amigos",
    "friends.sendMessage": "Enviar mensaje",
    "friends.removeFriend": "Eliminar de amigos",
    "friends.requestSent": "¡Solicitud enviada!",
    "friends.confirmRemove":
      "¿Realmente quieres eliminar a {name} de tus amigos?",
    "duels.title": "Duelos",
    "duels.subtitle": "Desafía a tus amigos en tiempo real",
    "duels.createDuel": "Crear un duelo",
    "duels.activeDuels": "Duelos activos",
    "duels.invitations": "Invitaciones",
    "duels.history": "Historial",
    "duels.noActiveDuels": "Sin duelos activos",
    "duels.createOrAccept": "Crea un duelo o acepta una invitación",
    "duels.vs": "vs",
    "duels.youPlayed": "Has jugado",
    "duels.waiting": "En espera",
    "duels.hasPlayed": "ha jugado",
    "duels.hasNotPlayed": "no ha jugado",
    "duels.alreadyPlayed": "Ya jugado",
    "duels.receivedInvitations": "Invitaciones recibidas",
    "duels.challengesYou": "¡te desafía!",
    "duels.sentInvitations": "Invitaciones enviadas",
    "duels.invitationTo": "Invitación a",
    "duels.noInvitations": "Sin invitaciones",
    "duels.createToChallenge": "Crea un duelo para desafiar a tus amigos",
    "duels.noCompletedDuels": "Sin duelos completados",
    "duels.historyAppears": "Tu historial de duelos aparecerá aquí",
    "duels.victory": "Victoria",
    "duels.defeat": "Derrota",
    "duels.draw": "Empate",
    "duels.inProgress": "En curso",
    "duels.viewResults": "Ver resultados",
    "duels.winner": "Ganador",
    "duels.you": "Tú",
    "duels.opponent": "Oponente",
    "duels.score": "Puntuación",
    "duels.accuracy": "Precisión",
    "duels.rate": "Tasa",
    "duels.gap": "Diferencia",
    "duels.yourScore": "Tu puntuación",
    "duels.chooseFriend": "Elige un amigo",
    "duels.selectFriend": "Selecciona un amigo",
    "duels.chooseQuiz": "Elige un cuestionario",
    "duels.selectQuiz": "Selecciona un cuestionario",
    "duels.sending": "Enviando...",
    "chat.backToQuizzes": "Volver a cuestionarios",
    "chat.messages": "Mensajes",
    "chat.noFriends": "Sin amigos",
    "chat.user": "Usuario",
    "chat.deletedUser": "Usuario eliminado",
    "chat.selectFriend": "Selecciona un amigo para comenzar a chatear",
    "training.title": "Modo entrenamiento",
    "training.subtitle": "Practica sin límite de tiempo y sin ganar XP",
    "training.features": "Características del modo entrenamiento",
    "training.feature1": "Sin límite de tiempo - tómate tu tiempo para pensar",
    "training.feature2": "Sin ganancia de XP - solo para practicar",
    "training.feature3": "Elige el número de preguntas",
    "training.feature4": "Validación inmediata con explicaciones",
    "training.step1": "1. Elige un cuestionario",
    "training.step2": "2. Número de preguntas",
    "training.searchQuiz": "Buscar un cuestionario...",
    "training.games": "partidas",
    "training.questions": "preguntas",
    "training.max": "máx",
    "training.start": "Comenzar entrenamiento",
    "share.title": "Compartir cuestionario",
    "share.success": "¡Cuestionario compartido!",
    "share.successMessage": "Tus amigos ahora pueden acceder",
    "share.shareWith": 'Comparte "{title}" con tus amigos',
    "share.sharing": "Compartiendo...",
    "profile.friendRequestError": "Error al enviar solicitud de amistad",
    "profile.friendRequestSent": "¡Solicitud de amistad enviada!",
    "profile.reportError": "Error al enviar reporte",
    "profile.reportSuccess": "Reporte enviado con éxito",
    "profile.addFriend": "Añadir amigo",
    "profile.requestSent": "Solicitud enviada",
    "profile.friend": "Amigo",
    "profile.history": "Historial",
    "profile.report": "Reportar",
    "profile.gamesPlayed": "Partidas jugadas",
    "profile.successRate": "Tasa de éxito",
    "profile.titles": "Títulos",
    "profile.active": "Activo",
    "profile.noTitles": "Sin títulos obtenidos",
    "profile.last7Days": "Puntos de los últimos 7 días",
    "profile.total": "Total",
    "profile.noGamesThisWeek": "No se jugaron partidas esta semana",
    "profile.noBadges": "Sin insignias obtenidas",
    "profile.recentGames": "Partidas recientes",
    "profile.score": "Puntuación",
    "profile.accuracy": "Precisión",
    "profile.noGames": "Sin partidas jugadas",
    "profile.reportUser": "Reportar {user}",
    "profile.reportDescription":
      "Describe la razón de tu reporte. Un administrador revisará tu solicitud.",
    "profile.reportReason": "Razón del reporte...",
    "profile.sending": "Enviando...",
    "profile.warningHistory": "Historial de advertencias",
    "profile.noWarnings": "No se encontraron advertencias",
    "profile.reportedBy": "Reportado por",
    "profile.unknown": "Desconocido",
    "profile.adminNotes": "Notas del administrador",
    "profile.tempBanUntil": "Ban temporal hasta",
    "settings.pseudoRequired": "El nombre de usuario no puede estar vacío",
    "settings.pseudoUpdateError": "Error al actualizar nombre de usuario",
    "settings.pseudoUpdateSuccess": "Nombre de usuario actualizado con éxito",
    "settings.emailPasswordRequired":
      "Correo electrónico y contraseña actual requeridos",
    "settings.incorrectPassword": "Contraseña incorrecta",
    "settings.emailUpdateError": "Error al actualizar correo electrónico",
    "settings.emailConfirmationSent":
      "Se ha enviado un correo de confirmación a tu nueva dirección",
    "settings.supabaseChangeRequiresEmailConfirmation":
      "Para algunos cambios sensibles (correo, seguridad), Supabase envía un correo de confirmación.",
    "settings.allFieldsRequired": "Todos los campos son obligatorios",
    "settings.passwordsMismatch": "Las contraseñas no coinciden",
    "settings.passwordTooShort":
      "La contraseña debe tener al menos 6 caracteres",
    "settings.currentPasswordIncorrect": "Contraseña actual incorrecta",
    "settings.passwordUpdateError": "Error al actualizar contraseña",
    "settings.passwordUpdateSuccess": "Contraseña actualizada con éxito",
    "settings.deleteConfirmation":
      'Esta acción es irreversible. Escribe "ELIMINAR" para confirmar:',
    "settings.deleteKeyword": "ELIMINAR",
    "settings.deleteAccountError": "Error al eliminar cuenta",
    "settings.manageInfo": "Gestiona tu información personal",
    "settings.languagePreferences": "Idioma y preferencias",
    "settings.interfaceLanguage": "Idioma de la interfaz",
    "settings.showAllLanguagesDescription":
      "Mostrar todos los cuestionarios en todos los idiomas (de lo contrario, solo cuestionarios en mi idioma)",
    "settings.username": "Nombre de usuario",
    "settings.newUsername": "Nuevo nombre de usuario",
    "settings.yourUsername": "Tu nombre de usuario",
    "settings.updateUsername": "Actualizar nombre de usuario",
    "settings.emailAddress": "Dirección de correo electrónico",
    "settings.newEmail": "Nueva dirección de correo electrónico",
    "settings.newEmailPlaceholder": "nuevo@email.com",
    "settings.currentPassword": "Contraseña actual",
    "settings.updateEmail": "Actualizar correo electrónico",
    "settings.password": "Contraseña",
    "settings.newPassword": "Nueva contraseña",
    "settings.confirmNewPassword": "Confirmar nueva contraseña",
    "settings.updatePassword": "Actualizar contraseña",
    "settings.dangerZone": "Zona de peligro",
    "settings.deleteWarning":
      "Eliminar tu cuenta es irreversible. Todos tus datos se perderán.",
    "settings.deleteAccount": "Eliminar mi cuenta",
    "settings.currentPasswordRequired": "La contraseña actual es obligatoria",
    "settings.twoFactorTitle": "Autenticación de dos factores (2FA)",
    "settings.twoFactorStatus": "Estado",
    "settings.twoFactorEnabled": "Activada",
    "settings.twoFactorDisabled": "Desactivada",
    "settings.twoFactorStart": "Activar 2FA",
    "settings.twoFactorStartError":
      "No se puede iniciar la autenticación de dos factores.",
    "settings.twoFactorScanInstructions":
      "Escanea el código QR con tu aplicación autenticadora y luego introduce el código.",
    "settings.twoFactorBackupKey": "Clave de respaldo",
    "settings.twoFactorCodeLabel": "Código de verificación (6 dígitos)",
    "settings.twoFactorCodePlaceholder": "123456",
    "settings.twoFactorCodeRequired":
      "Introduce el código de verificación de 6 dígitos.",
    "settings.twoFactorChallengeError":
      "No se puede generar el desafío MFA.",
    "settings.twoFactorInvalidCode":
      "Código inválido. Verifica el código generado e inténtalo de nuevo.",
    "settings.twoFactorEnabledSuccess":
      "Autenticación de dos factores activada correctamente.",
    "settings.twoFactorDisablePassword":
      "Confirma con tu contraseña actual",
    "settings.twoFactorDisableConfirm":
      "¿Desactivar la autenticación de dos factores?",
    "settings.twoFactorDisableButton": "Desactivar 2FA",
    "settings.twoFactorDisableError":
      "No se puede desactivar la autenticación de dos factores.",
    "settings.twoFactorDisabledSuccess":
      "Autenticación de dos factores desactivada.",
    "settings.twoFactorNoActiveFactor": "No se encontró un factor MFA activo.",
    "imageDropzone.invalidType":
      "Por favor selecciona una imagen (JPG, PNG, GIF, WebP)",
    "imageDropzone.fileTooLarge": "La imagen no debe superar 5 MB",
    "imageDropzone.uploadError": "Error al subir",
    "imageDropzone.imageLabel": "Imagen (URL)",
    "imageDropzone.preview": "Vista previa",
    "imageDropzone.uploading": "Subiendo...",
    "imageDropzone.dragHere": "Arrastra una imagen aquí",
    "imageDropzone.orClickToSelect": "o haz clic para seleccionar",
    "imageDropzone.supportedFormats": "JPG, PNG, GIF, WebP (máx 5 MB)",
    "editQuiz.confirmDeleteQuestion":
      "¿Realmente quieres eliminar esta pregunta?",
    "editQuiz.titleRequired": "El título no puede estar vacío",
    "editQuiz.atLeastOneQuestion": "Añade al menos una pregunta",
    "editQuiz.updateSuccess": "¡Cuestionario actualizado con éxito!",
    "editQuiz.updateError": "Error al actualizar cuestionario",
    "editQuiz.loadingQuiz": "Cargando cuestionario...",
    "editQuiz.backToQuizzes": "Volver a cuestionarios",
    "editQuiz.title": "Editar cuestionario",
    "editQuiz.subtitle": "Edita tu cuestionario de geografía",
    "editQuiz.quizInfo": "Información del cuestionario",
    "editQuiz.quizTitle": "Título del cuestionario",
    "editQuiz.titlePlaceholder": "Ej: Capitales europeas",
    "editQuiz.description": "Descripción",
    "editQuiz.descriptionPlaceholder": "Describe tu cuestionario...",
    "editQuiz.coverImage": "Imagen de portada",
    "editQuiz.language": "Idioma",
    "editQuiz.category": "Categoría",
    "editQuiz.difficulty": "Dificultad",
    "editQuiz.timePerQuestion": "Tiempo por pregunta (seg)",
    "editQuiz.questions": "Preguntas",
    "editQuiz.addQuestion": "Añadir pregunta",
    "editQuiz.question": "Pregunta",
    "editQuiz.questionImageOptional": "Imagen de la pregunta (opcional)",
    "editQuiz.questionType.label": "Tipo de pregunta",
    "editQuiz.questionType.mcq": "Opción múltiple",
    "editQuiz.questionType.single_answer": "Respuesta única",
    "editQuiz.questionType.text_free": "Texto libre",
    "editQuiz.questionType.map_click": "Clic en mapa",
    "editQuiz.points": "Puntos",
    "editQuiz.options": "Opciones",
    "editQuiz.option": "Opción",
    "editQuiz.imageForOption": 'Imagen para "{option}" (opcional)',
    "editQuiz.correctAnswer": "Respuesta correcta",
    "editQuiz.select": "Seleccionar",
    "editQuiz.imageIncluded": "Imagen incluida",
    "editQuiz.saving": "Guardando...",
    "editQuiz.saveChanges": "Guardar cambios",
    "editQuiz.questionType.true_false": "Verdadero/Falso",
    "editQuiz.deleteQuestionSuccess": "¡Pregunta eliminada con éxito!",
    "editQuiz.deleteQuestionError": "Error al eliminar pregunta",
    "createQuiz.title": "Crear cuestionario",
    "createQuiz.subtitle": "Crea tu propio cuestionario de geografía",
    "createQuiz.quizType": "Tipo de cuestionario",
    "createQuiz.noType": "Sin tipo",
    "createQuiz.randomizeQuestions": "Mezclar orden de preguntas",
    "createQuiz.randomizeAnswers":
      "Mezclar orden de respuestas (Opción múltiple)",
    "createQuiz.publicQuizAdmin":
      "Cuestionario público - Como administrador, será un cuestionario global aprobado inmediatamente",
    "createQuiz.submitValidation":
      "Enviar para validación ({count}/10 cuestionarios publicados)",
    "createQuiz.addQuestion": "Añadir pregunta",
    "createQuiz.questionPlaceholder": "Ej: ¿Cuál es la capital de Francia?",
    "createQuiz.questionImageDesc":
      "Añade una imagen para ilustrar tu pregunta",
    "createQuiz.trueFalse.type": "Verdadero / Falso",
    "createQuiz.trueFalse.description":
      "Para preguntas Verdadero/Falso, las opciones se establecen automáticamente. Simplemente selecciona la respuesta correcta a continuación.",
    "createQuiz.trueFalse.true": "Verdadero",
    "createQuiz.trueFalse.false": "Falso",
    "createQuiz.optionsMinTwo": "Opciones (2 mínimo)",
    "createQuiz.optionImageDesc":
      "Añade imágenes para cada opción (ej: banderas). ¡Perfecto para cuestionarios visuales!",
    "createQuiz.multipleCorrect":
      "Selecciona una o más respuestas correctas (ej: Capitales de Sudáfrica)",
    "createQuiz.answerPlaceholder": "Ej: París",
    "createQuiz.variants": "Variantes aceptadas (opcional)",
    "createQuiz.variantPlaceholder": "Variante {number} (ej: paris, PARÍS)",
    "createQuiz.addVariant": "Añadir variante",
    "createQuiz.variantsDesc":
      'Añade múltiples variantes aceptadas (ej: "París", "paris", "La capital de Francia")',
    "createQuiz.editingQuestion": "Editando pregunta #{number}",
    "createQuiz.updateQuestion": "Actualizar",
    "createQuiz.addThisQuestion": "Añadir esta pregunta",
    "createQuiz.questionsAdded": "Preguntas añadidas",
    "createQuiz.answer": "Respuesta",
    "createQuiz.saveQuiz": "Guardar cuestionario",
    "createQuiz.success": "¡Cuestionario creado con éxito!",
    "createQuiz.errors.questionEmpty": "La pregunta no puede estar vacía",
    "createQuiz.errors.answerEmpty":
      "La respuesta correcta no puede estar vacía",
    "createQuiz.errors.minTwoOptions":
      "Se requieren al menos 2 opciones para opción múltiple",
    "createQuiz.errors.answerMustBeOption":
      "La respuesta correcta debe ser una de las opciones",
    "createQuiz.errors.maxQuizReached":
      "Has alcanzado el límite de 10 cuestionarios públicos",
    "createQuiz.errors.createError": "Error al crear cuestionario",
    "playQuiz.selectAnswer": "Por favor selecciona o introduce una respuesta",
    "playQuiz.loadingQuiz": "Cargando cuestionario...",
    "playQuiz.trainingComplete": "¡Entrenamiento completado!",
    "playQuiz.quizComplete": "¡Cuestionario completado!",
    "playQuiz.trainingMessage": "¡Buen trabajo! Sigue practicando",
    "playQuiz.congratsMessage":
      "Felicitaciones por completar este cuestionario",
    "playQuiz.totalScore": "Puntuación total",
    "playQuiz.xpGained": "XP ganado",
    "playQuiz.accuracy": "Precisión",
    "playQuiz.correctAnswers": "Respuestas correctas",
    "playQuiz.summary": "Resumen",
    "playQuiz.yourAnswer": "Tu respuesta",
    "playQuiz.noAnswer": "Sin respuesta",
    "playQuiz.correctAnswer": "Respuesta correcta",
    "playQuiz.exploreOtherQuizzes": "Explorar otros cuestionarios",
    "playQuiz.playAgain": "Jugar de nuevo",
    "playQuiz.confirmQuit":
      "¿Estás seguro de que quieres salir? Se perderá tu progreso.",
    "playQuiz.quit": "Salir",
    "playQuiz.trainingMode": "Modo entrenamiento",
    "playQuiz.question": "Pregunta",
    "playQuiz.questionImage": "Pregunta",
    "playQuiz.enterAnswer": "Introduce tu respuesta...",
    "playQuiz.mapClickComing": "Función de clic en mapa próximamente",
    "playQuiz.correct": "¡Correcto!",
    "playQuiz.incorrect": "Incorrecto",
    "playQuiz.correctAnswerWas": "La respuesta correcta era",
    "playQuiz.validate": "Validar",
    "playQuiz.variants": "Variantes",
    "playQuiz.acceptedVariants": "Variantes aceptadas",
    "profile.toNextLevel": "al siguiente nivel",
    "profile.you": "Tú",
    "profile.yourTotal": "Tu total",
    "createQuiz.searchTags": "Etiquetas de búsqueda (Europa, Asia...)",
    "createQuiz.addTagPlaceholder": "Añade una etiqueta y presiona Intro...",
    "createQuiz.maxTags": "Máximo 10 etiquetas",
    "notifications.newMessage": "Nuevo mensaje",
    "notifications.viewMessage": "Ver mensaje",
    "notifications.newFriendRequest": "Nueva solicitud de amistad",
    "notifications.wantsFriend": "quiere ser tu amigo",
    "notifications.viewRequests": "Ver solicitudes",
    "notifications.newDuel": "Nuevo duelo",
    "notifications.duelAccepted": "Duelo aceptado",
    "notifications.victory": "🎉 Victoria",
    "notifications.defeat": "😔 Derrota",
    "notifications.draw": "🤝 Empate",
    "notifications.challengedYou": "te desafió en",
    "notifications.acceptedDuel": "aceptó tu duelo en",
    "notifications.duelFinished": "Duelo terminado contra",
    "notifications.on": "en",
    "notifications.viewDuels": "Ver duelos",
    "notifications.toPlay": "Por jugar",
    "notifications.newResults": "Nuevos resultados",
    "nav.social": "Social",
    "profile.daysToBreakRecord": "días para superar tu racha",
    "profile.keepGoing": "¡Sigue así, lo estás logrando!",
    "common.clickForDetails": "Haz clic para más detalles",
    "createQuiz.complementIfWrongPlaceholder": "Texto mostrado cuando la respuesta es incorrecta",
    "createQuiz.complementIfWrong": "Complemento si la respuesta es incorrecta (opcional)",
    "playQuiz.nextQuestion": "Siguiente pregunta",
    "playQuiz.explanation": "Explicación",
    "playQuiz.finishQuiz": "Terminar el cuestionario",
    "profile.back": "Volver",
    "profile.games": "Partidas",
    "profile.settings": "Ajustes",
    "profile.accountDetails": "Detalles de la cuenta",
    "profile.requestPending": "Solicitud enviada",
    "profile.friends": "Amigos",
    "profile.warnUser": "Advertir al usuario",
    "profile.activateTitle": "Activar",
    "profile.activeTitle": "Activo",
    "profile.noGamesYet": "Ninguna partida jugada",
    "profile.unknownQuiz": "Cuestionario desconocido",
    "profile.questions": "Preguntas",
    "profile.time": "Tiempo",
    "profile.completed": "Completado",
    "profile.inProgress": "En curso",
    "profile.progressChart": "Gráfico de progreso",
    "profile.myProgress": "Mi progreso",
    "profile.user": "Usuario",
    "profile.clickPointInfo": "Haz clic en un punto para ver los detalles",
    "profile.streakDetails": "Detalles de la racha",
    "profile.streakStartedOn": "Racha comenzada el",
    "profile.currentStreak": "Racha actual",
    "profile.longestStreak": "Mejor racha",
    "profile.playTodayToKeepStreak": "Juega hoy para mantener tu racha",
    "profile.dayDetails": "Detalles del día",
    "profile.date": "Fecha",
    "profile.myScore": "Mi puntuación",
    "profile.difference": "Diferencia",
    "profile.warnReason": "Motivo de la advertencia...",
    "profile.sendWarning": "Enviar advertencia",
    "profile.status": "Estado",
    "profile.close": "Cerrar",
    "settings.logout": "Cerrar sesión",
    "settings.logoutConfirmation": "¿Estás seguro de que quieres cerrar sesión?",
    "leaderboard.monthlyPoints": "Puntos mensuales",
    "leaderboard.totalXP": "XP total",
    "leaderboard.you": "TÚ",
    "landing.nav.features": "Características",
    "landing.nav.about": "Acerca de",
    "landing.nav.contact": "Contacto",
    "landing.hero.welcome": "Bienvenido a",
    "landing.hero.subtitle": "La plataforma definitiva para aprender geografía,",
    "landing.hero.subtitleHighlight": "gratis y sin publicidad",
    "landing.hero.startAdventure": "Comenzar la aventura",
    "landing.hero.login": "Iniciar sesión",
    "landing.features.free.title": "100% Gratis",
    "landing.features.free.desc": "Sin suscripciones, sin publicidad, sin ventanas emergentes. La geografía debe ser accesible para todos.",
    "landing.features.community.title": "Creado por la comunidad",
    "landing.features.community.desc": "Crea tus propios cuestionarios y compártelos con la comunidad. Todos pueden contribuir.",
    "landing.features.progress.title": "Progreso y Desafíos",
    "landing.features.progress.desc": "Gana experiencia, desbloquea insignias y desafía a tus amigos a duelos.",
    "landing.about.title": "¿Quiénes somos?",
    "landing.about.intro": "Somos dos estudiantes de informática que decidimos combinar habilidades de desarrollo por un lado y la pasión por la geografía por el otro.",
    "landing.about.mission": "Nuestra Misión",
    "landing.about.missionText": "Creamos este sitio porque las plataformas actuales no te permiten hacer todo lo que quieres sin pagar una suscripción. Nuestra visión es simple: la geografía debe ser accesible para todos y GRATIS.",
    "landing.about.goal": "Objetivo Principal",
    "landing.about.goalText": "A través de este sitio, queremos dar a cualquier persona la oportunidad de aprender geografía sin las limitaciones de suscripciones, publicidad u otras ventanas emergentes intrusivas.",
    "landing.about.offers": "Lo que ofrecemos",
    "landing.about.offer1": "Diversos cuestionarios: Banderas, capitales, mapas, fronteras y mucho más",
    "landing.about.offer2": "Creación de cuestionarios: Crea tus propios cuestionarios y compártelos con la comunidad",
    "landing.about.offer3": "Desafíos multijugador: Enfréntate a tus amigos en duelos o sube en la clasificación",
    "landing.about.offer4": "Sistema de progresión: Niveles, XP, insignias y títulos exclusivos",
    "landing.about.offer5": "Características sociales: Chat en tiempo real y sistema de amigos",
    "landing.about.joinTitle": "Únete a la aventura",
    "landing.about.joinText": "Ya seas un entusiasta de la geografía o simplemente curioso por aprender, TerraCoast te ofrece un entorno estimulante para desarrollar tus conocimientos mientras te diviertes.",
    "landing.stats.free": "Gratis",
    "landing.stats.ads": "Publicidad",
    "landing.stats.quizzes": "Cuestionarios disponibles",
    "landing.stats.available": "Disponible",
    "landing.cta.ready": "¿Listo para empezar?",
    "landing.cta.createAccount": "Crear mi cuenta gratis",
    "landing.footer.tagline": "Hecho con pasión para hacer la geografía accesible a todos",
    "landing.footer.legal": "Avisos legales",
    "landing.footer.privacy": "Política de privacidad",
    "landing.footer.terms": "Condiciones de uso",
    "landing.footer.contact": "Contacto",
    "landing.footer.social": "Comunidad",
    "banned.permanentTitle": "Cuenta Desactivada",
    "banned.temporaryTitle": "Cuenta Suspendida Temporalmente",
    "banned.permanentMessage": "Tu cuenta ha sido baneada permanentemente y ya no puede ser utilizada.",
    "banned.timeRemaining": "Tu cuenta será reactivada en:",
    "banned.endDate": "Fecha de finalización:",
    "banned.reason": "Motivo:",
    "banned.suspensionReason": "Motivo de la suspensión:",
    "banned.autoReconnect": "Podrás volver a conectarte automáticamente una vez que se levante la suspensión.",
    "banned.signOut": "Cerrar Sesión",
    "banned.day": "día",
    "banned.days": "días",
    "banned.hour": "hora",
    "banned.hours": "horas",
    "banned.minute": "minuto",
    "banned.minutes": "minutos",
    "banned.and": "y",
    "auth.username": "Nombre de usuario",
    "auth.hasAccount": "¿Ya tienes una cuenta?",
    "auth.emailPlaceholder": "tu@email.com",
    "auth.passwordPlaceholder": "••••••••",
    "auth.usernamePlaceholder": "TuNombre",
    "auth.connectionError": "Error de conexión",
    "auth.passwordMismatch": "Las contraseñas no coinciden",
    "auth.registrationError": "Error de registro",
    "auth.pseudoPlaceholder": "Tu nombre de usuario",
    "auth.passwordMinLength": "Mínimo 6 caracteres",
    "auth.passwordTooShort": "La contraseña debe contener al menos 6 caracteres",
    "auth.pseudoTooShort": "El nombre de usuario debe contener al menos 3 caracteres",
    "auth.emailAlreadyUsed": "Este email ya está en uso",
    "auth.pseudoAlreadyTaken": "Este nombre de usuario ya está ocupado",
    "auth.acceptTerms": "Acepto las condiciones de uso",
    "auth.acceptPrivacy": "Acepto la política de privacidad",
    "auth.mustAcceptTerms": "Debes aceptar las condiciones de uso y la política de privacidad",
    "auth.readTerms": "Leer las condiciones de uso",
    "auth.readPrivacy": "Leer la política de privacidad",
    "legal.title.terms": "Condiciones de uso",
    "legal.title.privacy": "Política de privacidad",
    "legal.terms.acceptance": "Aceptación de las condiciones",
    "legal.terms.acceptanceText": "Al utilizar TerraCoast, aceptas estas condiciones de uso.",
    "legal.terms.useOfService": "Uso del servicio",
    "legal.terms.useOfServiceText": "TerraCoast es una plataforma gratuita de aprendizaje de geografía. Te comprometes a utilizar el servicio de manera responsable.",
    "legal.terms.userContent": "Contenido del usuario",
    "legal.terms.userContentText": "Al crear cuestionarios, otorgas a TerraCoast el derecho de publicarlos en la plataforma. Sigues siendo el propietario de tu contenido.",
    "legal.terms.behavior": "Comportamiento",
    "legal.terms.behaviorText": "Cualquier comportamiento inapropiado (spam, acoso, contenido ilegal) resultará en la suspensión o eliminación de tu cuenta.",
    "legal.terms.lastUpdated": "Última actualización: 17 de noviembre de 2025",
    "legal.terms.fullText": `Bienvenido a TerraCoast, un sitio de cuestionarios dedicado a la geografía. El acceso y uso del sitio implican la aceptación plena de estas Condiciones de uso. Si no aceptas estas condiciones, te invitamos a no utilizar el servicio.

1. Objeto del servicio
TerraCoast permite a los usuarios:
- Crear una cuenta para acceder a los cuestionarios de geografía.
- Participar en clasificaciones y obtener puntuaciones.
- Utilizar un sistema de chat privado para comunicarse con otros usuarios.

2. Creación de cuenta y datos recopilados
Durante el registro, se recopilan los siguientes datos:
- Nombre de usuario
- Correo electrónico
- Contraseña
Los usuarios se comprometen a proporcionar información exacta y a actualizarla en caso de modificación.

3. Protección y almacenamiento de datos
- Los datos personales se alojan exclusivamente en Europa.
- La información de inicio de sesión está protegida y las contraseñas están cifradas.
- Los mensajes intercambiados en el chat son privados y están cifrados para que no puedan ser leídos por terceros.
Ningún dato será vendido o transmitido a terceros sin consentimiento, salvo obligación legal.

4. Uso del sitio y comportamiento de los usuarios
El usuario se compromete a:
- No intentar acceder a las cuentas de otros usuarios.
- No difundir contenido insultante, discriminatorio, violento, ilegal o inapropiado.
- Respetar a los demás miembros y el espíritu educativo del sitio.
El incumplimiento de estas normas puede provocar la suspensión o eliminación definitiva de la cuenta.

5. Responsabilidades
- TerraCoast hace todo lo posible para garantizar un servicio estable y seguro, pero no puede garantizar una disponibilidad permanente del sitio.
- TerraCoast no es responsable de pérdidas de datos, problemas de red o del comportamiento de los usuarios en el chat.

6. Propiedad intelectual
Los contenidos del sitio (textos, elementos visuales, cuestionarios, logotipo, nombre TerraCoast, etc.) están protegidos por la legislación de propiedad intelectual. Toda reproducción, representación o difusión sin autorización está prohibida.

7. Eliminación de la cuenta y derecho de supresión
Los usuarios pueden solicitar la eliminación de su cuenta y de sus datos en cualquier momento a través de:
helpdesk@terracoast.ch

8. Modificación de las condiciones
TerraCoast se reserva el derecho de modificar estas Condiciones de uso en cualquier momento. Los usuarios serán informados en caso de cambio importante.

9. Contacto
Para cualquier pregunta sobre el uso del servicio o los datos personales:
helpdesk@terracoast.ch`,
    "legal.privacy.dataCollection": "Recopilación de datos",
    "legal.privacy.dataCollectionText": "TerraCoast solo recopila los datos necesarios para el funcionamiento del servicio: dirección de email, nombre de usuario y estadísticas de juego.",
    "legal.privacy.dataUse": "Uso de los datos",
    "legal.privacy.dataUseText": "Tus datos se utilizan únicamente para mejorar tu experiencia en la plataforma. No vendemos ni compartimos tus datos con terceros.",
    "legal.privacy.cookies": "Cookies",
    "legal.privacy.cookiesText": "El sitio utiliza cookies esenciales para asegurar su buen funcionamiento y tu autenticación.",
    "legal.privacy.rights": "Tus derechos",
    "legal.privacy.rightsText": "Tienes derecho de acceso, rectificación y eliminación de tus datos personales.",
    "legal.privacy.lastUpdated": "Fecha de actualización: 15 de noviembre de 2025",
    "legal.privacy.fullText": `La presente Política de Privacidad tiene como objetivo informar a los usuarios del sitio TerraCoast (en adelante, el “Sitio”) sobre la manera en que sus datos personales se recopilan, utilizan, protegen y, en su caso, comparten.

TerraCoast concede gran importancia al respeto de la vida privada y se compromete a adoptar todas las medidas necesarias para garantizar la protección de los datos personales de los usuarios.

1. Datos recopilados
Durante el registro y el uso del Sitio, TerraCoast recopila únicamente los datos necesarios para el correcto funcionamiento de la plataforma:
- Nombre de usuario: identificación en el juego y en el chat (obligatorio)
- Correo electrónico: gestión de la cuenta y recuperación de contraseña (obligatorio)
- Contraseña: acceso seguro a la cuenta (obligatorio)
- Mensajes del chat: comunicación privada entre usuarios (opcional)
No se recopilan datos sensibles.

2. Uso de los datos
Los datos recopilados se utilizan para:
- La creación, gestión y seguridad de la cuenta de usuario
- El acceso a los cuestionarios y funcionalidades del Sitio
- El uso del chat privado entre usuarios
- El contacto con los usuarios en caso de necesidad (soporte, notificaciones, seguridad)
Ningún dato se vende, alquila ni comparte con fines comerciales.

3. Ubicación y cumplimiento del almacenamiento de datos
Todos los datos recopilados se alojan y tratan en Europa, en países que siguen las normas de la Unión Europea en materia de protección de datos y ofrecen un nivel de protección adecuado.

4. Seguridad de los datos
TerraCoast aplica medidas técnicas y organizativas para proteger los datos contra:
- Acceso no autorizado
- Pérdida o destrucción accidental
- Modificación o divulgación ilícita
Las conversaciones del chat están cifradas y son estrictamente privadas.
Las contraseñas se almacenan de forma cifrada y nunca en texto plano.

5. Plazo de conservación
- Los datos se conservan mientras la cuenta esté activa.
- En caso de eliminación de la cuenta, todos los datos se borran en un plazo máximo de 30 días.

6. Derechos de los usuarios
Según la legislación aplicable, cada usuario dispone de los siguientes derechos:
- Acceso
- Rectificación
- Supresión
- Limitación del tratamiento
- Oposición
- Portabilidad de los datos
Toda solicitud puede enviarse a: helpdesk@terracoast.ch
Se proporcionará una respuesta en un plazo máximo de 30 días.

7. Cookies
TerraCoast utiliza únicamente cookies técnicas necesarias para el funcionamiento del Sitio (inicio de sesión, mantenimiento de sesión).
No se utilizan cookies publicitarias ni de seguimiento externo.

8. Modificación de la Política de Privacidad
TerraCoast se reserva el derecho de modificar esta Política de Privacidad en cualquier momento.
En caso de cambios importantes, los usuarios serán informados mediante notificación o correo electrónico.

9. Contacto
Para cualquier pregunta relativa a la protección de datos personales:
helpdesk@terracoast.ch`,
    "forceUsername.title": "Cambio de Nombre de Usuario Requerido",
    "forceUsername.subtitle": "Debes elegir un nuevo nombre de usuario para continuar",
    "forceUsername.flaggedTitle": "Tu nombre de usuario actual ha sido reportado",
    "forceUsername.flaggedDesc": "Un administrador requiere que elijas un nuevo nombre de usuario apropiado.",
    "forceUsername.currentPseudo": "Nombre de Usuario Actual",
    "forceUsername.newPseudo": "Nuevo Nombre de Usuario",
    "forceUsername.placeholder": "Ingresa tu nuevo nombre de usuario",
    "forceUsername.rules": "3-20 caracteres, letras, números, guiones bajos y espacios únicamente",
    "forceUsername.confirm": "Confirmar Nuevo Nombre de Usuario",
    "forceUsername.updating": "Actualizando...",
    "forceUsername.notice": "No podrás acceder a la aplicación hasta que hayas elegido un nuevo nombre de usuario apropiado.",
    "forceUsername.errorEmpty": "Por favor, ingresa un nuevo nombre de usuario",
    "forceUsername.errorLength": "El nombre de usuario debe contener entre 3 y 20 caracteres",
    "forceUsername.errorInvalid": "El nombre de usuario solo puede contener letras, números, guiones bajos y espacios",
    "forceUsername.errorTaken": "Este nombre de usuario ya está ocupado",
    "forceUsername.errorUpdate": "Error al actualizar el nombre de usuario",
    "forceUsername.errorGeneric": "Ocurrió un error",
    "settings.twoFactorConfirmActivation": "Conectar",
  },
  de: {
    "app.title": "TerraCoast",
    "nav.home": "Startseite",
    "nav.quizzes": "Quiz",
    "nav.leaderboard": "Rangliste",
    "nav.friends": "Freunde",
    "nav.duels": "Duelle",
    "nav.chat": "Chat",
    "nav.profile": "Profil",
    "nav.settings": "Einstellungen",
    "nav.admin": "Admin",
    "nav.logout": "Abmelden",
    "auth.login": "Anmelden",
    "auth.register": "Registrieren",
    "auth.email": "E-Mail",
    "auth.password": "Passwort",
    "auth.pseudo": "Benutzername",
    "auth.confirmPassword": "Passwort bestätigen",
    "auth.alreadyAccount": "Haben Sie bereits ein Konto?",
    "auth.noAccount": "Noch kein Konto?",
    "auth.signIn": "Anmelden",
    "auth.signUp": "Registrieren",
    "quiz.create": "Quiz erstellen",
    "quiz.edit": "Bearbeiten",
    "quiz.delete": "Löschen",
    "quiz.play": "Spielen",
    "quiz.share": "Teilen",
    "quiz.publish": "Veröffentlichen",
    "quiz.title": "Titel",
    "quiz.description": "Beschreibung",
    "quiz.category": "Kategorie",
    "quiz.difficulty": "Schwierigkeit",
    "quiz.language": "Sprache",
    "quiz.questions": "Fragen",
    "quiz.submit": "Absenden",
    "quiz.next": "Weiter",
    "quiz.finish": "Beenden",
    "quiz.replay": "Wiederholen",
    "quiz.explore": "Andere Quiz erkunden",
    "quiz.myQuizzes": "Meine Quiz",
    "quiz.publicQuizzes": "Öffentliche Quiz",
    "quiz.sharedQuizzes": "Geteilte Quiz",
    "quiz.noQuizzes": "Keine Quiz verfügbar",
    "quiz.backToList": "Zurück zur Liste",
    "settings.language": "Sprache",
    "settings.showAllLanguages": "Alle Quiz anzeigen (alle Sprachen)",
    "settings.showOnlyMyLanguage": "Nur Quiz in meiner Sprache anzeigen",
    "settings.accountSettings": "Kontoeinstellungen",
    "settings.backToProfile": "Zurück zum Profil",
    "common.save": "Speichern",
    "common.cancel": "Abbrechen",
    "common.loading": "Lädt...",
    "common.error": "Fehler",
    "common.success": "Erfolg",
    "common.back": "Zurück",
    "common.close": "Schließen",
    "common.confirm": "Bestätigen",
    "common.all": "Alle",
    "common.search": "Suchen",
    "profile.level": "Level",
    "profile.xp": "XP",
    "profile.badges": "Abzeichen",
    "profile.statistics": "Statistiken",
    "leaderboard.monthly": "Monatliche Rangliste",
    "leaderboard.rank": "Rang",
    "friends.addFriend": "Freund hinzufügen",
    "friends.pending": "Ausstehend",
    "friends.myFriends": "Meine Freunde",
    "chat.noMessages": "Keine Nachrichten",
    "chat.typeMessage": "Nachricht eingeben...",
    "chat.send": "Senden",
    "home.welcome": "Willkommen",
    "home.readyToTest": "Bereit, dein Geografiewissen zu testen?",
    "home.accountBanned": "Konto gesperrt",
    "home.temporaryBanUntil": "Dein Konto ist vorübergehend gesperrt bis",
    "home.permanentBan": "Dein Konto ist dauerhaft gesperrt",
    "home.reason": "Grund",
    "home.notSpecified": "Nicht angegeben",
    "home.warningsReceived": "Erhaltene Warnungen",
    "home.warning": "Warnung",
    "home.note": "Notiz",
    "home.respectRules":
      "Bitte respektiere die Community-Regeln, um weitere Sanktionen zu vermeiden",
    "home.gamesPlayed": "Gespielte Spiele",
    "home.totalSessions": "Gesamte Sitzungen",
    "home.currentStreak": "Aktuelle Serie",
    "home.record": "Rekord",
    "home.dailyPoints": "Tagespunkte",
    "home.pts": "Pkt",
    "home.quickActions": "Schnellaktionen",
    "home.exploreQuizzes": "Quiz erkunden",
    "home.discoverNewChallenges": "Neue Herausforderungen entdecken",
    "home.shareKnowledge": "Teile dein Wissen",
    "home.trainingMode": "Trainingsmodus",
    "home.noTimeLimit": "Kein Zeitlimit",
    "home.challengeFriend": "Fordere einen Freund heraus",
    "home.realTimeDuel": "Echtzeit-Duell",
    "home.trendingQuizzes": "Beliebte Quiz",
    "home.newAndPopular": "Neu & Beliebt",
    "home.new": "NEU",
    "home.games": "Spiele",
    "home.thisWeek": "diese Woche",
    "home.easy": "Einfach",
    "home.medium": "Mittel",
    "home.hard": "Schwer",
    "common.day": "Tag",
    "common.days": "Tage",
    "quizzes.title": "Geografie-Quiz",
    "quizzes.subtitle": "Erkunde und spiele von der Community erstellte Quiz",
    "quizzes.searchPlaceholder": "Nach einem Quiz suchen...",
    "quizzes.allCategories": "Alle Kategorien",
    "quizzes.allDifficulties": "Alle Schwierigkeiten",
    "quizzes.allTypes": "Alle Typen",
    "quizzes.category.flags": "Flaggen",
    "quizzes.category.capitals": "Hauptstädte",
    "quizzes.category.maps": "Karten",
    "quizzes.category.borders": "Grenzen",
    "quizzes.category.regions": "Regionen",
    "quizzes.category.mixed": "Gemischt",
    "quizzes.difficulty.easy": "Einfach",
    "quizzes.difficulty.medium": "Mittel",
    "quizzes.difficulty.hard": "Schwer",
    "quizzes.global": "Global",
    "quizzes.games": "Spiele",
    "quizzes.average": "Durchschn.",
    "quizzes.trainingMode": "Trainingsmodus",
    "quizzes.shareWithFriends": "Mit Freunden teilen",
    "quizzes.publishDirectly": "Direkt veröffentlichen",
    "quizzes.requestPublish": "Veröffentlichung anfragen",
    "quizzes.removeFromList": "Von meiner Liste entfernen",
    "quizzes.noQuizFound": "Kein Quiz gefunden",
    "quizzes.noQuizCreated": "Du hast noch kein Quiz erstellt",
    "quizzes.noQuizShared": "Keine Quiz mit dir geteilt",
    "quizzes.tryDifferentFilters": "Versuche deine Filter zu ändern",
    "quizzes.confirmPublishRequest": 'Veröffentlichung von "{title}" anfragen?',
    "quizzes.publishRequestError": "Fehler bei der Anfrage",
    "quizzes.publishRequestSuccess":
      "Anfrage gesendet! Ein Admin wird dein Quiz validieren.",
    "quizzes.publishError": "Fehler bei der Veröffentlichung",
    "quizzes.publishSuccess": "Quiz erfolgreich veröffentlicht!",
    "quizzes.confirmRemoveShared":
      "Möchtest du dieses Quiz aus deiner geteilten Liste entfernen?",
    "quizzes.removeSuccess": "Quiz erfolgreich aus deiner Liste entfernt!",
    "quizzes.removeError": "Fehler beim Löschen",
    "quizzes.confirmDelete":
      'Bist du sicher, dass du das Quiz "{title}" löschen möchtest? Diese Aktion ist irreversibel.',
    "quizzes.deleteSuccess": "Quiz erfolgreich gelöscht!",
    "quizzes.deleteError": "Fehler beim Löschen des Quiz",
    "quizzes.deleteQuestionsError": "Fehler beim Löschen der Fragen",
    "quizzes.deleteQuiz": "Quiz löschen",
    "leaderboard.title": "Rangliste",
    "leaderboard.subtitle": "Die besten TerraCoast-Spieler",
    "leaderboard.global": "Globale Rangliste",
    "leaderboard.friends": "Unter Freunden",
    "leaderboard.thisMonth": "Diesen Monat",
    "leaderboard.allTime": "Aller Zeiten",
    "leaderboard.monthlyReset":
      "Punkte werden jeden Monat zurückgesetzt. Die Top 10 erhalten einen Titel!",
    "leaderboard.loading": "Lade Rangliste...",
    "leaderboard.noPlayers": "Keine Spieler",
    "leaderboard.emptyLeaderboard": "Die Rangliste ist momentan leer",
    "leaderboard.game": "Spiel",
    "leaderboard.games": "Spiele",
    "leaderboard.thisMonthShort": "diesen Monat",
    "leaderboard.top10": "Top 10",
    "leaderboard.totalPoints": "Gesamtpunkte",
    "friends.title": "Freunde",
    "friends.subtitle": "Verwalte deine Freunde und chatte zusammen",
    "friends.pendingRequests": "Ausstehende Anfragen",
    "friends.accept": "Akzeptieren",
    "friends.reject": "Ablehnen",
    "friends.suggestions": "Freundesvorschläge",
    "friends.add": "Hinzufügen",
    "friends.searchTitle": "Freunde suchen",
    "friends.searchPlaceholder": "Nach Benutzername suchen...",
    "friends.myFriendsTitle": "Meine Freunde",
    "friends.noFriends": "Du hast noch keine Freunde",
    "friends.sendMessage": "Nachricht senden",
    "friends.removeFriend": "Aus Freunden entfernen",
    "friends.requestSent": "Anfrage gesendet!",
    "friends.confirmRemove":
      "Möchtest du {name} wirklich aus deinen Freunden entfernen?",
    "duels.title": "Duelle",
    "duels.subtitle": "Fordere deine Freunde in Echtzeit heraus",
    "duels.createDuel": "Duell erstellen",
    "duels.activeDuels": "Aktive Duelle",
    "duels.invitations": "Einladungen",
    "duels.history": "Verlauf",
    "duels.noActiveDuels": "Keine aktiven Duelle",
    "duels.createOrAccept": "Erstelle ein Duell oder akzeptiere eine Einladung",
    "duels.vs": "vs",
    "duels.youPlayed": "Du hast gespielt",
    "duels.waiting": "Warten",
    "duels.hasPlayed": "hat gespielt",
    "duels.hasNotPlayed": "hat nicht gespielt",
    "duels.alreadyPlayed": "Bereits gespielt",
    "duels.receivedInvitations": "Erhaltene Einladungen",
    "duels.challengesYou": "fordert dich heraus!",
    "duels.sentInvitations": "Gesendete Einladungen",
    "duels.invitationTo": "Einladung an",
    "duels.noInvitations": "Keine Einladungen",
    "duels.createToChallenge":
      "Erstelle ein Duell, um deine Freunde herauszufordern",
    "duels.noCompletedDuels": "Keine abgeschlossenen Duelle",
    "duels.historyAppears": "Dein Duellverlauf wird hier erscheinen",
    "duels.victory": "Sieg",
    "duels.defeat": "Niederlage",
    "duels.draw": "Unentschieden",
    "duels.inProgress": "Läuft",
    "duels.winner": "Gewinner",
    "duels.you": "Du",
    "duels.opponent": "Gegner",
    "duels.score": "Punktzahl",
    "duels.accuracy": "Genauigkeit",
    "duels.rate": "Rate",
    "duels.gap": "Unterschied",
    "duels.yourScore": "Deine Punktzahl",
    "duels.chooseFriend": "Wähle einen Freund",
    "duels.selectFriend": "Wähle einen Freund aus",
    "duels.chooseQuiz": "Wähle ein Quiz",
    "duels.selectQuiz": "Wähle ein Quiz aus",
    "duels.viewResults": "Ergebnisse anzeigen",
    "duels.sending": "Senden...",
    "chat.backToQuizzes": "Zurück zu Quizzen",
    "chat.messages": "Nachrichten",
    "chat.noFriends": "Keine Freunde",
    "chat.user": "Benutzer",
    "chat.deletedUser": "Gelöschter Benutzer",
    "chat.selectFriend": "Wähle einen Freund zum Chatten",
    "training.title": "Trainingsmodus",
    "training.subtitle": "Übe ohne Zeitlimit und ohne XP zu verdienen",
    "training.features": "Trainingsmodus-Funktionen",
    "training.feature1": "Kein Zeitlimit - nimm dir Zeit zum Nachdenken",
    "training.feature2": "Kein XP-Gewinn - nur zum Üben",
    "training.feature3": "Wähle die Anzahl der Fragen",
    "training.feature4": "Sofortige Validierung mit Erklärungen",
    "training.step1": "1. Wähle ein Quiz",
    "training.step2": "2. Anzahl der Fragen",
    "training.searchQuiz": "Nach einem Quiz suchen...",
    "training.games": "Spiele",
    "training.questions": "Fragen",
    "training.max": "max",
    "training.start": "Training starten",
    "share.title": "Quiz teilen",
    "share.success": "Quiz geteilt!",
    "share.successMessage": "Deine Freunde können jetzt darauf zugreifen",
    "share.shareWith": 'Teile "{title}" mit deinen Freunden',
    "share.sharing": "Teilen...",
    "profile.friendRequestError": "Fehler beim Senden der Freundschaftsanfrage",
    "profile.friendRequestSent": "Freundschaftsanfrage gesendet!",
    "profile.reportError": "Fehler beim Senden der Meldung",
    "profile.reportSuccess": "Meldung erfolgreich gesendet",
    "profile.addFriend": "Freund hinzufügen",
    "profile.requestSent": "Anfrage gesendet",
    "profile.friend": "Freund",
    "profile.history": "Verlauf",
    "profile.report": "Melden",
    "profile.gamesPlayed": "Gespielte Spiele",
    "profile.successRate": "Erfolgsrate",
    "profile.titles": "Titel",
    "profile.active": "Aktiv",
    "profile.noTitles": "Keine Titel erworben",
    "profile.last7Days": "Punkte der letzten 7 Tage",
    "profile.total": "Gesamt",
    "profile.noGamesThisWeek": "Keine Spiele diese Woche gespielt",
    "profile.noBadges": "Keine Abzeichen erworben",
    "profile.recentGames": "Letzte Spiele",
    "profile.score": "Punktzahl",
    "profile.accuracy": "Genauigkeit",
    "profile.noGames": "Keine Spiele gespielt",
    "profile.reportUser": "{user} melden",
    "profile.reportDescription":
      "Beschreibe den Grund deiner Meldung. Ein Administrator wird deine Anfrage prüfen.",
    "profile.reportReason": "Meldegrund...",
    "profile.sending": "Senden...",
    "profile.warningHistory": "Warnungsverlauf",
    "profile.noWarnings": "Keine Warnungen gefunden",
    "profile.reportedBy": "Gemeldet von",
    "profile.unknown": "Unbekannt",
    "profile.adminNotes": "Admin-Notizen",
    "profile.tempBanUntil": "Vorübergehende Sperre bis",
    "settings.pseudoRequired": "Benutzername darf nicht leer sein",
    "settings.pseudoUpdateError":
      "Fehler beim Aktualisieren des Benutzernamens",
    "settings.pseudoUpdateSuccess": "Benutzername erfolgreich aktualisiert",
    "settings.emailPasswordRequired":
      "E-Mail und aktuelles Passwort erforderlich",
    "settings.incorrectPassword": "Falsches Passwort",
    "settings.emailUpdateError": "Fehler beim Aktualisieren der E-Mail",
    "settings.emailConfirmationSent":
      "Eine Bestätigungs-E-Mail wurde an deine neue Adresse gesendet",
    "settings.supabaseChangeRequiresEmailConfirmation":
      "Für bestimmte sensible Änderungen (E-Mail, Sicherheit) sendet Supabase eine Bestätigungs-E-Mail.",
    "settings.allFieldsRequired": "Alle Felder sind erforderlich",
    "settings.passwordsMismatch": "Passwörter stimmen nicht überein",
    "settings.passwordTooShort": "Passwort muss mindestens 6 Zeichen lang sein",
    "settings.currentPasswordIncorrect": "Aktuelles Passwort falsch",
    "settings.passwordUpdateError": "Fehler beim Aktualisieren des Passworts",
    "settings.passwordUpdateSuccess": "Passwort erfolgreich aktualisiert",
    "settings.deleteConfirmation":
      'Diese Aktion ist unwiderruflich. Gib "LÖSCHEN" ein, um zu bestätigen:',
    "settings.deleteKeyword": "LÖSCHEN",
    "settings.deleteAccountError": "Fehler beim Löschen des Kontos",
    "settings.manageInfo": "Verwalte deine persönlichen Informationen",
    "settings.languagePreferences": "Sprache und Einstellungen",
    "settings.interfaceLanguage": "Oberflächensprache",
    "settings.showAllLanguagesDescription":
      "Alle Quiz in allen Sprachen anzeigen (andernfalls nur Quiz in meiner Sprache)",
    "settings.username": "Benutzername",
    "settings.newUsername": "Neuer Benutzername",
    "settings.yourUsername": "Dein Benutzername",
    "settings.updateUsername": "Benutzername aktualisieren",
    "settings.emailAddress": "E-Mail-Adresse",
    "settings.newEmail": "Neue E-Mail-Adresse",
    "settings.newEmailPlaceholder": "neue@email.com",
    "settings.currentPassword": "Aktuelles Passwort",
    "settings.updateEmail": "E-Mail aktualisieren",
    "settings.password": "Passwort",
    "settings.newPassword": "Neues Passwort",
    "settings.confirmNewPassword": "Neues Passwort bestätigen",
    "settings.updatePassword": "Passwort aktualisieren",
    "settings.dangerZone": "Gefahrenzone",
    "settings.deleteWarning":
      "Das Löschen deines Kontos ist unwiderruflich. Alle deine Daten gehen verloren.",
    "settings.deleteAccount": "Mein Konto löschen",
    "settings.currentPasswordRequired": "Aktuelles Passwort ist erforderlich",
    "settings.twoFactorTitle": "Zwei-Faktor-Authentifizierung (2FA)",
    "settings.twoFactorStatus": "Status",
    "settings.twoFactorEnabled": "Aktiviert",
    "settings.twoFactorDisabled": "Deaktiviert",
    "settings.twoFactorStart": "2FA aktivieren",
    "settings.twoFactorStartError":
      "Zwei-Faktor-Authentifizierung konnte nicht gestartet werden.",
    "settings.twoFactorScanInstructions":
      "Scanne den QR-Code mit deiner Authenticator-App und gib dann den Code ein.",
    "settings.twoFactorBackupKey": "Sicherungsschlüssel",
    "settings.twoFactorCodeLabel": "Bestätigungscode (6 Ziffern)",
    "settings.twoFactorCodePlaceholder": "123456",
    "settings.twoFactorCodeRequired":
      "Gib den 6-stelligen Bestätigungscode ein.",
    "settings.twoFactorChallengeError":
      "MFA-Challenge konnte nicht erstellt werden.",
    "settings.twoFactorInvalidCode":
      "Ungültiger Code. Prüfe den generierten Code und versuche es erneut.",
    "settings.twoFactorEnabledSuccess":
      "Zwei-Faktor-Authentifizierung erfolgreich aktiviert.",
    "settings.twoFactorDisablePassword":
      "Mit aktuellem Passwort bestätigen",
    "settings.twoFactorDisableConfirm":
      "Zwei-Faktor-Authentifizierung deaktivieren?",
    "settings.twoFactorDisableButton": "2FA deaktivieren",
    "settings.twoFactorDisableError":
      "Zwei-Faktor-Authentifizierung konnte nicht deaktiviert werden.",
    "settings.twoFactorDisabledSuccess":
      "Zwei-Faktor-Authentifizierung deaktiviert.",
    "settings.twoFactorNoActiveFactor":
      "Kein aktiver MFA-Faktor gefunden.",
    "imageDropzone.invalidType": "Bitte wähle ein Bild (JPG, PNG, GIF, WebP)",
    "imageDropzone.fileTooLarge": "Bild darf nicht größer als 5 MB sein",
    "imageDropzone.uploadError": "Upload-Fehler",
    "imageDropzone.imageLabel": "Bild (URL)",
    "imageDropzone.preview": "Vorschau",
    "imageDropzone.uploading": "Hochladen...",
    "imageDropzone.dragHere": "Ziehe ein Bild hierher",
    "imageDropzone.orClickToSelect": "oder klicke zum Auswählen",
    "imageDropzone.supportedFormats": "JPG, PNG, GIF, WebP (max 5 MB)",
    "editQuiz.confirmDeleteQuestion":
      "Möchtest du diese Frage wirklich löschen?",
    "editQuiz.titleRequired": "Titel darf nicht leer sein",
    "editQuiz.atLeastOneQuestion": "Füge mindestens eine Frage hinzu",
    "editQuiz.updateSuccess": "Quiz erfolgreich aktualisiert!",
    "editQuiz.updateError": "Fehler beim Aktualisieren des Quiz",
    "editQuiz.loadingQuiz": "Lade Quiz...",
    "editQuiz.backToQuizzes": "Zurück zu Quiz",
    "editQuiz.title": "Quiz bearbeiten",
    "editQuiz.subtitle": "Bearbeite dein Geografie-Quiz",
    "editQuiz.quizInfo": "Quiz-Informationen",
    "editQuiz.quizTitle": "Quiz-Titel",
    "editQuiz.titlePlaceholder": "Z.B.: Europäische Hauptstädte",
    "editQuiz.description": "Beschreibung",
    "editQuiz.descriptionPlaceholder": "Beschreibe dein Quiz...",
    "editQuiz.coverImage": "Titelbild",
    "editQuiz.language": "Sprache",
    "editQuiz.category": "Kategorie",
    "editQuiz.difficulty": "Schwierigkeit",
    "editQuiz.timePerQuestion": "Zeit pro Frage (Sek)",
    "editQuiz.questions": "Fragen",
    "editQuiz.addQuestion": "Frage hinzufügen",
    "editQuiz.question": "Frage",
    "editQuiz.questionImageOptional": "Fragebild (optional)",
    "editQuiz.questionType.label": "Fragetyp",
    "editQuiz.questionType.mcq": "Multiple Choice",
    "editQuiz.questionType.single_answer": "Einzelantwort",
    "editQuiz.questionType.text_free": "Freier Text",
    "editQuiz.questionType.map_click": "Kartenklick",
    "editQuiz.points": "Punkte",
    "editQuiz.options": "Optionen",
    "editQuiz.option": "Option",
    "editQuiz.imageForOption": 'Bild für "{option}" (optional)',
    "editQuiz.correctAnswer": "Richtige Antwort",
    "editQuiz.select": "Auswählen",
    "editQuiz.imageIncluded": "Bild enthalten",
    "editQuiz.saving": "Speichern...",
    "editQuiz.saveChanges": "Änderungen speichern",
    "editQuiz.questionType.true_false": "Wahr/Falsch",
    "editQuiz.deleteQuestionSuccess": "Frage erfolgreich gelöscht!",
    "editQuiz.deleteQuestionError": "Fehler beim Löschen der Frage",
    "createQuiz.title": "Quiz erstellen",
    "createQuiz.subtitle": "Erstelle dein eigenes Geografie-Quiz",
    "createQuiz.quizType": "Quiz-Typ",
    "createQuiz.noType": "Kein Typ",
    "createQuiz.randomizeQuestions": "Fragenreihenfolge mischen",
    "createQuiz.randomizeAnswers":
      "Antwortreihenfolge mischen (Multiple Choice)",
    "createQuiz.publicQuizAdmin":
      "Öffentliches Quiz - Als Admin wird dies sofort ein global genehmigtes Quiz",
    "createQuiz.submitValidation":
      "Zur Validierung einreichen ({count}/10 Quiz veröffentlicht)",
    "createQuiz.addQuestion": "Frage hinzufügen",
    "createQuiz.questionPlaceholder":
      "Z.B.: Was ist die Hauptstadt von Frankreich?",
    "createQuiz.questionImageDesc":
      "Füge ein Bild hinzu, um deine Frage zu illustrieren",
    "createQuiz.trueFalse.type": "Wahr / Falsch",
    "createQuiz.trueFalse.description":
      "Für Wahr/Falsch-Fragen werden die Optionen automatisch gesetzt. Wähle einfach die richtige Antwort unten aus.",
    "createQuiz.trueFalse.true": "Wahr",
    "createQuiz.trueFalse.false": "Falsch",
    "createQuiz.optionsMinTwo": "Optionen (mindestens 2)",
    "createQuiz.optionImageDesc":
      "Füge Bilder für jede Option hinzu (z.B.: Flaggen). Perfekt für visuelle Quiz!",
    "createQuiz.multipleCorrect":
      "Wähle eine oder mehrere richtige Antworten (z.B.: Hauptstädte von Südafrika)",
    "createQuiz.answerPlaceholder": "Z.B.: Paris",
    "createQuiz.variants": "Akzeptierte Varianten (optional)",
    "createQuiz.variantPlaceholder": "Variante {number} (z.B.: paris, PARIS)",
    "createQuiz.addVariant": "Variante hinzufügen",
    "createQuiz.variantsDesc":
      'Füge mehrere akzeptierte Varianten hinzu (z.B.: "Paris", "paris", "Die Hauptstadt von Frankreich")',
    "createQuiz.editingQuestion": "Bearbeite Frage #{number}",
    "createQuiz.updateQuestion": "Aktualisieren",
    "createQuiz.addThisQuestion": "Diese Frage hinzufügen",
    "createQuiz.questionsAdded": "Hinzugefügte Fragen",
    "createQuiz.answer": "Antwort",
    "createQuiz.saveQuiz": "Quiz speichern",
    "createQuiz.success": "Quiz erfolgreich erstellt!",
    "createQuiz.errors.questionEmpty": "Frage darf nicht leer sein",
    "createQuiz.errors.answerEmpty": "Richtige Antwort darf nicht leer sein",
    "createQuiz.errors.minTwoOptions":
      "Mindestens 2 Optionen für Multiple Choice erforderlich",
    "createQuiz.errors.answerMustBeOption":
      "Richtige Antwort muss eine der Optionen sein",
    "createQuiz.errors.maxQuizReached":
      "Du hast das Limit von 10 öffentlichen Quiz erreicht",
    "createQuiz.errors.createError": "Fehler beim Erstellen des Quiz",
    "playQuiz.selectAnswer": "Bitte wähle oder gib eine Antwort ein",
    "playQuiz.loadingQuiz": "Lade Quiz...",
    "playQuiz.trainingComplete": "Training abgeschlossen!",
    "playQuiz.quizComplete": "Quiz abgeschlossen!",
    "playQuiz.trainingMessage": "Gute Arbeit! Mach weiter so",
    "playQuiz.congratsMessage":
      "Herzlichen Glückwunsch zum Abschluss dieses Quiz",
    "playQuiz.totalScore": "Gesamtpunktzahl",
    "playQuiz.xpGained": "XP erhalten",
    "playQuiz.accuracy": "Genauigkeit",
    "playQuiz.correctAnswers": "Richtige Antworten",
    "playQuiz.summary": "Zusammenfassung",
    "playQuiz.yourAnswer": "Deine Antwort",
    "playQuiz.noAnswer": "Keine Antwort",
    "playQuiz.correctAnswer": "Richtige Antwort",
    "playQuiz.exploreOtherQuizzes": "Andere Quiz erkunden",
    "playQuiz.playAgain": "Nochmal spielen",
    "playQuiz.confirmQuit":
      "Bist du sicher, dass du beenden möchtest? Dein Fortschritt geht verloren.",
    "playQuiz.quit": "Beenden",
    "playQuiz.trainingMode": "Trainingsmodus",
    "playQuiz.question": "Frage",
    "playQuiz.questionImage": "Frage",
    "playQuiz.enterAnswer": "Gib deine Antwort ein...",
    "playQuiz.mapClickComing": "Kartenklick-Funktion kommt bald",
    "playQuiz.correct": "Richtig!",
    "playQuiz.incorrect": "Falsch",
    "playQuiz.correctAnswerWas": "Die richtige Antwort war",
    "playQuiz.validate": "Bestätigen",
    "playQuiz.variants": "Varianten",
    "playQuiz.acceptedVariants": "Akzeptierte Varianten",
    "profile.toNextLevel": "zum nächsten Level",
    "profile.you": "Du",
    "profile.yourTotal": "Dein Gesamtergebnis",
    "createQuiz.searchTags": "Such-Tags (Europa, Asien...)",
    "createQuiz.addTagPlaceholder": "Füge einen Tag hinzu und drücke Enter...",
    "createQuiz.maxTags": "Maximal 10 Tags",
    "notifications.newMessage": "Neue Nachricht",
    "notifications.viewMessage": "Nachricht ansehen",
    "notifications.newFriendRequest": "Neue Freundschaftsanfrage",
    "notifications.wantsFriend": "möchte dein Freund sein",
    "notifications.viewRequests": "Anfragen ansehen",
    "notifications.newDuel": "Neues Duell",
    "notifications.duelAccepted": "Duell angenommen",
    "notifications.victory": "🎉 Sieg",
    "notifications.defeat": "😔 Niederlage",
    "notifications.draw": "🤝 Unentschieden",
    "notifications.challengedYou": "hat dich herausgefordert bei",
    "notifications.acceptedDuel": "hat dein Duell angenommen bei",
    "notifications.duelFinished": "Duell beendet gegen",
    "notifications.on": "bei",
    "notifications.viewDuels": "Duelle ansehen",
    "notifications.toPlay": "Zu spielen",
    "notifications.newResults": "Neue Ergebnisse",
    "nav.social": "Soziales",
    "profile.daysToBreakRecord": "Tage, um deinen Rekord zu brechen",
    "profile.keepGoing": "Weiter so, du schaffst das!",
    "common.clickForDetails": "Klicken für weitere Details",
    "createQuiz.complementIfWrongPlaceholder": "Text, der bei falscher Antwort angezeigt wird",
    "createQuiz.complementIfWrong": "Ergänzung bei falscher Antwort (optional)",
    "playQuiz.nextQuestion": "Nächste Frage",
    "playQuiz.explanation": "Erklärung",
    "playQuiz.finishQuiz": "Quiz beenden",
    "profile.back": "Zurück",
    "profile.games": "Spiele",
    "profile.settings": "Einstellungen",
    "profile.accountDetails": "Kontodetails",
    "profile.requestPending": "Anfrage gesendet",
    "profile.friends": "Freunde",
    "profile.warnUser": "Benutzer verwarnen",
    "profile.activateTitle": "Aktivieren",
    "profile.activeTitle": "Aktiv",
    "profile.noGamesYet": "Noch keine Spiele gespielt",
    "profile.unknownQuiz": "Unbekanntes Quiz",
    "profile.questions": "Fragen",
    "profile.time": "Zeit",
    "profile.completed": "Abgeschlossen",
    "profile.inProgress": "Im Gange",
    "profile.progressChart": "Fortschrittsdiagramm",
    "profile.myProgress": "Mein Fortschritt",
    "profile.user": "Benutzer",
    "profile.clickPointInfo": "Klicke auf einen Punkt, um Details zu sehen",
    "profile.streakDetails": "Serien-Details",
    "profile.streakStartedOn": "Serie gestartet am",
    "profile.currentStreak": "Aktuelle Serie",
    "profile.longestStreak": "Längste Serie",
    "profile.playTodayToKeepStreak": "Spiele heute, um deine Serie zu halten",
    "profile.dayDetails": "Tagesdetails",
    "profile.date": "Datum",
    "profile.myScore": "Mein Punktestand",
    "profile.difference": "Differenz",
    "profile.warnReason": "Grund für die Verwarnung...",
    "profile.sendWarning": "Verwarnung senden",
    "profile.status": "Status",
    "profile.close": "Schließen",
    "settings.logout": "Abmelden",
    "settings.logoutConfirmation": "Bist du sicher, dass du dich abmelden möchtest?",
    "leaderboard.monthlyPoints": "Monatliche Punkte",
    "leaderboard.totalXP": "Gesamt-XP",
    "leaderboard.you": "DU",
    "landing.nav.features": "Funktionen",
    "landing.nav.about": "Über uns",
    "landing.nav.contact": "Kontakt",
    "landing.hero.welcome": "Willkommen bei",
    "landing.hero.subtitle": "Die ultimative Plattform, um Geografie zu lernen,",
    "landing.hero.subtitleHighlight": "kostenlos und ohne Werbung",
    "landing.hero.startAdventure": "Abenteuer beginnen",
    "landing.hero.login": "Anmelden",
    "landing.features.free.title": "100% Kostenlos",
    "landing.features.free.desc": "Kein Abonnement, keine Werbung, keine Pop-ups. Geografie sollte für jeden zugänglich sein.",
    "landing.features.community.title": "Von der Community erstellt",
    "landing.features.community.desc": "Erstelle deine eigenen Quizze und teile sie mit der Community. Jeder kann beitragen.",
    "landing.features.progress.title": "Fortschritt & Herausforderungen",
    "landing.features.progress.desc": "Sammle Erfahrung, schalte Abzeichen frei und fordere deine Freunde zum Duell heraus.",
    "landing.about.title": "Wer sind wir?",
    "landing.about.intro": "Wir sind zwei Informatikstudenten, die beschlossen haben, ihre Programmierkenntnisse mit der Leidenschaft für Geografie zu verbinden.",
    "landing.about.mission": "Unsere Mission",
    "landing.about.missionText": "Wir haben diese Seite erstellt, weil es auf aktuellen Plattformen nicht möglich ist, alles zu tun, was man möchte, ohne ein Abonnement zu bezahlen. Unsere Vision ist einfach: Geografie sollte für jeden zugänglich sein und KOSTENLOS.",
    "landing.about.goal": "Hauptziel",
    "landing.about.goalText": "Mit dieser Seite wollen wir jedem die Möglichkeit geben, Geografie ohne Einschränkungen durch Abonnements, Werbung oder andere aufdringliche Pop-ups zu lernen.",
    "landing.about.offers": "Was wir anbieten",
    "landing.about.offer1": "Vielfältige Quizze: Flaggen, Hauptstädte, Karten, Grenzen und vieles mehr",
    "landing.about.offer2": "Quiz-Erstellung: Erstelle deine eigenen Quizze und teile sie mit der Community",
    "landing.about.offer3": "Multiplayer-Herausforderungen: Duelliere dich mit deinen Freunden oder klettere in der Rangliste",
    "landing.about.offer4": "Fortschrittssystem: Level, XP, Abzeichen und exklusive Titel",
    "landing.about.offer5": "Soziale Funktionen: Echtzeit-Chat und Freundesystem",
    "landing.about.joinTitle": "Schließe dich dem Abenteuer an",
    "landing.about.joinText": "Egal, ob du ein Geografie-Enthusiast bist oder einfach nur neugierig aufs Lernen, TerraCoast bietet dir eine anregende Umgebung, um dein Wissen zu erweitern und gleichzeitig Spaß zu haben.",
    "landing.stats.free": "Kostenlos",
    "landing.stats.ads": "Werbung",
    "landing.stats.quizzes": "Verfügbare Quizze",
    "landing.stats.available": "Verfügbar",
    "landing.cta.ready": "Bereit anzufangen?",
    "landing.cta.createAccount": "Mein Konto kostenlos erstellen",
    "landing.footer.tagline": "Mit Leidenschaft gemacht, um Geografie für jeden zugänglich zu machen",
    "landing.footer.legal": "Impressum",
    "landing.footer.privacy": "Datenschutzrichtlinie",
    "landing.footer.terms": "Nutzungsbedingungen",
    "landing.footer.contact": "Kontakt",
    "landing.footer.social": "Community",
    "banned.permanentTitle": "Konto Deaktiviert",
    "banned.temporaryTitle": "Konto Vorübergehend Gesperrt",
    "banned.permanentMessage": "Dein Konto wurde dauerhaft gesperrt und kann nicht mehr verwendet werden.",
    "banned.timeRemaining": "Dein Konto wird reaktiviert in:",
    "banned.endDate": "Enddatum:",
    "banned.reason": "Grund:",
    "banned.suspensionReason": "Grund für die Sperrung:",
    "banned.autoReconnect": "Du kannst dich nach Aufhebung der Sperrung automatisch wieder verbinden.",
    "banned.signOut": "Abmelden",
    "banned.day": "Tag",
    "banned.days": "Tage",
    "banned.hour": "Stunde",
    "banned.hours": "Stunden",
    "banned.minute": "Minute",
    "banned.minutes": "Minuten",
    "banned.and": "und",
    "auth.username": "Benutzername",
    "auth.hasAccount": "Hast du bereits ein Konto?",
    "auth.emailPlaceholder": "deine@email.com",
    "auth.passwordPlaceholder": "••••••••",
    "auth.usernamePlaceholder": "DeinName",
    "auth.connectionError": "Verbindungsfehler",
    "auth.passwordMismatch": "Die Passwörter stimmen nicht überein",
    "auth.registrationError": "Registrierungsfehler",
    "auth.pseudoPlaceholder": "Dein Benutzername",
    "auth.passwordMinLength": "Mindestens 6 Zeichen",
    "auth.passwordTooShort": "Das Passwort muss mindestens 6 Zeichen lang sein",
    "auth.pseudoTooShort": "Der Benutzername muss mindestens 3 Zeichen lang sein",
    "auth.emailAlreadyUsed": "Diese E-Mail wird bereits verwendet",
    "auth.pseudoAlreadyTaken": "Dieser Benutzername ist bereits vergeben",
    "auth.acceptTerms": "Ich akzeptiere die Nutzungsbedingungen",
    "auth.acceptPrivacy": "Ich akzeptiere die Datenschutzrichtlinie",
    "auth.mustAcceptTerms": "Du musst die Nutzungsbedingungen und die Datenschutzrichtlinie akzeptieren",
    "auth.readTerms": "Nutzungsbedingungen lesen",
    "auth.readPrivacy": "Datenschutzrichtlinie lesen",
    "legal.title.terms": "Nutzungsbedingungen",
    "legal.title.privacy": "Datenschutzrichtlinie",
    "legal.terms.acceptance": "Akzeptanz der Bedingungen",
    "legal.terms.acceptanceText": "Durch die Nutzung von TerraCoast akzeptierst du diese Nutzungsbedingungen.",
    "legal.terms.useOfService": "Nutzung des Dienstes",
    "legal.terms.useOfServiceText": "TerraCoast ist eine kostenlose Lernplattform für Geografie. Du verpflichtest dich, den Dienst verantwortungsvoll zu nutzen.",
    "legal.terms.userContent": "Benutzerinhalte",
    "legal.terms.userContentText": "Durch das Erstellen von Quizzen gewährst du TerraCoast das Recht, diese auf der Plattform zu veröffentlichen. Du bleibst Eigentümer deiner Inhalte.",
    "legal.terms.behavior": "Verhalten",
    "legal.terms.behaviorText": "Jegliches unangemessenes Verhalten (Spam, Belästigung, illegale Inhalte) führt zur Sperrung oder Löschung deines Kontos.",
    "legal.terms.lastUpdated": "Letzte Aktualisierung: 17. November 2025",
    "legal.terms.fullText": `Willkommen bei TerraCoast, einer Quiz-Website zum Thema Geografie. Der Zugriff auf und die Nutzung der Website setzen die vollständige Annahme dieser Nutzungsbedingungen voraus. Wenn du diese Bedingungen nicht akzeptierst, nutze den Dienst bitte nicht.

1. Zweck des Dienstes
TerraCoast ermöglicht Nutzern:
- Ein Konto zu erstellen, um auf Geografie-Quizze zuzugreifen.
- An Ranglisten teilzunehmen und Punkte zu erhalten.
- Ein privates Chat-System für den Austausch mit anderen Nutzern zu verwenden.

2. Kontoerstellung und erhobene Daten
Bei der Registrierung werden folgende Daten erhoben:
- Benutzername
- E-Mail-Adresse
- Passwort
Nutzer verpflichten sich, korrekte Angaben zu machen und diese bei Änderungen zu aktualisieren.

3. Schutz und Speicherung der Daten
- Personenbezogene Daten werden ausschließlich in Europa gehostet.
- Anmeldeinformationen sind gesichert und Passwoerter verschluesselt.
- Im Chat ausgetauschte Nachrichten sind privat und verschluesselt, sodass sie von Dritten nicht gelesen werden können.
Ohne Einwilligung werden keine Daten an Dritte verkauft oder uebermittelt, außer bei gesetzlicher Verpflichtung.

4. Nutzung der Website und Verhalten der Nutzer
Der Nutzer verpflichtet sich:
- Nicht zu versuchen, auf Konten anderer Nutzer zuzugreifen.
- Keine beleidigenden, diskriminierenden, gewalttaetigen, illegalen oder unangemessenen Inhalte zu verbreiten.
- Andere Mitglieder sowie den Bildungscharakter der Website zu respektieren.
Ein Verstoß gegen diese Regeln kann zur Sperrung oder endgueltigen Loeschung des Kontos fuehren.

5. Verantwortlichkeiten
- TerraCoast unternimmt alles, um einen stabilen und sicheren Dienst bereitzustellen, kann jedoch keine dauerhafte Verfügbarkeit der Website garantieren.
- TerraCoast haftet nicht für Datenverluste, netzwerkbezogene Probleme oder das Verhalten von Nutzern im Chat.

6. Geistiges Eigentum
Die Inhalte der Website (Texte, Grafiken, Quizze, Logo, Name TerraCoast usw.) sind durch das Recht des geistigen Eigentums geschuetzt. Jede Vervielfaeltigung, Darstellung oder Verbreitung ohne Genehmigung ist untersagt.

7. Kontoloeschung und Recht auf Loeschung
Nutzer können die Löschung ihres Kontos und ihrer Daten jederzeit über folgende Adresse beantragen:
helpdesk@terracoast.ch

8. Änderung der Bedingungen
TerraCoast behält sich das Recht vor, diese Nutzungsbedingungen jederzeit zu ändern. Bei wesentlichen Änderungen werden die Nutzer informiert.

9. Kontakt
Für alle Fragen zur Nutzung des Dienstes oder zu personenbezogenen Daten:
helpdesk@terracoast.ch`,
    "legal.privacy.dataCollection": "Datenerfassung",
    "legal.privacy.dataCollectionText": "TerraCoast sammelt nur Daten, die für den Betrieb des Dienstes erforderlich sind: E-Mail-Adresse, Benutzername und Spielstatistiken.",
    "legal.privacy.dataUse": "Datennutzung",
    "legal.privacy.dataUseText": "Deine Daten werden ausschließlich verwendet, um dein Erlebnis auf der Plattform zu verbessern. Wir verkaufen oder teilen deine Daten nicht mit Dritten.",
    "legal.privacy.cookies": "Cookies",
    "legal.privacy.cookiesText": "Die Website verwendet essenzielle Cookies, um das ordnungsgemäße Funktionieren und deine Authentifizierung zu gewährleisten.",
    "legal.privacy.rights": "Deine Rechte",
    "legal.privacy.rightsText": "Du hast das Recht auf Auskunft, Berichtigung und Löschung deiner personenbezogenen Daten.",
    "legal.privacy.lastUpdated": "Aktualisierungsdatum: 15. November 2025",
    "legal.privacy.fullText": `Diese Datenschutzrichtlinie informiert die Nutzer der Website TerraCoast (nachfolgend „die Website“) darüber, wie ihre personenbezogenen Daten erhoben, verwendet, geschützt und gegebenenfalls weitergegeben werden.

TerraCoast misst dem Schutz der Privatsphäre große Bedeutung bei und verpflichtet sich, alle notwendigen Maßnahmen zum Schutz der personenbezogenen Daten der Nutzer zu ergreifen.

1. Erhobene Daten
Bei der Registrierung und Nutzung der Website erhebt TerraCoast nur die für den ordnungsgemäßen Betrieb der Plattform erforderlichen Daten:
- Benutzername: Identifikation im Spiel und im Chat (erforderlich)
- E-Mail-Adresse: Kontoverwaltung und Passwort-Wiederherstellung (erforderlich)
- Passwort: sicherer Kontozugang (erforderlich)
- Chat-Nachrichten: private Kommunikation zwischen Nutzern (optional)
Es werden keine sensiblen Daten erhoben.

2. Verwendung der Daten
Die erhobenen Daten werden verwendet für:
- Erstellung, Verwaltung und Absicherung des Benutzerkontos
- Zugriff auf Quizze und Funktionen der Website
- Nutzung des privaten Chats zwischen Nutzern
- Kontaktaufnahme mit Nutzern bei Bedarf (Support, Benachrichtigungen, Sicherheit)
Keine Daten werden zu kommerziellen Zwecken verkauft, vermietet oder weitergegeben.

3. Speicherort und Compliance
Alle erhobenen Daten werden in Europa in Ländern gespeichert und verarbeitet, die den Datenschutzstandards der Europäischen Union folgen und ein angemessenes Schutzniveau gewährleisten.

4. Datensicherheit
TerraCoast setzt technische und organisatorische Maßnahmen ein, um Daten zu schützen vor:
- Unbefugtem Zugriff
- Verlust oder versehentlicher Zerstörung
- Unrechtmäßiger Änderung oder Offenlegung
Chat-Unterhaltungen sind verschlüsselt und streng privat.
Passwörter werden verschlüsselt gespeichert und niemals im Klartext aufbewahrt.

5. Speicherdauer
- Daten werden aufbewahrt, solange das Konto aktiv ist.
- Bei Löschung des Kontos werden alle Daten innerhalb von maximal 30 Tagen gelöscht.

6. Rechte der Nutzer
Nach geltendem Recht hat jeder Nutzer folgende Rechte:
- Auskunft
- Berichtigung
- Löschung
- Einschränkung der Verarbeitung
- Widerspruch
- Datenübertragbarkeit
Anfragen können gesendet werden an: helpdesk@terracoast.ch
Eine Antwort erfolgt innerhalb von maximal 30 Tagen.

7. Cookies
TerraCoast verwendet ausschließlich technisch notwendige Cookies für den Betrieb der Website (Anmeldung, Sitzungserhalt).
Es werden keine Werbe- oder externen Tracking-Cookies verwendet.

8. Änderungen der Datenschutzrichtlinie
TerraCoast behält sich das Recht vor, diese Datenschutzrichtlinie jederzeit zu ändern.
Bei wesentlichen Änderungen werden die Nutzer per Benachrichtigung oder E-Mail informiert.

9. Kontakt
Bei Fragen zum Schutz personenbezogener Daten:
helpdesk@terracoast.ch`,
    "forceUsername.title": "Änderung des Benutzernamens Erforderlich",
    "forceUsername.subtitle": "Du musst einen neuen Benutzernamen wählen, um fortzufahren",
    "forceUsername.flaggedTitle": "Dein aktueller Benutzername wurde gemeldet",
    "forceUsername.flaggedDesc": "Ein Administrator fordert dich auf, einen angemessenen neuen Benutzernamen zu wählen.",
    "forceUsername.currentPseudo": "Aktueller Benutzername",
    "forceUsername.newPseudo": "Neuer Benutzername",
    "forceUsername.placeholder": "Gib deinen neuen Benutzernamen ein",
    "forceUsername.rules": "Nur 3-20 Zeichen, Buchstaben, Zahlen, Unterstriche und Leerzeichen",
    "forceUsername.confirm": "Neuen Benutzernamen bestätigen",
    "forceUsername.updating": "Wird aktualisiert...",
    "forceUsername.notice": "Du kannst nicht auf die Anwendung zugreifen, bis du einen angemessenen neuen Benutzernamen gewählt hast.",
    "forceUsername.errorEmpty": "Bitte gib einen neuen Benutzernamen ein",
    "forceUsername.errorLength": "Der Benutzername muss zwischen 3 und 20 Zeichen lang sein",
    "forceUsername.errorInvalid": "Der Benutzername darf nur Buchstaben, Zahlen, Unterstriche und Leerzeichen enthalten",
    "forceUsername.errorTaken": "Dieser Benutzername ist bereits vergeben",
    "forceUsername.errorUpdate": "Fehler beim Aktualisieren des Benutzernamens",
    "forceUsername.errorGeneric": "Ein Fehler ist aufgetreten",
    "settings.twoFactorConfirmActivation": "Anmelden",
  },
  it: {
    "app.title": "TerraCoast",
    "nav.home": "Home",
    "nav.quizzes": "Quiz",
    "nav.leaderboard": "Classifica",
    "nav.friends": "Amici",
    "nav.duels": "Duelli",
    "nav.chat": "Chat",
    "nav.profile": "Profilo",
    "nav.settings": "Impostazioni",
    "nav.admin": "Admin",
    "nav.logout": "Esci",
    "auth.login": "Accedi",
    "auth.register": "Registrati",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.pseudo": "Nome utente",
    "auth.confirmPassword": "Conferma password",
    "auth.alreadyAccount": "Hai già un account?",
    "auth.noAccount": "Non hai un account?",
    "auth.signIn": "Accedi",
    "auth.signUp": "Registrati",
    "quiz.create": "Crea quiz",
    "quiz.edit": "Modifica",
    "quiz.delete": "Elimina",
    "quiz.play": "Gioca",
    "quiz.share": "Condividi",
    "quiz.publish": "Pubblica",
    "quiz.title": "Titolo",
    "quiz.description": "Descrizione",
    "quiz.category": "Categoria",
    "quiz.difficulty": "Difficoltà",
    "quiz.language": "Lingua",
    "quiz.questions": "Domande",
    "quiz.submit": "Invia",
    "quiz.next": "Avanti",
    "quiz.finish": "Fine",
    "quiz.replay": "Rigioca",
    "quiz.explore": "Esplora altri quiz",
    "quiz.myQuizzes": "I miei quiz",
    "quiz.publicQuizzes": "Quiz pubblici",
    "quiz.sharedQuizzes": "Quiz condivisi",
    "quiz.noQuizzes": "Nessun quiz disponibile",
    "quiz.backToList": "Torna alla lista",
    "settings.language": "Lingua",
    "settings.showAllLanguages": "Mostra tutti i quiz (tutte le lingue)",
    "settings.showOnlyMyLanguage": "Mostra solo quiz nella mia lingua",
    "settings.accountSettings": "Impostazioni account",
    "settings.backToProfile": "Torna al profilo",
    "common.save": "Salva",
    "common.cancel": "Annulla",
    "common.loading": "Caricamento...",
    "common.error": "Errore",
    "common.success": "Successo",
    "common.back": "Indietro",
    "common.close": "Chiudi",
    "common.confirm": "Conferma",
    "common.all": "Tutti",
    "common.search": "Cerca",
    "profile.level": "Livello",
    "profile.xp": "XP",
    "profile.badges": "Badge",
    "profile.statistics": "Statistiche",
    "leaderboard.monthly": "Classifica mensile",
    "leaderboard.rank": "Rango",
    "friends.addFriend": "Aggiungi amico",
    "friends.pending": "In attesa",
    "friends.myFriends": "I miei amici",
    "chat.noMessages": "Nessun messaggio",
    "chat.typeMessage": "Scrivi il tuo messaggio...",
    "chat.send": "Invia",
    "home.welcome": "Benvenuto",
    "home.readyToTest": "Pronto a testare le tue conoscenze di geografia?",
    "home.accountBanned": "Account bannato",
    "home.temporaryBanUntil": "Il tuo account è temporaneamente bannato fino a",
    "home.permanentBan": "Il tuo account è permanentemente bannato",
    "home.reason": "Motivo",
    "home.notSpecified": "Non specificato",
    "home.warningsReceived": "Avvisi ricevuti",
    "home.warning": "Avviso",
    "home.note": "Nota",
    "home.respectRules":
      "Per favore rispetta le regole della community per evitare ulteriori sanzioni",
    "home.gamesPlayed": "Partite giocate",
    "home.totalSessions": "Sessioni totali",
    "home.currentStreak": "Serie attuale",
    "home.record": "Record",
    "home.dailyPoints": "Punti giornalieri",
    "home.pts": "pt",
    "home.quickActions": "Azioni rapide",
    "home.exploreQuizzes": "Esplora quiz",
    "home.discoverNewChallenges": "Scopri nuove sfide",
    "home.shareKnowledge": "Condividi la tua conoscenza",
    "home.trainingMode": "Modalità allenamento",
    "home.noTimeLimit": "Nessun limite di tempo",
    "home.challengeFriend": "Sfida un amico",
    "home.realTimeDuel": "Duello in tempo reale",
    "home.trendingQuizzes": "Quiz di tendenza",
    "home.newAndPopular": "Nuovo e popolare",
    "home.new": "NUOVO",
    "home.games": "partite",
    "home.thisWeek": "questa settimana",
    "home.easy": "Facile",
    "home.medium": "Medio",
    "home.hard": "Difficile",
    "common.day": "giorno",
    "common.days": "giorni",
    "quizzes.title": "Quiz di geografia",
    "quizzes.subtitle": "Esplora e gioca ai quiz creati dalla community",
    "quizzes.searchPlaceholder": "Cerca un quiz...",
    "quizzes.allCategories": "Tutte le categorie",
    "quizzes.allDifficulties": "Tutte le difficoltà",
    "quizzes.allTypes": "Tutti i tipi",
    "quizzes.category.flags": "Bandiere",
    "quizzes.category.capitals": "Capitali",
    "quizzes.category.maps": "Mappe",
    "quizzes.category.borders": "Confini",
    "quizzes.category.regions": "Regioni",
    "quizzes.category.mixed": "Misto",
    "quizzes.difficulty.easy": "Facile",
    "quizzes.difficulty.medium": "Medio",
    "quizzes.difficulty.hard": "Difficile",
    "quizzes.global": "Globale",
    "quizzes.games": "partite",
    "quizzes.average": "Media",
    "quizzes.trainingMode": "Modalità allenamento",
    "quizzes.shareWithFriends": "Condividi con amici",
    "quizzes.publishDirectly": "Pubblica direttamente",
    "quizzes.requestPublish": "Richiedi pubblicazione",
    "quizzes.removeFromList": "Rimuovi dalla mia lista",
    "quizzes.noQuizFound": "Nessun quiz trovato",
    "quizzes.noQuizCreated": "Non hai ancora creato nessun quiz",
    "quizzes.noQuizShared": "Nessun quiz condiviso con te",
    "quizzes.tryDifferentFilters": "Prova a cambiare i tuoi filtri",
    "quizzes.confirmPublishRequest":
      'Richiedere la pubblicazione di "{title}"?',
    "quizzes.publishRequestError": "Errore durante la richiesta",
    "quizzes.publishRequestSuccess":
      "Richiesta inviata! Un admin convaliderà il tuo quiz.",
    "quizzes.publishError": "Errore durante la pubblicazione",
    "quizzes.publishSuccess": "Quiz pubblicato con successo!",
    "quizzes.confirmRemoveShared":
      "Vuoi rimuovere questo quiz dalla tua lista condivisa?",
    "quizzes.removeSuccess": "Quiz rimosso con successo dalla tua lista!",
    "quizzes.removeError": "Errore durante l'eliminazione",
    "quizzes.confirmDelete":
      'Sei sicuro di voler eliminare il quiz "{title}"? Questa azione è irreversibile.',
    "quizzes.deleteSuccess": "Quiz eliminato con successo!",
    "quizzes.deleteError": "Errore durante l'eliminazione del quiz",
    "quizzes.deleteQuestionsError":
      "Errore durante l'eliminazione delle domande",
    "quizzes.deleteQuiz": "Elimina quiz",
    "leaderboard.title": "Classifica",
    "leaderboard.subtitle": "I migliori giocatori di TerraCoast",
    "leaderboard.global": "Classifica globale",
    "leaderboard.friends": "Tra amici",
    "leaderboard.thisMonth": "Questo mese",
    "leaderboard.allTime": "Di sempre",
    "leaderboard.monthlyReset":
      "I punteggi si azzerano ogni mese. I primi 10 ricevono un titolo!",
    "leaderboard.loading": "Caricamento classifica...",
    "leaderboard.noPlayers": "Nessun giocatore",
    "leaderboard.emptyLeaderboard": "La classifica è vuota per ora",
    "leaderboard.game": "partita",
    "leaderboard.games": "partite",
    "leaderboard.thisMonthShort": "questo mese",
    "leaderboard.top10": "Top 10",
    "leaderboard.totalPoints": "punti totali",
    "friends.title": "Amici",
    "friends.subtitle": "Gestisci i tuoi amici e chatta insieme",
    "friends.pendingRequests": "Richieste in sospeso",
    "friends.accept": "Accetta",
    "friends.reject": "Rifiuta",
    "friends.suggestions": "Suggerimenti di amicizia",
    "friends.add": "Aggiungi",
    "friends.searchTitle": "Cerca amici",
    "friends.searchPlaceholder": "Cerca per nome utente...",
    "friends.myFriendsTitle": "I miei amici",
    "friends.noFriends": "Non hai ancora amici",
    "friends.sendMessage": "Invia messaggio",
    "friends.removeFriend": "Rimuovi dagli amici",
    "friends.requestSent": "Richiesta inviata!",
    "friends.confirmRemove": "Vuoi davvero rimuovere {name} dai tuoi amici?",
    "duels.title": "Duelli",
    "duels.subtitle": "Sfida i tuoi amici in tempo reale",
    "duels.createDuel": "Crea un duello",
    "duels.activeDuels": "Duelli attivi",
    "duels.invitations": "Inviti",
    "duels.history": "Cronologia",
    "duels.noActiveDuels": "Nessun duello attivo",
    "duels.createOrAccept": "Crea un duello o accetta un invito",
    "duels.vs": "vs",
    "duels.youPlayed": "Hai giocato",
    "duels.waiting": "In attesa",
    "duels.hasPlayed": "ha giocato",
    "duels.hasNotPlayed": "non ha giocato",
    "duels.alreadyPlayed": "Già giocato",
    "duels.receivedInvitations": "Inviti ricevuti",
    "duels.challengesYou": "ti sfida!",
    "duels.sentInvitations": "Inviti inviati",
    "duels.invitationTo": "Invito a",
    "duels.noInvitations": "Nessun invito",
    "duels.createToChallenge": "Crea un duello per sfidare i tuoi amici",
    "duels.noCompletedDuels": "Nessun duello completato",
    "duels.historyAppears": "La cronologia dei tuoi duelli apparirà qui",
    "duels.victory": "Vittoria",
    "duels.defeat": "Sconfitta",
    "duels.draw": "Pareggio",
    "duels.inProgress": "In corso",
    "duels.winner": "Vincitore",
    "duels.you": "Tu",
    "duels.opponent": "Avversario",
    "duels.score": "Punteggio",
    "duels.accuracy": "Precisione",
    "duels.viewResults": "Visualizza risultati",
    "duels.rate": "Tasso",
    "duels.gap": "Divario",
    "duels.yourScore": "Il tuo punteggio",
    "duels.chooseFriend": "Scegli un amico",
    "duels.selectFriend": "Seleziona un amico",
    "duels.chooseQuiz": "Scegli un quiz",
    "duels.selectQuiz": "Seleziona un quiz",
    "duels.sending": "Invio...",
    "chat.backToQuizzes": "Torna ai quiz",
    "chat.messages": "Messaggi",
    "chat.noFriends": "Nessun amico",
    "chat.user": "Utente",
    "chat.deletedUser": "Utente eliminato",
    "chat.selectFriend": "Seleziona un amico per iniziare a chattare",
    "training.title": "Modalità allenamento",
    "training.subtitle": "Pratica senza limite di tempo e senza guadagnare XP",
    "training.features": "Funzionalità modalità allenamento",
    "training.feature1":
      "Nessun limite di tempo - prenditi il tuo tempo per pensare",
    "training.feature2": "Nessun guadagno di XP - solo per esercitarsi",
    "training.feature3": "Scegli il numero di domande",
    "training.feature4": "Validazione immediata con spiegazioni",
    "training.step1": "1. Scegli un quiz",
    "training.step2": "2. Numero di domande",
    "training.searchQuiz": "Cerca un quiz...",
    "training.games": "partite",
    "training.questions": "domande",
    "training.max": "max",
    "training.start": "Inizia allenamento",
    "share.title": "Condividi quiz",
    "share.success": "Quiz condiviso!",
    "share.successMessage": "I tuoi amici ora possono accedervi",
    "share.shareWith": 'Condividi "{title}" con i tuoi amici',
    "share.sharing": "Condivisione...",
    "profile.friendRequestError":
      "Errore nell'invio della richiesta di amicizia",
    "profile.friendRequestSent": "Richiesta di amicizia inviata!",
    "profile.reportError": "Errore nell'invio della segnalazione",
    "profile.reportSuccess": "Segnalazione inviata con successo",
    "profile.addFriend": "Aggiungi amico",
    "profile.requestSent": "Richiesta inviata",
    "profile.friend": "Amico",
    "profile.history": "Cronologia",
    "profile.report": "Segnala",
    "profile.gamesPlayed": "Partite giocate",
    "profile.successRate": "Tasso di successo",
    "profile.titles": "Titoli",
    "profile.active": "Attivo",
    "profile.noTitles": "Nessun titolo ottenuto",
    "profile.last7Days": "Punti degli ultimi 7 giorni",
    "profile.total": "Totale",
    "profile.noGamesThisWeek": "Nessuna partita giocata questa settimana",
    "profile.noBadges": "Nessun badge ottenuto",
    "profile.recentGames": "Partite recenti",
    "profile.score": "Punteggio",
    "profile.accuracy": "Precisione",
    "profile.noGames": "Nessuna partita giocata",
    "profile.reportUser": "Segnala {user}",
    "profile.reportDescription":
      "Descrivi il motivo della tua segnalazione. Un amministratore esaminerà la tua richiesta.",
    "profile.reportReason": "Motivo della segnalazione...",
    "profile.sending": "Invio...",
    "profile.warningHistory": "Cronologia avvisi",
    "profile.noWarnings": "Nessun avviso trovato",
    "profile.reportedBy": "Segnalato da",
    "profile.unknown": "Sconosciuto",
    "profile.adminNotes": "Note admin",
    "profile.tempBanUntil": "Ban temporaneo fino a",
    "settings.pseudoRequired": "Il nome utente non può essere vuoto",
    "settings.pseudoUpdateError": "Errore nell'aggiornamento del nome utente",
    "settings.pseudoUpdateSuccess": "Nome utente aggiornato con successo",
    "settings.emailPasswordRequired": "Email e password attuale richieste",
    "settings.incorrectPassword": "Password errata",
    "settings.emailUpdateError": "Errore nell'aggiornamento dell'email",
    "settings.emailConfirmationSent":
      "Un'email di conferma è stata inviata al tuo nuovo indirizzo",
    "settings.supabaseChangeRequiresEmailConfirmation":
      "Per alcune modifiche sensibili (email, sicurezza), Supabase invia un'email di conferma.",
    "settings.allFieldsRequired": "Tutti i campi sono obbligatori",
    "settings.passwordsMismatch": "Le password non corrispondono",
    "settings.passwordTooShort":
      "La password deve contenere almeno 6 caratteri",
    "settings.currentPasswordIncorrect": "Password attuale errata",
    "settings.passwordUpdateError": "Errore nell'aggiornamento della password",
    "settings.passwordUpdateSuccess": "Password aggiornata con successo",
    "settings.deleteConfirmation":
      'Questa azione è irreversibile. Digita "ELIMINA" per confermare:',
    "settings.deleteKeyword": "ELIMINA",
    "settings.deleteAccountError": "Errore nell'eliminazione dell'account",
    "settings.manageInfo": "Gestisci le tue informazioni personali",
    "settings.languagePreferences": "Lingua e preferenze",
    "settings.interfaceLanguage": "Lingua dell'interfaccia",
    "settings.showAllLanguagesDescription":
      "Mostra tutti i quiz in tutte le lingue (altrimenti solo quiz nella mia lingua)",
    "settings.username": "Nome utente",
    "settings.newUsername": "Nuovo nome utente",
    "settings.yourUsername": "Il tuo nome utente",
    "settings.updateUsername": "Aggiorna nome utente",
    "settings.emailAddress": "Indirizzo email",
    "settings.newEmail": "Nuovo indirizzo email",
    "settings.newEmailPlaceholder": "nuova@email.com",
    "settings.currentPassword": "Password attuale",
    "settings.updateEmail": "Aggiorna email",
    "settings.password": "Password",
    "settings.newPassword": "Nuova password",
    "settings.confirmNewPassword": "Conferma nuova password",
    "settings.updatePassword": "Aggiorna password",
    "settings.dangerZone": "Zona pericolosa",
    "settings.deleteWarning":
      "Eliminare il tuo account è irreversibile. Tutti i tuoi dati andranno persi.",
    "settings.deleteAccount": "Elimina il mio account",
    "settings.currentPasswordRequired": "La password attuale è obbligatoria",
    "settings.twoFactorTitle": "Autenticazione a due fattori (2FA)",
    "settings.twoFactorStatus": "Stato",
    "settings.twoFactorEnabled": "Attivata",
    "settings.twoFactorDisabled": "Disattivata",
    "settings.twoFactorStart": "Attiva 2FA",
    "settings.twoFactorStartError":
      "Impossibile avviare l'autenticazione a due fattori.",
    "settings.twoFactorScanInstructions":
      "Scansiona il QR code con la tua app di autenticazione, poi inserisci il codice.",
    "settings.twoFactorBackupKey": "Chiave di backup",
    "settings.twoFactorCodeLabel": "Codice di verifica (6 cifre)",
    "settings.twoFactorCodePlaceholder": "123456",
    "settings.twoFactorCodeRequired":
      "Inserisci il codice di verifica a 6 cifre.",
    "settings.twoFactorChallengeError":
      "Impossibile generare la challenge MFA.",
    "settings.twoFactorInvalidCode":
      "Codice non valido. Verifica il codice generato e riprova.",
    "settings.twoFactorEnabledSuccess":
      "Autenticazione a due fattori attivata con successo.",
    "settings.twoFactorDisablePassword":
      "Conferma con la password attuale",
    "settings.twoFactorDisableConfirm":
      "Disattivare l'autenticazione a due fattori?",
    "settings.twoFactorDisableButton": "Disattiva 2FA",
    "settings.twoFactorDisableError":
      "Impossibile disattivare l'autenticazione a due fattori.",
    "settings.twoFactorDisabledSuccess":
      "Autenticazione a due fattori disattivata.",
    "settings.twoFactorNoActiveFactor":
      "Nessun fattore MFA attivo trovato.",
    "imageDropzone.invalidType": "Seleziona un'immagine (JPG, PNG, GIF, WebP)",
    "imageDropzone.fileTooLarge": "L'immagine non deve superare 5 MB",
    "imageDropzone.uploadError": "Errore durante il caricamento",
    "imageDropzone.imageLabel": "Immagine (URL)",
    "imageDropzone.preview": "Anteprima",
    "imageDropzone.uploading": "Caricamento...",
    "imageDropzone.dragHere": "Trascina un'immagine qui",
    "imageDropzone.orClickToSelect": "o clicca per selezionare",
    "imageDropzone.supportedFormats": "JPG, PNG, GIF, WebP (max 5 MB)",
    "editQuiz.confirmDeleteQuestion": "Vuoi davvero eliminare questa domanda?",
    "editQuiz.titleRequired": "Il titolo non può essere vuoto",
    "editQuiz.atLeastOneQuestion": "Aggiungi almeno una domanda",
    "editQuiz.updateSuccess": "Quiz aggiornato con successo!",
    "editQuiz.updateError": "Errore nell'aggiornamento del quiz",
    "editQuiz.loadingQuiz": "Caricamento quiz...",
    "editQuiz.backToQuizzes": "Torna ai quiz",
    "editQuiz.title": "Modifica quiz",
    "editQuiz.subtitle": "Modifica il tuo quiz di geografia",
    "editQuiz.quizInfo": "Informazioni quiz",
    "editQuiz.quizTitle": "Titolo del quiz",
    "editQuiz.titlePlaceholder": "Es: Capitali europee",
    "editQuiz.description": "Descrizione",
    "editQuiz.descriptionPlaceholder": "Descrivi il tuo quiz...",
    "editQuiz.coverImage": "Immagine di copertina",
    "editQuiz.language": "Lingua",
    "editQuiz.category": "Categoria",
    "editQuiz.difficulty": "Difficoltà",
    "editQuiz.timePerQuestion": "Tempo per domanda (sec)",
    "editQuiz.questions": "Domande",
    "editQuiz.addQuestion": "Aggiungi domanda",
    "editQuiz.question": "Domanda",
    "editQuiz.questionImageOptional": "Immagine della domanda (opzionale)",
    "editQuiz.questionType.label": "Tipo di domanda",
    "editQuiz.questionType.mcq": "Scelta multipla",
    "editQuiz.questionType.single_answer": "Risposta singola",
    "editQuiz.questionType.text_free": "Testo libero",
    "editQuiz.questionType.map_click": "Clic sulla mappa",
    "editQuiz.points": "Punti",
    "editQuiz.options": "Opzioni",
    "editQuiz.option": "Opzione",
    "editQuiz.imageForOption": 'Immagine per "{option}" (opzionale)',
    "editQuiz.correctAnswer": "Risposta corretta",
    "editQuiz.select": "Seleziona",
    "editQuiz.imageIncluded": "Immagine inclusa",
    "editQuiz.saving": "Salvataggio...",
    "editQuiz.saveChanges": "Salva modifiche",
    "editQuiz.questionType.true_false": "Vero/Falso",
    "editQuiz.deleteQuestionSuccess": "Domanda eliminata con successo!",
    "editQuiz.deleteQuestionError": "Errore nell'eliminazione della domanda",
    "createQuiz.title": "Crea quiz",
    "createQuiz.subtitle": "Crea il tuo quiz di geografia",
    "createQuiz.quizType": "Tipo di quiz",
    "createQuiz.noType": "Nessun tipo",
    "createQuiz.randomizeQuestions": "Mescola ordine domande",
    "createQuiz.randomizeAnswers": "Mescola ordine risposte (Scelta multipla)",
    "createQuiz.publicQuizAdmin":
      "Quiz pubblico - Come admin, sarà un quiz globale approvato immediatamente",
    "createQuiz.submitValidation":
      "Invia per validazione ({count}/10 quiz pubblicati)",
    "createQuiz.addQuestion": "Aggiungi domanda",
    "createQuiz.questionPlaceholder": "Es: Qual è la capitale della Francia?",
    "createQuiz.questionImageDesc":
      "Aggiungi un'immagine per illustrare la tua domanda",
    "createQuiz.trueFalse.type": "Vero / Falso",
    "createQuiz.trueFalse.description":
      "Per le domande Vero/Falso, le opzioni sono impostate automaticamente. Seleziona semplicemente la risposta corretta qui sotto.",
    "createQuiz.trueFalse.true": "Vero",
    "createQuiz.trueFalse.false": "Falso",
    "createQuiz.optionsMinTwo": "Opzioni (minimo 2)",
    "createQuiz.optionImageDesc":
      "Aggiungi immagini per ogni opzione (es: bandiere). Perfetto per quiz visivi!",
    "createQuiz.multipleCorrect":
      "Seleziona una o più risposte corrette (es: Capitali del Sudafrica)",
    "createQuiz.answerPlaceholder": "Es: Parigi",
    "createQuiz.variants": "Varianti accettate (opzionale)",
    "createQuiz.variantPlaceholder": "Variante {number} (es: parigi, PARIGI)",
    "createQuiz.addVariant": "Aggiungi variante",
    "createQuiz.variantsDesc":
      'Aggiungi più varianti accettate (es: "Parigi", "parigi", "La capitale della Francia")',
    "createQuiz.editingQuestion": "Modifica domanda #{number}",
    "createQuiz.updateQuestion": "Aggiorna",
    "createQuiz.addThisQuestion": "Aggiungi questa domanda",
    "createQuiz.questionsAdded": "Domande aggiunte",
    "createQuiz.answer": "Risposta",
    "createQuiz.saveQuiz": "Salva quiz",
    "createQuiz.success": "Quiz creato con successo!",
    "createQuiz.errors.questionEmpty": "La domanda non può essere vuota",
    "createQuiz.errors.answerEmpty":
      "La risposta corretta non può essere vuota",
    "createQuiz.errors.minTwoOptions":
      "Almeno 2 opzioni richieste per scelta multipla",
    "createQuiz.errors.answerMustBeOption":
      "La risposta corretta deve essere una delle opzioni",
    "createQuiz.errors.maxQuizReached":
      "Hai raggiunto il limite di 10 quiz pubblici",
    "createQuiz.errors.createError": "Errore nella creazione del quiz",
    "playQuiz.selectAnswer": "Seleziona o inserisci una risposta",
    "playQuiz.loadingQuiz": "Caricamento quiz...",
    "playQuiz.trainingComplete": "Allenamento completato!",
    "playQuiz.quizComplete": "Quiz completato!",
    "playQuiz.trainingMessage": "Buon lavoro! Continua a esercitarti",
    "playQuiz.congratsMessage":
      "Congratulazioni per aver completato questo quiz",
    "playQuiz.totalScore": "Punteggio totale",
    "playQuiz.xpGained": "XP guadagnati",
    "playQuiz.accuracy": "Precisione",
    "playQuiz.correctAnswers": "Risposte corrette",
    "playQuiz.summary": "Riepilogo",
    "playQuiz.yourAnswer": "La tua risposta",
    "playQuiz.noAnswer": "Nessuna risposta",
    "playQuiz.correctAnswer": "Risposta corretta",
    "playQuiz.exploreOtherQuizzes": "Esplora altri quiz",
    "playQuiz.playAgain": "Gioca ancora",
    "playQuiz.confirmQuit":
      "Sei sicuro di voler uscire? Il tuo progresso andrà perso.",
    "playQuiz.quit": "Esci",
    "playQuiz.trainingMode": "Modalità allenamento",
    "playQuiz.question": "Domanda",
    "playQuiz.questionImage": "Domanda",
    "playQuiz.enterAnswer": "Inserisci la tua risposta...",
    "playQuiz.mapClickComing": "Funzione clic sulla mappa in arrivo",
    "playQuiz.correct": "Corretto!",
    "playQuiz.incorrect": "Sbagliato",
    "playQuiz.correctAnswerWas": "La risposta corretta era",
    "playQuiz.validate": "Convalida",
    "playQuiz.variants": "Varianti",
    "playQuiz.acceptedVariants": "Varianti accettate",
    "profile.toNextLevel": "al prossimo livello",
    "profile.you": "Tu",
    "profile.yourTotal": "Il tuo totale",
    "createQuiz.searchTags": "Tag di ricerca (Europa, Asia...)",
    "createQuiz.addTagPlaceholder": "Aggiungi un tag e premi Invio...",
    "createQuiz.maxTags": "Massimo 10 tag",
    "notifications.newMessage": "Nuovo messaggio",
    "notifications.viewMessage": "Visualizza messaggio",
    "notifications.newFriendRequest": "Nuova richiesta di amicizia",
    "notifications.wantsFriend": "vuole essere tuo amico",
    "notifications.viewRequests": "Visualizza richieste",
    "notifications.newDuel": "Nuovo duello",
    "notifications.duelAccepted": "Duello accettato",
    "notifications.victory": "🎉 Vittoria",
    "notifications.defeat": "😔 Sconfitta",
    "notifications.draw": "🤝 Pareggio",
    "notifications.challengedYou": "ti ha sfidato su",
    "notifications.acceptedDuel": "ha accettato il tuo duello su",
    "notifications.duelFinished": "Duello terminato contro",
    "notifications.on": "su",
    "notifications.viewDuels": "Visualizza duelli",
    "notifications.toPlay": "Da giocare",
    "notifications.newResults": "Nuovi risultati",
    "nav.social": "Social",
    "profile.daysToBreakRecord": "Giorni per battere il tuo record",
    "profile.keepGoing": "Continua così, ce la fai!",
    "common.clickForDetails": "Clicca per maggiori dettagli",
    "createQuiz.complementIfWrongPlaceholder": "Testo visualizzato quando la risposta è errata",
    "createQuiz.complementIfWrong": "Complemento se la risposta è errata (opzionale)",
    "playQuiz.nextQuestion": "Domanda successiva",
    "playQuiz.explanation": "Spiegazione",
    "playQuiz.finishQuiz": "Termina il quiz",
    "profile.back": "Indietro",
    "profile.games": "Partite",
    "profile.settings": "Impostazioni",
    "profile.accountDetails": "Dettagli dell'account",
    "profile.requestPending": "Richiesta inviata",
    "profile.friends": "Amici",
    "profile.warnUser": "Avvisa l'utente",
    "profile.activateTitle": "Attiva",
    "profile.activeTitle": "Attivo",
    "profile.noGamesYet": "Nessuna partita giocata",
    "profile.unknownQuiz": "Quiz sconosciuto",
    "profile.questions": "Domande",
    "profile.time": "Tempo",
    "profile.completed": "Completato",
    "profile.inProgress": "In corso",
    "profile.progressChart": "Grafico dei progressi",
    "profile.myProgress": "I miei progressi",
    "profile.user": "Utente",
    "profile.clickPointInfo": "Clicca su un punto per vedere i dettagli",
    "profile.streakDetails": "Dettagli della serie",
    "profile.streakStartedOn": "Serie iniziata il",
    "profile.currentStreak": "Serie attuale",
    "profile.longestStreak": "Miglior serie",
    "profile.playTodayToKeepStreak": "Gioca oggi per mantenere la tua serie",
    "profile.dayDetails": "Dettagli del giorno",
    "profile.date": "Data",
    "profile.myScore": "Il mio punteggio",
    "profile.difference": "Differenza",
    "profile.warnReason": "Motivo dell'avviso...",
    "profile.sendWarning": "Invia avviso",
    "profile.status": "Stato",
    "profile.close": "Chiudi",
    "settings.logout": "Disconnettiti",
    "settings.logoutConfirmation": "Sei sicuro di volerti disconnettere?",
    "leaderboard.monthlyPoints": "Punti mensili",
    "leaderboard.totalXP": "XP totali",
    "leaderboard.you": "TU",
    "landing.nav.features": "Funzionalità",
    "landing.nav.about": "Chi siamo",
    "landing.nav.contact": "Contatti",
    "landing.hero.welcome": "Benvenuto su",
    "landing.hero.subtitle": "La piattaforma definitiva per imparare la geografia,",
    "landing.hero.subtitleHighlight": "gratuitamente e senza pubblicità",
    "landing.hero.startAdventure": "Inizia l'avventura",
    "landing.hero.login": "Accedi",
    "landing.features.free.title": "100% Gratuito",
    "landing.features.free.desc": "Nessun abbonamento, nessuna pubblicità, nessun pop-up. La geografia deve essere accessibile a tutti.",
    "landing.features.community.title": "Creato dalla community",
    "landing.features.community.desc": "Crea i tuoi quiz e condividili con la community. Tutti possono contribuire.",
    "landing.features.progress.title": "Progressi e Sfide",
    "landing.features.progress.desc": "Guadagna esperienza, sblocca badge e sfida i tuoi amici a duello.",
    "landing.about.title": "Chi siamo?",
    "landing.about.intro": "Siamo due studenti di informatica che hanno deciso di unire le competenze di programmazione di uno con la passione per la geografia dell'altro.",
    "landing.about.mission": "La nostra Missione",
    "landing.about.missionText": "Abbiamo creato questo sito perché le piattaforme attuali non permettono di fare tutto ciò che si vuole senza pagare un abbonamento. La nostra visione è semplice: la geografia deve essere accessibile a tutti e GRATUITAMENTE.",
    "landing.about.goal": "Obiettivo Principale",
    "landing.about.goalText": "Attraverso questo sito, vogliamo dare a chiunque la possibilità di imparare la geografia senza vincoli di abbonamento, pubblicità o altri pop-up intrusivi.",
    "landing.about.offers": "Cosa offriamo",
    "landing.about.offer1": "Quiz vari: Bandiere, capitali, mappe, confini e molto altro",
    "landing.about.offer2": "Creazione di quiz: Crea i tuoi quiz e condividili con la community",
    "landing.about.offer3": "Sfide multiplayer: Affronta i tuoi amici a duello o scala la classifica",
    "landing.about.offer4": "Sistema di progressione: Livelli, XP, badge e titoli esclusivi",
    "landing.about.offer5": "Funzionalità sociali: Chat in tempo reale e sistema di amici",
    "landing.about.joinTitle": "Unisciti all'avventura",
    "landing.about.joinText": "Che tu sia un appassionato di geografia o semplicemente curioso di imparare, TerraCoast ti offre un ambiente stimolante per sviluppare le tue conoscenze divertendoti.",
    "landing.stats.free": "Gratuito",
    "landing.stats.ads": "Pubblicità",
    "landing.stats.quizzes": "Quiz disponibili",
    "landing.stats.available": "Disponibile",
    "landing.cta.ready": "Pronto a iniziare?",
    "landing.cta.createAccount": "Crea il mio account gratuitamente",
    "landing.footer.tagline": "Fatto con passione per rendere la geografia accessibile a tutti",
    "landing.footer.legal": "Note legali",
    "landing.footer.privacy": "Informativa sulla privacy",
    "landing.footer.terms": "Condizioni d'uso",
    "landing.footer.contact": "Contatti",
    "landing.footer.social": "Community",
    "banned.permanentTitle": "Account Disattivato",
    "banned.temporaryTitle": "Account Temporaneamente Sospeso",
    "banned.permanentMessage": "Il tuo account è stato bannato permanentemente e non può più essere utilizzato.",
    "banned.timeRemaining": "Il tuo account sarà riattivato tra:",
    "banned.endDate": "Data di fine:",
    "banned.reason": "Motivo:",
    "banned.suspensionReason": "Motivo della sospensione:",
    "banned.autoReconnect": "Potrai riconnetterti automaticamente una volta revocata la sospensione.",
    "banned.signOut": "Disconnettiti",
    "banned.day": "giorno",
    "banned.days": "giorni",
    "banned.hour": "ora",
    "banned.hours": "ore",
    "banned.minute": "minuto",
    "banned.minutes": "minuti",
    "banned.and": "e",
    "auth.username": "Nome utente",
    "auth.hasAccount": "Hai già un account?",
    "auth.emailPlaceholder": "tua@email.com",
    "auth.passwordPlaceholder": "••••••••",
    "auth.usernamePlaceholder": "IlTuoNome",
    "auth.connectionError": "Errore di connessione",
    "auth.passwordMismatch": "Le password non corrispondono",
    "auth.registrationError": "Errore di registrazione",
    "auth.pseudoPlaceholder": "Il tuo nome utente",
    "auth.passwordMinLength": "Minimo 6 caratteri",
    "auth.passwordTooShort": "La password deve contenere almeno 6 caratteri",
    "auth.pseudoTooShort": "Il nome utente deve contenere almeno 3 caratteri",
    "auth.emailAlreadyUsed": "Questa email è già in uso",
    "auth.pseudoAlreadyTaken": "Questo nome utente è già in uso",
    "auth.acceptTerms": "Accetto le condizioni d'uso",
    "auth.acceptPrivacy": "Accetto l'informativa sulla privacy",
    "auth.mustAcceptTerms": "Devi accettare le condizioni d'uso e l'informativa sulla privacy",
    "auth.readTerms": "Leggi le condizioni d'uso",
    "auth.readPrivacy": "Leggi l'informativa sulla privacy",
    "legal.title.terms": "Condizioni d'uso",
    "legal.title.privacy": "Informativa sulla privacy",
    "legal.terms.acceptance": "Accettazione delle condizioni",
    "legal.terms.acceptanceText": "Utilizzando TerraCoast, accetti le presenti condizioni d'uso.",
    "legal.terms.useOfService": "Utilizzo del servizio",
    "legal.terms.useOfServiceText": "TerraCoast è una piattaforma gratuita per l'apprendimento della geografia. Ti impegni a utilizzare il servizio in modo responsabile.",
    "legal.terms.userContent": "Contenuto dell'utente",
    "legal.terms.userContentText": "Creando dei quiz, concedi a TerraCoast il diritto di pubblicarli sulla piattaforma. Rimani il proprietario dei tuoi contenuti.",
    "legal.terms.behavior": "Comportamento",
    "legal.terms.behaviorText": "Qualsiasi comportamento inappropriato (spam, molestie, contenuti illegali) comporterà la sospensione o l'eliminazione del tuo account.",
    "legal.terms.lastUpdated": "Ultimo aggiornamento: 17 novembre 2025",
    "legal.terms.fullText": `Benvenuto su TerraCoast, un sito di quiz dedicato alla geografia. L'accesso e l'utilizzo del sito implicano l'accettazione piena delle presenti Condizioni d'uso. Se non accetti queste condizioni, sei invitato a non utilizzare il servizio.

1. Oggetto del servizio
TerraCoast permette agli utenti di:
- Creare un account per accedere ai quiz di geografia.
- Partecipare alle classifiche e ottenere punteggi.
- Utilizzare un sistema di chat privata per comunicare con altri utenti.

2. Creazione dell'account e dati raccolti
Durante la registrazione vengono raccolti i seguenti dati:
- Nome utente
- Indirizzo email
- Password
Gli utenti si impegnano a fornire informazioni corrette e ad aggiornarle in caso di modifica.

3. Protezione e conservazione dei dati
- I dati personali sono ospitati esclusivamente in Europa.
- Le informazioni di accesso sono protette e le password sono cifrate.
- I messaggi scambiati tramite chat sono privati e cifrati in modo da non essere leggibili da terzi.
Nessun dato verrà venduto o trasmesso a terzi senza consenso, salvo obbligo di legge.

4. Utilizzo del sito e comportamento degli utenti
L'utente si impegna a:
- Non tentare di accedere agli account di altri utenti.
- Non diffondere contenuti offensivi, discriminatori, violenti, illegali o inappropriati.
- Rispettare gli altri membri e lo spirito educativo del sito.
Il mancato rispetto di queste regole può comportare la sospensione o la cancellazione definitiva dell'account.

5. Responsabilità
- TerraCoast fa tutto il possibile per garantire un servizio stabile e sicuro, ma non può garantire una disponibilità permanente del sito.
- TerraCoast non è responsabile per perdite di dati, problemi di rete o comportamenti degli utenti nella chat.

6. Proprietà intellettuale
I contenuti del sito (testi, elementi visivi, quiz, logo, nome TerraCoast, ecc.) sono protetti dal diritto di proprietà intellettuale. Qualsiasi riproduzione, rappresentazione o diffusione senza autorizzazione è vietata.

7. Cancellazione dell'account e diritto all'oblio
Gli utenti possono richiedere la cancellazione del proprio account e dei propri dati in qualsiasi momento al seguente indirizzo:
helpdesk@terracoast.ch

8. Modifica delle condizioni
TerraCoast si riserva il diritto di modificare le presenti Condizioni d'uso in qualsiasi momento. Gli utenti saranno informati in caso di cambiamento importante.

9. Contatto
Per qualsiasi domanda relativa all'utilizzo del servizio o ai dati personali:
helpdesk@terracoast.ch`,
    "legal.privacy.dataCollection": "Raccolta dei dati",
    "legal.privacy.dataCollectionText": "TerraCoast raccoglie solo i dati necessari per il funzionamento del servizio: indirizzo email, nome utente e statistiche di gioco.",
    "legal.privacy.dataUse": "Utilizzo dei dati",
    "legal.privacy.dataUseText": "I tuoi dati vengono utilizzati esclusivamente per migliorare la tua esperienza sulla piattaforma. Non vendiamo né condividiamo i tuoi dati con terze parti.",
    "legal.privacy.cookies": "Cookie",
    "legal.privacy.cookiesText": "Il sito utilizza cookie essenziali per garantire il suo corretto funzionamento e la tua autenticazione.",
    "legal.privacy.rights": "I tuoi diritti",
    "legal.privacy.rightsText": "Hai il diritto di accedere, rettificare ed eliminare i tuoi dati personali.",
    "legal.privacy.lastUpdated": "Data di aggiornamento: 15 novembre 2025",
    "legal.privacy.fullText": `La presente Informativa sulla Privacy ha lo scopo di informare gli utenti del sito TerraCoast (di seguito “il Sito”) su come i loro dati personali vengono raccolti, utilizzati, protetti e, se necessario, condivisi.

TerraCoast attribuisce grande importanza al rispetto della privacy e si impegna ad adottare tutte le misure necessarie per garantire la protezione dei dati personali degli utenti.

1. Dati raccolti
Durante la registrazione e l'utilizzo del Sito, TerraCoast raccoglie solo i dati necessari al corretto funzionamento della piattaforma:
- Nome utente: identificazione nel gioco e nella chat (obbligatorio)
- Indirizzo email: gestione account e recupero password (obbligatorio)
- Password: accesso sicuro all'account (obbligatorio)
- Messaggi della chat: comunicazione privata tra utenti (facoltativo)
Non vengono raccolti dati sensibili.

2. Utilizzo dei dati
I dati raccolti vengono utilizzati per:
- Creazione, gestione e sicurezza dell'account utente
- Accesso ai quiz e alle funzionalità del Sito
- Utilizzo della chat privata tra utenti
- Contatto con gli utenti in caso di necessità (assistenza, notifiche, sicurezza)
Nessun dato viene venduto, noleggiato o condiviso per finalità commerciali.

3. Localizzazione e conformità dello storage
Tutti i dati raccolti sono ospitati e trattati in Europa, in paesi che seguono le convenzioni dell'Unione Europea in materia di protezione dei dati e offrono un livello di protezione adeguato.

4. Sicurezza dei dati
TerraCoast adotta misure tecniche e organizzative per proteggere i dati contro:
- Accesso non autorizzato
- Perdita o distruzione accidentale
- Modifica o divulgazione illecita
Le conversazioni in chat sono cifrate e strettamente private.
Le password sono archiviate in forma cifrata e mai in chiaro.

5. Durata della conservazione
- I dati vengono conservati finché l'account è attivo.
- In caso di cancellazione dell'account, tutti i dati vengono eliminati entro un massimo di 30 giorni.

6. Diritti degli utenti
Secondo la normativa applicabile, ogni utente dispone dei seguenti diritti:
- Accesso
- Rettifica
- Cancellazione
- Limitazione del trattamento
- Opposizione
- Portabilità dei dati
Ogni richiesta può essere inviata a: helpdesk@terracoast.ch
Una risposta sarà fornita entro un massimo di 30 giorni.

7. Cookie
TerraCoast utilizza esclusivamente cookie tecnici necessari al funzionamento del Sito (accesso, mantenimento sessione).
Non vengono utilizzati cookie pubblicitari o di tracciamento esterno.

8. Modifica dell'Informativa sulla Privacy
TerraCoast si riserva il diritto di modificare la presente Informativa sulla Privacy in qualsiasi momento.
In caso di modifiche importanti, gli utenti saranno informati tramite notifica o email.

9. Contatto
Per qualsiasi domanda relativa alla protezione dei dati personali:
helpdesk@terracoast.ch`,
    "forceUsername.title": "Cambio Nome Utente Richiesto",
    "forceUsername.subtitle": "Devi scegliere un nuovo nome utente per continuare",
    "forceUsername.flaggedTitle": "Il tuo nome utente attuale è stato segnalato",
    "forceUsername.flaggedDesc": "Un amministratore richiede che tu scelga un nuovo nome utente appropriato.",
    "forceUsername.currentPseudo": "Nome Utente Attuale",
    "forceUsername.newPseudo": "Nuovo Nome Utente",
    "forceUsername.placeholder": "Inserisci il tuo nuovo nome utente",
    "forceUsername.rules": "3-20 caratteri, solo lettere, numeri, trattini bassi e spazi",
    "forceUsername.confirm": "Conferma Nuovo Nome Utente",
    "forceUsername.updating": "Aggiornamento in corso...",
    "forceUsername.notice": "Non potrai accedere all'applicazione finché non avrai scelto un nuovo nome utente appropriato.",
    "forceUsername.errorEmpty": "Per favore, inserisci un nuovo nome utente",
    "forceUsername.errorLength": "Il nome utente deve contenere tra 3 e 20 caratteri",
    "forceUsername.errorInvalid": "Il nome utente può contenere solo lettere, numeri, trattini bassi e spazi",
    "forceUsername.errorTaken": "Questo nome utente è già in uso",
    "forceUsername.errorUpdate": "Errore durante l'aggiornamento del nome utente",
    "forceUsername.errorGeneric": "Si è verificato un errore",
    "settings.twoFactorConfirmActivation": "Connetti",
  },
  pt: {
    "app.title": "TerraCoast",
    "nav.home": "Início",
    "nav.quizzes": "Questionários",
    "nav.leaderboard": "Classificação",
    "nav.friends": "Amigos",
    "nav.duels": "Duelos",
    "nav.chat": "Chat",
    "nav.profile": "Perfil",
    "nav.settings": "Configurações",
    "nav.admin": "Admin",
    "nav.logout": "Sair",
    "auth.login": "Entrar",
    "auth.register": "Registar",
    "auth.email": "Email",
    "auth.password": "Senha",
    "auth.pseudo": "Nome de usuário",
    "auth.confirmPassword": "Confirmar senha",
    "auth.alreadyAccount": "Já tem uma conta?",
    "auth.noAccount": "Não tem conta?",
    "auth.signIn": "Entrar",
    "auth.signUp": "Registar",
    "quiz.create": "Criar questionário",
    "quiz.edit": "Editar",
    "quiz.delete": "Eliminar",
    "quiz.play": "Jogar",
    "quiz.share": "Compartilhar",
    "quiz.publish": "Publicar",
    "quiz.title": "Título",
    "quiz.description": "Descrição",
    "quiz.category": "Categoria",
    "quiz.difficulty": "Dificuldade",
    "quiz.language": "Idioma",
    "quiz.questions": "Perguntas",
    "quiz.submit": "Enviar",
    "quiz.next": "Próximo",
    "quiz.finish": "Finalizar",
    "quiz.replay": "Jogar novamente",
    "quiz.explore": "Explorar outros questionários",
    "quiz.myQuizzes": "Meus questionários",
    "quiz.publicQuizzes": "Questionários públicos",
    "quiz.sharedQuizzes": "Questionários compartilhados",
    "quiz.noQuizzes": "Nenhum questionário disponível",
    "quiz.backToList": "Voltar à lista",
    "settings.language": "Idioma",
    "settings.showAllLanguages":
      "Mostrar todos os questionários (todos os idiomas)",
    "settings.showOnlyMyLanguage": "Mostrar apenas questionários no meu idioma",
    "settings.accountSettings": "Configurações da conta",
    "settings.backToProfile": "Voltar ao perfil",
    "common.save": "Guardar",
    "common.cancel": "Cancelar",
    "common.loading": "Carregando...",
    "common.error": "Erro",
    "common.success": "Sucesso",
    "common.back": "Voltar",
    "common.close": "Fechar",
    "common.confirm": "Confirmar",
    "common.all": "Todos",
    "common.search": "Pesquisar",
    "profile.level": "Nível",
    "profile.xp": "XP",
    "profile.badges": "Distintivos",
    "profile.statistics": "Estatísticas",
    "leaderboard.monthly": "Classificação mensal",
    "leaderboard.rank": "Posição",
    "friends.addFriend": "Adicionar amigo",
    "friends.pending": "Pendente",
    "friends.myFriends": "Meus amigos",
    "chat.noMessages": "Sem mensagens",
    "chat.typeMessage": "Digite sua mensagem...",
    "chat.send": "Enviar",
    "home.welcome": "Bem-vindo",
    "home.readyToTest": "Pronto para testar seus conhecimentos de geografia?",
    "home.accountBanned": "Conta banida",
    "home.temporaryBanUntil": "Sua conta está temporariamente banida até",
    "home.permanentBan": "Sua conta está permanentemente banida",
    "home.reason": "Motivo",
    "home.notSpecified": "Não especificado",
    "home.warningsReceived": "Avisos recebidos",
    "home.warning": "Aviso",
    "home.note": "Nota",
    "home.respectRules":
      "Por favor respeite as regras da comunidade para evitar mais sanções",
    "home.gamesPlayed": "Jogos realizados",
    "home.totalSessions": "Sessões totais",
    "home.currentStreak": "Sequência atual",
    "home.record": "Recorde",
    "home.dailyPoints": "Pontos diários",
    "home.pts": "pts",
    "home.quickActions": "Ações rápidas",
    "home.exploreQuizzes": "Explorar questionários",
    "home.discoverNewChallenges": "Descubra novos desafios",
    "home.shareKnowledge": "Compartilhe seu conhecimento",
    "home.trainingMode": "Modo treino",
    "home.noTimeLimit": "Sem limite de tempo",
    "home.challengeFriend": "Desafiar um amigo",
    "home.realTimeDuel": "Duelo em tempo real",
    "home.trendingQuizzes": "Questionários populares",
    "home.newAndPopular": "Novo e popular",
    "home.new": "NOVO",
    "home.games": "jogos",
    "home.thisWeek": "esta semana",
    "home.easy": "Fácil",
    "home.medium": "Médio",
    "home.hard": "Difícil",
    "common.day": "dia",
    "common.days": "dias",
    "quizzes.title": "Questionários de geografia",
    "quizzes.subtitle": "Explore e jogue questionários criados pela comunidade",
    "quizzes.searchPlaceholder": "Pesquisar um questionário...",
    "quizzes.allCategories": "Todas as categorias",
    "quizzes.allDifficulties": "Todas as dificuldades",
    "quizzes.allTypes": "Todos os tipos",
    "quizzes.category.flags": "Bandeiras",
    "quizzes.category.capitals": "Capitais",
    "quizzes.category.maps": "Mapas",
    "quizzes.category.borders": "Fronteiras",
    "quizzes.category.regions": "Regiões",
    "quizzes.category.mixed": "Misto",
    "quizzes.difficulty.easy": "Fácil",
    "quizzes.difficulty.medium": "Médio",
    "quizzes.difficulty.hard": "Difícil",
    "quizzes.global": "Global",
    "quizzes.games": "jogos",
    "quizzes.average": "Média",
    "quizzes.trainingMode": "Modo treino",
    "quizzes.shareWithFriends": "Compartilhar com amigos",
    "quizzes.publishDirectly": "Publicar diretamente",
    "quizzes.requestPublish": "Solicitar publicação",
    "quizzes.removeFromList": "Remover da minha lista",
    "quizzes.noQuizFound": "Nenhum questionário encontrado",
    "quizzes.noQuizCreated": "Você ainda não criou nenhum questionário",
    "quizzes.noQuizShared": "Nenhum questionário compartilhado com você",
    "quizzes.tryDifferentFilters": "Tente mudar seus filtros",
    "quizzes.confirmPublishRequest": 'Solicitar publicação de "{title}"?',
    "quizzes.publishRequestError": "Erro durante a solicitação",
    "quizzes.publishRequestSuccess":
      "Solicitação enviada! Um administrador validará seu questionário.",
    "quizzes.publishError": "Erro durante a publicação",
    "quizzes.publishSuccess": "Questionário publicado com sucesso!",
    "quizzes.confirmRemoveShared":
      "Deseja remover este questionário da sua lista compartilhada?",
    "quizzes.removeSuccess": "Questionário removido com sucesso da sua lista!",
    "quizzes.removeError": "Erro durante a exclusão",
    "quizzes.confirmDelete":
      'Tem certeza de que deseja excluir o questionário "{title}"? Esta ação é irreversível.',
    "quizzes.deleteSuccess": "Questionário excluído com sucesso!",
    "quizzes.deleteError": "Erro ao excluir o questionário",
    "quizzes.deleteQuestionsError": "Erro ao excluir as perguntas",
    "quizzes.deleteQuiz": "Excluir questionário",
    "leaderboard.title": "Classificação",
    "leaderboard.subtitle": "Os melhores jogadores do TerraCoast",
    "leaderboard.global": "Classificação global",
    "leaderboard.friends": "Entre amigos",
    "leaderboard.thisMonth": "Este mês",
    "leaderboard.allTime": "De todos os tempos",
    "leaderboard.monthlyReset":
      "As pontuações são redefinidas todo mês. Os 10 melhores recebem um título!",
    "leaderboard.loading": "Carregando classificação...",
    "leaderboard.noPlayers": "Sem jogadores",
    "leaderboard.emptyLeaderboard": "A classificação está vazia por enquanto",
    "leaderboard.game": "jogo",
    "leaderboard.games": "jogos",
    "leaderboard.thisMonthShort": "este mês",
    "leaderboard.top10": "Top 10",
    "leaderboard.totalPoints": "pontos totais",
    "friends.title": "Amigos",
    "friends.subtitle": "Gerencie seus amigos e converse juntos",
    "friends.pendingRequests": "Solicitações pendentes",
    "friends.accept": "Aceitar",
    "friends.reject": "Rejeitar",
    "friends.suggestions": "Sugestões de amigos",
    "friends.add": "Adicionar",
    "friends.searchTitle": "Pesquisar amigos",
    "friends.searchPlaceholder": "Pesquisar por nome de usuário...",
    "friends.myFriendsTitle": "Meus amigos",
    "friends.noFriends": "Você ainda não tem amigos",
    "friends.sendMessage": "Enviar mensagem",
    "friends.removeFriend": "Remover dos amigos",
    "friends.requestSent": "Solicitação enviada!",
    "friends.confirmRemove": "Deseja realmente remover {name} dos seus amigos?",
    "duels.title": "Duelos",
    "duels.subtitle": "Desafie seus amigos em tempo real",
    "duels.createDuel": "Criar um duelo",
    "duels.activeDuels": "Duelos ativos",
    "duels.invitations": "Convites",
    "duels.history": "Histórico",
    "duels.noActiveDuels": "Sem duelos ativos",
    "duels.createOrAccept": "Crie um duelo ou aceite um convite",
    "duels.vs": "vs",
    "duels.youPlayed": "Você jogou",
    "duels.waiting": "Aguardando",
    "duels.hasPlayed": "jogou",
    "duels.hasNotPlayed": "não jogou",
    "duels.alreadyPlayed": "Já jogou",
    "duels.receivedInvitations": "Convites recebidos",
    "duels.challengesYou": "desafia você!",
    "duels.sentInvitations": "Convites enviados",
    "duels.invitationTo": "Convite para",
    "duels.noInvitations": "Sem convites",
    "duels.createToChallenge": "Crie um duelo para desafiar seus amigos",
    "duels.noCompletedDuels": "Sem duelos concluídos",
    "duels.historyAppears": "Seu histórico de duelos aparecerá aqui",
    "duels.victory": "Vitória",
    "duels.defeat": "Derrota",
    "duels.draw": "Empate",
    "duels.inProgress": "Em andamento",
    "duels.winner": "Vencedor",
    "duels.you": "Você",
    "duels.opponent": "Oponente",
    "duels.score": "Pontuação",
    "duels.accuracy": "Precisão",
    "duels.rate": "Taxa",
    "duels.gap": "Diferença",
    "duels.yourScore": "Sua pontuação",
    "duels.chooseFriend": "Escolha um amigo",
    "duels.selectFriend": "Selecione um amigo",
    "duels.chooseQuiz": "Escolha um questionário",
    "duels.selectQuiz": "Selecione um questionário",
    "duels.sending": "Enviando...",
    "chat.backToQuizzes": "Voltar aos questionários",
    "chat.messages": "Mensagens",
    "chat.noFriends": "Sem amigos",
    "chat.user": "Usuário",
    "chat.deletedUser": "Usuário excluído",
    "chat.selectFriend": "Selecione um amigo para começar a conversar",
    "training.title": "Modo treino",
    "training.subtitle": "Pratique sem limite de tempo e sem ganhar XP",
    "training.features": "Recursos do modo treino",
    "training.feature1": "Sem limite de tempo - tome seu tempo para pensar",
    "training.feature2": "Sem ganho de XP - apenas para praticar",
    "training.feature3": "Escolha o número de perguntas",
    "training.feature4": "Validação imediata com explicações",
    "training.step1": "1. Escolha um questionário",
    "training.step2": "2. Número de perguntas",
    "training.searchQuiz": "Pesquisar um questionário...",
    "training.games": "jogos",
    "training.questions": "perguntas",
    "training.max": "máx",
    "training.start": "Iniciar treino",
    "share.title": "Compartilhar questionário",
    "share.success": "Questionário compartilhado!",
    "share.successMessage": "Seus amigos agora podem acessá-lo",
    "share.shareWith": 'Compartilhe "{title}" com seus amigos',
    "share.sharing": "Compartilhando...",
    "profile.friendRequestError": "Erro ao enviar solicitação de amizade",
    "profile.friendRequestSent": "Solicitação de amizade enviada!",
    "profile.reportError": "Erro ao enviar denúncia",
    "profile.reportSuccess": "Denúncia enviada com sucesso",
    "profile.addFriend": "Adicionar amigo",
    "profile.requestSent": "Solicitação enviada",
    "profile.friend": "Amigo",
    "profile.history": "Histórico",
    "profile.report": "Denunciar",
    "profile.gamesPlayed": "Jogos realizados",
    "profile.successRate": "Taxa de sucesso",
    "profile.titles": "Títulos",
    "profile.active": "Ativo",
    "profile.noTitles": "Nenhum título obtido",
    "profile.last7Days": "Pontos dos últimos 7 dias",
    "profile.total": "Total",
    "profile.noGamesThisWeek": "Nenhum jogo realizado esta semana",
    "profile.noBadges": "Nenhum distintivo obtido",
    "profile.recentGames": "Jogos recentes",
    "profile.score": "Pontuação",
    "profile.accuracy": "Precisão",
    "profile.noGames": "Nenhum jogo realizado",
    "profile.reportUser": "Denunciar {user}",
    "profile.reportDescription":
      "Descreva o motivo da sua denúncia. Um administrador revisará sua solicitação.",
    "profile.reportReason": "Motivo da denúncia...",
    "profile.sending": "Enviando...",
    "profile.warningHistory": "Histórico de avisos",
    "profile.noWarnings": "Nenhum aviso encontrado",
    "profile.reportedBy": "Denunciado por",
    "profile.unknown": "Desconhecido",
    "profile.adminNotes": "Notas do administrador",
    "profile.tempBanUntil": "Banimento temporário até",
    "settings.pseudoRequired": "O nome de usuário não pode estar vazio",
    "settings.pseudoUpdateError": "Erro ao atualizar nome de usuário",
    "settings.pseudoUpdateSuccess": "Nome de usuário atualizado com sucesso",
    "settings.emailPasswordRequired": "Email e senha atual obrigatórios",
    "settings.incorrectPassword": "Senha incorreta",
    "settings.emailUpdateError": "Erro ao atualizar email",
    "settings.emailConfirmationSent":
      "Um email de confirmação foi enviado para seu novo endereço",
    "settings.supabaseChangeRequiresEmailConfirmation":
      "Para algumas alterações sensíveis (email, segurança), o Supabase envia um email de confirmação.",
    "settings.allFieldsRequired": "Todos os campos são obrigatórios",
    "settings.passwordsMismatch": "As senhas não coincidem",
    "settings.passwordTooShort": "A senha deve ter pelo menos 6 caracteres",
    "settings.currentPasswordIncorrect": "Senha atual incorreta",
    "settings.passwordUpdateError": "Erro ao atualizar senha",
    "settings.passwordUpdateSuccess": "Senha atualizada com sucesso",
    "settings.deleteConfirmation":
      'Esta ação é irreversível. Digite "EXCLUIR" para confirmar:',
    "settings.deleteKeyword": "EXCLUIR",
    "settings.deleteAccountError": "Erro ao excluir conta",
    "settings.manageInfo": "Gerencie suas informações pessoais",
    "settings.languagePreferences": "Idioma e preferências",
    "settings.interfaceLanguage": "Idioma da interface",
    "settings.showAllLanguagesDescription":
      "Mostrar todos os questionários em todos os idiomas (caso contrário, apenas questionários no meu idioma)",
    "settings.username": "Nome de usuário",
    "settings.newUsername": "Novo nome de usuário",
    "settings.yourUsername": "Seu nome de usuário",
    "settings.updateUsername": "Atualizar nome de usuário",
    "settings.emailAddress": "Endereço de email",
    "settings.newEmail": "Novo endereço de email",
    "settings.newEmailPlaceholder": "novo@email.com",
    "settings.currentPassword": "Senha atual",
    "settings.updateEmail": "Atualizar email",
    "settings.password": "Senha",
    "settings.newPassword": "Nova senha",
    "settings.confirmNewPassword": "Confirmar nova senha",
    "settings.updatePassword": "Atualizar senha",
    "settings.dangerZone": "Zona de perigo",
    "settings.deleteWarning":
      "Excluir sua conta é irreversível. Todos os seus dados serão perdidos.",
    "settings.deleteAccount": "Excluir minha conta",
    "settings.currentPasswordRequired": "A senha atual é obrigatória",
    "settings.twoFactorTitle": "Autenticação de dois fatores (2FA)",
    "settings.twoFactorStatus": "Status",
    "settings.twoFactorEnabled": "Ativada",
    "settings.twoFactorDisabled": "Desativada",
    "settings.twoFactorStart": "Ativar 2FA",
    "settings.twoFactorStartError":
      "Não foi possível iniciar a autenticação de dois fatores.",
    "settings.twoFactorScanInstructions":
      "Escaneie o QR code com seu app autenticador e depois digite o código.",
    "settings.twoFactorBackupKey": "Chave de backup",
    "settings.twoFactorCodeLabel": "Código de verificação (6 dígitos)",
    "settings.twoFactorCodePlaceholder": "123456",
    "settings.twoFactorCodeRequired":
      "Digite o código de verificação de 6 dígitos.",
    "settings.twoFactorChallengeError":
      "Não foi possível gerar o desafio MFA.",
    "settings.twoFactorInvalidCode":
      "Código inválido. Verifique o código gerado e tente novamente.",
    "settings.twoFactorEnabledSuccess":
      "Autenticação de dois fatores ativada com sucesso.",
    "settings.twoFactorDisablePassword":
      "Confirme com sua senha atual",
    "settings.twoFactorDisableConfirm":
      "Desativar a autenticação de dois fatores?",
    "settings.twoFactorDisableButton": "Desativar 2FA",
    "settings.twoFactorDisableError":
      "Não foi possível desativar a autenticação de dois fatores.",
    "settings.twoFactorDisabledSuccess":
      "Autenticação de dois fatores desativada.",
    "settings.twoFactorNoActiveFactor":
      "Nenhum fator MFA ativo encontrado.",
    "imageDropzone.invalidType":
      "Por favor selecione uma imagem (JPG, PNG, GIF, WebP)",
    "imageDropzone.fileTooLarge": "A imagem não deve exceder 5 MB",
    "imageDropzone.uploadError": "Erro no upload",
    "imageDropzone.imageLabel": "Imagem (URL)",
    "imageDropzone.preview": "Visualização",
    "imageDropzone.uploading": "Enviando...",
    "imageDropzone.dragHere": "Arraste uma imagem aqui",
    "imageDropzone.orClickToSelect": "ou clique para selecionar",
    "imageDropzone.supportedFormats": "JPG, PNG, GIF, WebP (máx 5 MB)",
    "editQuiz.confirmDeleteQuestion": "Deseja realmente excluir esta pergunta?",
    "editQuiz.titleRequired": "O título não pode estar vazio",
    "editQuiz.atLeastOneQuestion": "Adicione pelo menos uma pergunta",
    "editQuiz.updateSuccess": "Questionário atualizado com sucesso!",
    "editQuiz.updateError": "Erro ao atualizar questionário",
    "editQuiz.loadingQuiz": "Carregando questionário...",
    "editQuiz.backToQuizzes": "Voltar aos questionários",
    "editQuiz.title": "Editar questionário",
    "editQuiz.subtitle": "Edite seu questionário de geografia",
    "editQuiz.quizInfo": "Informações do questionário",
    "editQuiz.quizTitle": "Título do questionário",
    "editQuiz.titlePlaceholder": "Ex: Capitais europeias",
    "editQuiz.description": "Descrição",
    "editQuiz.descriptionPlaceholder": "Descreva seu questionário...",
    "editQuiz.coverImage": "Imagem de capa",
    "editQuiz.language": "Idioma",
    "editQuiz.category": "Categoria",
    "editQuiz.difficulty": "Dificuldade",
    "editQuiz.timePerQuestion": "Tempo por pergunta (seg)",
    "editQuiz.questions": "Perguntas",
    "editQuiz.addQuestion": "Adicionar pergunta",
    "editQuiz.question": "Pergunta",
    "editQuiz.questionImageOptional": "Imagem da pergunta (opcional)",
    "editQuiz.questionType.label": "Tipo de pergunta",
    "editQuiz.questionType.mcq": "Múltipla escolha",
    "editQuiz.questionType.single_answer": "Resposta única",
    "editQuiz.questionType.text_free": "Texto livre",
    "editQuiz.questionType.map_click": "Clique no mapa",
    "editQuiz.points": "Pontos",
    "editQuiz.options": "Opções",
    "editQuiz.option": "Opção",
    "editQuiz.imageForOption": 'Imagem para "{option}" (opcional)',
    "editQuiz.correctAnswer": "Resposta correta",
    "editQuiz.select": "Selecionar",
    "editQuiz.imageIncluded": "Imagem incluída",
    "editQuiz.saving": "Guardando...",
    "editQuiz.saveChanges": "Guardar alterações",
    "editQuiz.questionType.true_false": "Verdadeiro/Falso",
    "editQuiz.deleteQuestionSuccess": "Pergunta excluída com sucesso!",
    "editQuiz.deleteQuestionError": "Erro ao excluir pergunta",
    "createQuiz.title": "Criar questionário",
    "createQuiz.subtitle": "Crie seu próprio questionário de geografia",
    "createQuiz.quizType": "Tipo de questionário",
    "createQuiz.noType": "Sem tipo",
    "createQuiz.randomizeQuestions": "Embaralhar ordem das perguntas",
    "createQuiz.randomizeAnswers":
      "Embaralhar ordem das respostas (Múltipla escolha)",
    "createQuiz.publicQuizAdmin":
      "Questionário público - Como admin, será um questionário global aprovado imediatamente",
    "createQuiz.submitValidation":
      "Enviar para validação ({count}/10 questionários publicados)",
    "createQuiz.addQuestion": "Adicionar pergunta",
    "createQuiz.questionPlaceholder": "Ex: Qual é a capital da França?",
    "createQuiz.questionImageDesc":
      "Adicione uma imagem para ilustrar sua pergunta",
    "createQuiz.trueFalse.type": "Verdadeiro / Falso",
    "createQuiz.trueFalse.description":
      "Para perguntas Verdadeiro/Falso, as opções são definidas automaticamente. Apenas selecione a resposta correta abaixo.",
    "createQuiz.trueFalse.true": "Verdadeiro",
    "createQuiz.trueFalse.false": "Falso",
    "createQuiz.optionsMinTwo": "Opções (mínimo 2)",
    "createQuiz.optionImageDesc":
      "Adicione imagens para cada opção (ex: bandeiras). Perfeito para questionários visuais!",
    "createQuiz.multipleCorrect":
      "Selecione uma ou mais respostas corretas (ex: Capitais da África do Sul)",
    "createQuiz.answerPlaceholder": "Ex: Paris",
    "createQuiz.variants": "Variantes aceitas (opcional)",
    "createQuiz.variantPlaceholder": "Variante {number} (ex: paris, PARIS)",
    "createQuiz.addVariant": "Adicionar variante",
    "createQuiz.variantsDesc":
      'Adicione múltiplas variantes aceitas (ex: "Paris", "paris", "A capital da França")',
    "createQuiz.editingQuestion": "Editando pergunta #{number}",
    "createQuiz.updateQuestion": "Atualizar",
    "createQuiz.addThisQuestion": "Adicionar esta pergunta",
    "createQuiz.questionsAdded": "Perguntas adicionadas",
    "createQuiz.answer": "Resposta",
    "createQuiz.saveQuiz": "Guardar questionário",
    "createQuiz.success": "Questionário criado com sucesso!",
    "createQuiz.errors.questionEmpty": "A pergunta não pode estar vazia",
    "createQuiz.errors.answerEmpty": "A resposta correta não pode estar vazia",
    "createQuiz.errors.minTwoOptions":
      "Pelo menos 2 opções necessárias para múltipla escolha",
    "createQuiz.errors.answerMustBeOption":
      "A resposta correta deve ser uma das opções",
    "createQuiz.errors.maxQuizReached":
      "Você atingiu o limite de 10 questionários públicos",
    "createQuiz.errors.createError": "Erro ao criar questionário",
    "playQuiz.selectAnswer": "Por favor selecione ou digite uma resposta",
    "playQuiz.loadingQuiz": "Carregando questionário...",
    "playQuiz.trainingComplete": "Treino concluído!",
    "playQuiz.quizComplete": "Questionário concluído!",
    "playQuiz.trainingMessage": "Bom trabalho! Continue praticando",
    "playQuiz.congratsMessage": "Parabéns por completar este questionário",
    "playQuiz.totalScore": "Pontuação total",
    "playQuiz.xpGained": "XP ganho",
    "playQuiz.accuracy": "Precisão",
    "playQuiz.correctAnswers": "Respostas corretas",
    "playQuiz.summary": "Resumo",
    "playQuiz.yourAnswer": "Sua resposta",
    "playQuiz.noAnswer": "Sem resposta",
    "playQuiz.correctAnswer": "Resposta correta",
    "playQuiz.exploreOtherQuizzes": "Explorar outros questionários",
    "playQuiz.playAgain": "Jogar novamente",
    "playQuiz.confirmQuit":
      "Tem certeza de que deseja sair? Seu progresso será perdido.",
    "playQuiz.quit": "Sair",
    "playQuiz.trainingMode": "Modo treino",
    "playQuiz.question": "Pergunta",
    "playQuiz.questionImage": "Pergunta",
    "playQuiz.enterAnswer": "Digite sua resposta...",
    "playQuiz.mapClickComing": "Funcionalidade de clique no mapa em breve",
    "playQuiz.correct": "Correto!",
    "playQuiz.incorrect": "Incorreto",
    "playQuiz.correctAnswerWas": "A resposta correta era",
    "playQuiz.validate": "Validar",
    "playQuiz.variants": "Variantes",
    "playQuiz.acceptedVariants": "Variantes aceitas",
    "profile.toNextLevel": "para o próximo nível",
    "profile.you": "Você",
    "profile.yourTotal": "Seu total",
    "createQuiz.searchTags": "Etiquetas de pesquisa (Europa, Ásia...)",
    "createQuiz.addTagPlaceholder":
      "Adicione uma etiqueta e pressione Enter...",
    "createQuiz.maxTags": "Máximo 10 etiquetas",
    "notifications.newMessage": "Nova mensagem",
    "notifications.viewMessage": "Ver mensagem",
    "notifications.newFriendRequest": "Novo pedido de amizade",
    "notifications.wantsFriend": "quer ser seu amigo",
    "notifications.viewRequests": "Ver pedidos",
    "notifications.newDuel": "Novo duelo",
    "notifications.duelAccepted": "Duelo aceito",
    "notifications.victory": "🎉 Vitória",
    "notifications.defeat": "😔 Derrota",
    "notifications.draw": "🤝 Empate",
    "notifications.challengedYou": "te desafiou em",
    "notifications.acceptedDuel": "aceitou seu duelo em",
    "notifications.duelFinished": "Duelo terminado contra",
    "notifications.on": "em",
    "notifications.viewDuels": "Ver duelos",
    "notifications.toPlay": "Para jogar",
    "notifications.newResults": "Novos resultados",
    "nav.social": "Social",
    "profile.daysToBreakRecord": "Dias para bater seu recorde",
    "profile.keepGoing": "Continue assim, você consegue!",
    "common.clickForDetails": "Clique para mais detalhes",
    "createQuiz.complementIfWrongPlaceholder": "Texto exibido quando a resposta está incorreta",
    "createQuiz.complementIfWrong": "Complemento se a resposta estiver incorreta (opcional)",
    "playQuiz.nextQuestion": "Próxima pergunta",
    "playQuiz.explanation": "Explicação",
    "playQuiz.finishQuiz": "Terminar o quiz",
    "profile.back": "Voltar",
    "profile.games": "Partidas",
    "profile.settings": "Configurações",
    "profile.accountDetails": "Detalhes da conta",
    "profile.requestPending": "Solicitação enviada",
    "profile.friends": "Amigos",
    "profile.warnUser": "Avisar usuário",
    "profile.activateTitle": "Ativar",
    "profile.activeTitle": "Ativo",
    "profile.noGamesYet": "Nenhuma partida jogada",
    "profile.unknownQuiz": "Quiz desconhecido",
    "profile.questions": "Perguntas",
    "profile.time": "Tempo",
    "profile.completed": "Concluído",
    "profile.inProgress": "Em andamento",
    "profile.progressChart": "Gráfico de progresso",
    "profile.myProgress": "Meu progresso",
    "profile.user": "Usuário",
    "profile.clickPointInfo": "Clique em um ponto para ver os detalhes",
    "profile.streakDetails": "Detalhes da sequência",
    "profile.streakStartedOn": "Sequência iniciada em",
    "profile.currentStreak": "Sequência atual",
    "profile.longestStreak": "Melhor sequência",
    "profile.playTodayToKeepStreak": "Jogue hoje para manter sua sequência",
    "profile.dayDetails": "Detalhes do dia",
    "profile.date": "Data",
    "profile.myScore": "Minha pontuação",
    "profile.difference": "Diferença",
    "profile.warnReason": "Motivo do aviso...",
    "profile.sendWarning": "Enviar aviso",
    "profile.status": "Status",
    "profile.close": "Fechar",
    "duels.viewResults": "Ver os resultados",
    "settings.logout": "Sair",
    "settings.logoutConfirmation": "Tem certeza de que deseja sair?",
    "leaderboard.monthlyPoints": "Pontos mensais",
    "leaderboard.totalXP": "XP total",
    "leaderboard.you": "VOCÊ",
    "landing.nav.features": "Recursos",
    "landing.nav.about": "Sobre",
    "landing.nav.contact": "Contato",
    "landing.hero.welcome": "Bem-vindo ao",
    "landing.hero.subtitle": "A plataforma definitiva para aprender geografia,",
    "landing.hero.subtitleHighlight": "gratuitamente e sem anúncios",
    "landing.hero.startAdventure": "Começar a aventura",
    "landing.hero.login": "Entrar",
    "landing.features.free.title": "100% Gratuito",
    "landing.features.free.desc": "Sem assinaturas, sem anúncios, sem pop-ups. A geografia deve ser acessível a todos.",
    "landing.features.community.title": "Criado pela comunidade",
    "landing.features.community.desc": "Crie seus próprios quizzes e compartilhe-os com a comunidade. Todos podem contribuir.",
    "landing.features.progress.title": "Progressão e Desafios",
    "landing.features.progress.desc": "Ganhe experiência, desbloqueie emblemas e desafie seus amigos para duelos.",
    "landing.about.title": "Quem somos?",
    "landing.about.intro": "Somos dois estudantes de informática que decidiram combinar habilidades de desenvolvimento de um com a paixão por geografia do outro.",
    "landing.about.mission": "Nossa Missão",
    "landing.about.missionText": "Criamos este site porque as plataformas atuais não permitem que você faça tudo o que deseja sem pagar uma assinatura. Nossa visão é simples: a geografia deve ser acessível a todos e GRATUITAMENTE.",
    "landing.about.goal": "Objetivo Principal",
    "landing.about.goalText": "Através deste site, queremos dar a qualquer pessoa a oportunidade de aprender geografia sem restrições de assinatura, anúncios ou outros pop-ups intrusivos.",
    "landing.about.offers": "O que oferecemos",
    "landing.about.offer1": "Vários quizzes: Bandeiras, capitais, mapas, fronteiras e muito mais",
    "landing.about.offer2": "Criação de quizzes: Crie seus próprios quizzes e compartilhe-os com a comunidade",
    "landing.about.offer3": "Desafios multiplayer: Duele com seus amigos ou suba na tabela de classificação",
    "landing.about.offer4": "Sistema de progressão: Níveis, XP, emblemas e títulos exclusivos",
    "landing.about.offer5": "Recursos sociais: Bate-papo em tempo real e sistema de amigos",
    "landing.about.joinTitle": "Junte-se à aventura",
    "landing.about.joinText": "Seja você um entusiasta da geografia ou simplesmente curioso para aprender, o TerraCoast oferece um ambiente estimulante para desenvolver seus conhecimentos enquanto se diverte.",
    "landing.stats.free": "Gratuito",
    "landing.stats.ads": "Anúncios",
    "landing.stats.quizzes": "Quizzes disponíveis",
    "landing.stats.available": "Disponível",
    "landing.cta.ready": "Pronto para começar?",
    "landing.cta.createAccount": "Criar minha conta gratuitamente",
    "landing.footer.tagline": "Feito com paixão para tornar a geografia acessível a todos",
    "landing.footer.legal": "Avisos legais",
    "landing.footer.privacy": "Política de Privacidade",
    "landing.footer.terms": "Termos de Uso",
    "landing.footer.contact": "Contato",
    "landing.footer.social": "Comunidade",
    "banned.permanentTitle": "Conta Desativada",
    "banned.temporaryTitle": "Conta Temporariamente Suspensa",
    "banned.permanentMessage": "Sua conta foi banida permanentemente e não pode mais ser usada.",
    "banned.timeRemaining": "Sua conta será reativada em:",
    "banned.endDate": "Data de término:",
    "banned.reason": "Motivo:",
    "banned.suspensionReason": "Motivo da suspensão:",
    "banned.autoReconnect": "Você poderá se reconectar automaticamente assim que a suspensão for suspensa.",
    "banned.signOut": "Sair",
    "banned.day": "dia",
    "banned.days": "dias",
    "banned.hour": "hora",
    "banned.hours": "horas",
    "banned.minute": "minuto",
    "banned.minutes": "minutos",
    "banned.and": "e",
    "auth.username": "Nome de usuário",
    "auth.hasAccount": "Já tem uma conta?",
    "auth.emailPlaceholder": "seu@email.com",
    "auth.passwordPlaceholder": "••••••••",
    "auth.usernamePlaceholder": "SeuNome",
    "auth.connectionError": "Erro de conexão",
    "auth.passwordMismatch": "As senhas não coincidem",
    "auth.registrationError": "Erro de registro",
    "auth.pseudoPlaceholder": "Seu nome de usuário",
    "auth.passwordMinLength": "Mínimo de 6 caracteres",
    "auth.passwordTooShort": "A senha deve conter pelo menos 6 caracteres",
    "auth.pseudoTooShort": "O nome de usuário deve conter pelo menos 3 caracteres",
    "auth.emailAlreadyUsed": "Este email já está em uso",
    "auth.pseudoAlreadyTaken": "Este nome de usuário já está em uso",
    "auth.acceptTerms": "Eu aceito os termos de uso",
    "auth.acceptPrivacy": "Eu aceito a política de privacidade",
    "auth.mustAcceptTerms": "Você deve aceitar os termos de uso e a política de privacidade",
    "auth.readTerms": "Ler os termos de uso",
    "auth.readPrivacy": "Ler a política de privacidade",
    "legal.title.terms": "Termos de Uso",
    "legal.title.privacy": "Política de Privacidade",
    "legal.terms.acceptance": "Aceitação dos termos",
    "legal.terms.acceptanceText": "Ao usar o TerraCoast, você aceita estes termos de uso.",
    "legal.terms.useOfService": "Uso do serviço",
    "legal.terms.useOfServiceText": "O TerraCoast é uma plataforma gratuita de aprendizado de geografia. Você concorda em usar o serviço de forma responsável.",
    "legal.terms.userContent": "Conteúdo do usuário",
    "legal.terms.userContentText": "Ao criar quizzes, você concede ao TerraCoast o direito de publicá-los na plataforma. Você continua sendo o proprietário do seu conteúdo.",
    "legal.terms.behavior": "Comportamento",
    "legal.terms.behaviorText": "Qualquer comportamento inadequado (spam, assédio, conteúdo ilegal) resultará na suspensão ou exclusão da sua conta.",
    "legal.terms.lastUpdated": "Última atualização: 17 de novembro de 2025",
    "legal.terms.fullText": `Bem-vindo ao TerraCoast, um site de quizzes dedicado à geografia. O acesso e o uso do site implicam a aceitação plena destes Termos de Uso. Se você não aceitar estes termos, não utilize o serviço.

1. Objeto do serviço
O TerraCoast permite aos usuários:
- Criar uma conta para acessar os quizzes de geografia.
- Participar de classificações e obter pontuações.
- Utilizar um sistema de chat privado para trocar mensagens com outros usuários.

2. Criação de conta e dados coletados
Durante o cadastro, os seguintes dados são coletados:
- Nome de usuário
- Endereço de email
- Senha
Os usuários se comprometem a fornecer informações corretas e a atualizá-las em caso de alteração.

3. Proteção e armazenamento dos dados
- Os dados pessoais são hospedados exclusivamente na Europa.
- As informações de login são protegidas e as senhas são criptografadas.
- As mensagens trocadas no chat são privadas e criptografadas para não serem lidas por terceiros.
Nenhum dado será vendido ou transmitido a terceiros sem consentimento, salvo obrigação legal.

4. Uso do site e comportamento dos usuários
O usuário se compromete a:
- Não tentar acessar contas de outros usuários.
- Não divulgar conteúdo ofensivo, discriminatório, violento, ilegal ou inadequado.
- Respeitar os demais membros e o espírito educativo do site.
O descumprimento dessas regras pode resultar na suspensão ou exclusão definitiva da conta.

5. Responsabilidades
- O TerraCoast faz todo o possível para garantir um serviço estável e seguro, mas não pode garantir disponibilidade permanente do site.
- O TerraCoast não é responsável por perdas de dados, problemas de rede ou comportamentos de usuários no chat.

6. Propriedade intelectual
Os conteúdos do site (textos, visuais, quizzes, logotipo, nome TerraCoast etc.) são protegidos pela legislação de propriedade intelectual. Qualquer reprodução, representação ou difusão sem autorização é proibida.

7. Exclusão da conta e direito ao apagamento
Os usuários podem solicitar a exclusão de sua conta e de seus dados a qualquer momento pelo endereço:
helpdesk@terracoast.ch

8. Modificação dos termos
O TerraCoast se reserva o direito de modificar estes Termos de Uso a qualquer momento. Os usuários serão informados em caso de mudança importante.

9. Contato
Para qualquer questão sobre o uso do serviço ou dados pessoais:
helpdesk@terracoast.ch`,
    "legal.privacy.dataCollection": "Coleta de dados",
    "legal.privacy.dataCollectionText": "O TerraCoast coleta apenas os dados necessários para o funcionamento do serviço: endereço de email, nome de usuário e estatísticas de jogo.",
    "legal.privacy.dataUse": "Uso de dados",
    "legal.privacy.dataUseText": "Seus dados são usados ​​apenas para melhorar sua experiência na plataforma. Não vendemos nem compartilhamos seus dados com terceiros.",
    "legal.privacy.cookies": "Cookies",
    "legal.privacy.cookiesText": "O site usa cookies essenciais para garantir seu funcionamento adequado e sua autenticação.",
    "legal.privacy.rights": "Seus direitos",
    "legal.privacy.rightsText": "Você tem o direito de acessar, retificar e excluir seus dados pessoais.",
    "legal.privacy.lastUpdated": "Data de atualização: 15 de novembro de 2025",
    "legal.privacy.fullText": `Esta Política de Privacidade tem como objetivo informar os usuários do site TerraCoast (doravante “o Site”) sobre como seus dados pessoais são coletados, utilizados, protegidos e, quando aplicável, compartilhados.

O TerraCoast atribui grande importância ao respeito à privacidade e se compromete a adotar todas as medidas necessárias para garantir a proteção dos dados pessoais dos usuários.

1. Dados coletados
Durante o cadastro e o uso do Site, o TerraCoast coleta apenas os dados necessários para o bom funcionamento da plataforma:
- Nome de usuário: identificação no jogo e no chat (obrigatório)
- Endereço de email: gestão da conta e recuperação de senha (obrigatório)
- Senha: acesso seguro à conta (obrigatório)
- Mensagens do chat: comunicação privada entre usuários (opcional)
Nenhum dado sensível é coletado.

2. Uso dos dados
Os dados coletados são utilizados para:
- Criação, gestão e segurança da conta do usuário
- Acesso aos quizzes e funcionalidades do Site
- Uso do chat privado entre usuários
- Contato com usuários em caso de necessidade (suporte, notificações, segurança)
Nenhum dado é vendido, alugado ou compartilhado para fins comerciais.

3. Localização e conformidade do armazenamento
Todos os dados coletados são hospedados e tratados na Europa, em países que seguem as convenções da União Europeia sobre proteção de dados e oferecem nível adequado de proteção.

4. Segurança dos dados
O TerraCoast adota medidas técnicas e organizacionais para proteger os dados contra:
- Acesso não autorizado
- Perda ou destruição acidental
- Modificação ou divulgação ilícita
As conversas do chat são criptografadas e estritamente privadas.
As senhas são armazenadas de forma criptografada e nunca em texto puro.

5. Prazo de conservação
- Os dados são conservados enquanto a conta estiver ativa.
- Em caso de exclusão da conta, todos os dados são apagados em até 30 dias.

6. Direitos dos usuários
De acordo com a legislação aplicável, cada usuário possui os seguintes direitos:
- Acesso
- Retificação
- Exclusão
- Limitação do tratamento
- Oposição
- Portabilidade dos dados
Qualquer solicitação pode ser enviada para: helpdesk@terracoast.ch
Uma resposta será fornecida em até 30 dias.

7. Cookies
O TerraCoast utiliza apenas cookies técnicos necessários ao funcionamento do Site (login, manutenção de sessão).
Nenhum cookie publicitário ou de rastreamento externo é utilizado.

8. Alteração da Política de Privacidade
O TerraCoast se reserva o direito de alterar esta Política de Privacidade a qualquer momento.
Em caso de mudança importante, os usuários serão informados por notificação ou email.

9. Contato
Para qualquer questão relacionada à proteção de dados pessoais:
helpdesk@terracoast.ch`,
    "forceUsername.title": "Alteração de Nome de Usuário Necessária",
    "forceUsername.subtitle": "Você deve escolher um novo nome de usuário para continuar",
    "forceUsername.flaggedTitle": "Seu nome de usuário atual foi sinalizado",
    "forceUsername.flaggedDesc": "Um administrador exige que você escolha um novo nome de usuário apropriado.",
    "forceUsername.currentPseudo": "Nome de Usuário Atual",
    "forceUsername.newPseudo": "Novo Nome de Usuário",
    "forceUsername.placeholder": "Digite seu novo nome de usuário",
    "forceUsername.rules": "3 a 20 caracteres, apenas letras, números, sublinhados e espaços",
    "forceUsername.confirm": "Confirmar Novo Nome de Usuário",
    "forceUsername.updating": "Atualizando...",
    "forceUsername.notice": "Você não poderá acessar o aplicativo até escolher um novo nome de usuário apropriado.",
    "forceUsername.errorEmpty": "Por favor, digite um novo nome de usuário",
    "forceUsername.errorLength": "O nome de usuário deve ter entre 3 e 20 caracteres",
    "forceUsername.errorInvalid": "O nome de usuário só pode conter letras, números, sublinhados e espaços",
    "forceUsername.errorTaken": "Este nome de usuário já está em uso",
    "forceUsername.errorUpdate": "Erro ao atualizar o nome de usuário",
    "forceUsername.errorGeneric": "Ocorreu um erro",
    "settings.twoFactorConfirmActivation": "Conectar",
  },
};

export const languageNames: Record<Language, string> = {
  fr: "Français",
  en: "English",
  es: "Español",
  de: "Deutsch",
  it: "Italiano",
  pt: "Português",
};

export function detectUserLanguage(): Language {
  const browserLang = navigator.language.toLowerCase().split("-")[0];
  const supported: Language[] = ["fr", "en", "es", "de", "it", "pt"];

  if (supported.includes(browserLang as Language)) {
    return browserLang as Language;
  }

  return "fr";
}

export function translate(key: string, language: Language): string {
  return translations[language]?.[key] || key;
}
