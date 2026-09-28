# 09 — Duels 1v1, Multijoueur & Interactions Sociales

## 1. Arène des Duels 1v1 (`/duels`)

La page des duels a été entièrement repensée pour offrir une clarté instantanée, une navigation par onglets tactiles et une mise en scène compétitive engageante.

### A. Clarté Immédiate du Tour de Jeu
Dans un duel en deux temps (asynchrone ou direct), la question principale du joueur est : *« Dois-je jouer maintenant ou attendre mon adversaire ? »*.
L'interface résout cette ambiguïté via :
- **Si c'est le tour du joueur** :
  - Encadrement vert émeraude vibrant avec lueur (`ring-4 ring-emerald-100`).
  - Badge d'alerte : `🔥 C'est à toi de jouer ! Réponds aux questions pour marquer des points.`.
  - Bouton 3D vert saillant : `🎮 Jouer mon tour maintenant !`.
- **Si le joueur a déjà joué son tour** :
  - Encadrement ambré doux avec le message : `⏳ Ton score est enregistré ! En attente du tour de [Pseudo].`.
  - Bouton désactivé propre : `⏳ En attente de l'adversaire`.

### B. Matchmaking 1v1 Rapide
Accessible en un clic via l'onglet **Matchmaking** :
- **Mode Classé 🏆 (Compétitif)** : attribution ou perte de points ELO/MMR, calcul de match équilibré selon le niveau du joueur.
- **Mode Amical 🎮 (Détente)** : parties rapides sans enjeu de classement.
- **Interface Radar Animée** : onde d'impulsion visuelle (*pulsing sonar*), décompte du temps d'attente et bouton d'annulation direct.
- **Préférences Thématiques** : choix de difficulté en un clic (`Toutes 🌐`, `Facile 🌱`, `Moyen ⚡`, `Difficile 🔥`) et mode `🎲 Aléatoire (+ Bonus d'XP)` ou sélection de quiz ciblés avec moteur de recherche instantané.

### C. Historique & Showdown Visuel
Chaque duel terminé affiche :
- Un badge de résultat tranché : 🏆 **Victoire**, 💀 **Défaite**, 🤝 **Égalité**.
- L'affrontement visuel avec les avatars des deux joueurs, leurs scores exacts et leurs taux de précision.
- Le delta de points de classement pour les parties classées (`+25 MMR` ou `-18 MMR`).

---

## 2. Ghost Runs 👻 (Défis Asynchrones)

Les **Ghost Runs** permettent de défier n'importe quel joueur sans nécessiter qu'il soit ami ou connecté simultanément :
1. Un joueur réalise une session sur un quiz donné.
2. À la fin de sa partie, il peut générer un **Ghost Run Challenge** encodé dans une URL courte ou un QR code.
3. Le destinataire ouvre le lien, voit le score et le temps du "fantôme", et tente de battre son record.
4. Le résultat est automatiquement notifié au challenger dès que le défi est relevé.

---

## 3. Mode Salon Multijoueur / Party (`/party`)

Le mode salon s'adresse aux groupes, événements et salles de classe :
- **Lobby Temps Réel** : synchronisation instantanée des participants via Supabase Realtime Presence.
- **Mode Spectateur / Hôte Pur** : l'animateur peut projeter le jeu sur grand écran sans être forcé de participer.
- **Support des Quiz Privés** : un professeur ou animateur peut utiliser un quiz privé qu'il a conçu pour sa classe.
- **Mode Battle Royale & Podium 3D** : animation dynamique du classement entre chaque manche et célébration finale.

---

## 4. Système d'Amis & Messagerie

- **Gestion des Amitiés** : recherche par pseudo, envoi de requêtes d'amitié, acceptation/refus.
- **Chat 1:1 Sécurisé** : échange de messages en temps réel entre amis via la table `chat_messages` protégée par RLS.
- **Invitations Directes de Duel** : fenêtre modale tactile avec recherche fluide d'amis et de quiz pour lancer un défi en 2 clics.
