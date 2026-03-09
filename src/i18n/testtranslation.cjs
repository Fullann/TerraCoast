const fs = require('fs');

// Chemin vers ton fichier de traductions (modifie-le si le script n'est pas dans le même dossier)
const file = './src/i18n/translations.ts'; 
let content = fs.readFileSync(file, 'utf8');

// Fonction pour trouver le début et la fin d'un bloc de langue (ex: "en: { ... }")
function getBlockBounds(str, lang) {
    const regex = new RegExp(`\\b${lang}:\\s*\\{`);
    const match = str.match(regex);
    if (!match) return null;
    
    const start = match.index;
    const openBrace = str.indexOf('{', start);
    let braceCount = 1;
    let end = openBrace + 1;
    
    while (braceCount > 0 && end < str.length) {
        if (str[end] === '{') braceCount++;
        if (str[end] === '}') braceCount--;
        end++;
    }
    
    return { start: openBrace + 1, end: end - 1 }; // Retourne l'intérieur des accolades
}

// 1. Extraire toutes les clés/valeurs du français (fr)
const frBounds = getBlockBounds(content, 'fr');
if (!frBounds) {
    console.error("❌ Bloc 'fr:' introuvable dans le fichier !");
    process.exit(1);
}

const frContent = content.substring(frBounds.start, frBounds.end);
// Regex pour capturer "clé": "valeur"
const keyValueRegex = /"([^"]+)"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g;
const frKeys = new Map();
let match;

while ((match = keyValueRegex.exec(frContent)) !== null) {
    frKeys.set(match[1], match[2]); // key -> valeur en français
}

console.log(`🌍 ${frKeys.size} clés trouvées en Français (FR).`);

// 2. Parcourir les autres langues pour injecter les TODO
const targetLangs = ['en', 'es', 'de', 'it', 'pt'];

for (const lang of targetLangs) {
    // On recalcule les limites à chaque fois car le contenu du fichier grandit
    let bounds = getBlockBounds(content, lang);
    if (!bounds) continue;
    
    let langContent = content.substring(bounds.start, bounds.end);
    let existingKeys = new Set();
    let kvMatch;
    
    // Trouver les clés qui existent déjà dans cette langue
    while ((kvMatch = keyValueRegex.exec(langContent)) !== null) {
        existingKeys.add(kvMatch[1]);
    }
    
    let addedCount = 0;
    let insertion = "";
    
    for (const [key, frVal] of frKeys.entries()) {
        if (!existingKeys.has(key)) {
            // On prépare la ligne avec le TODO
            insertion += `\n    "${key}": "TODO: ${frVal}",`;
            addedCount++;
        }
    }
    
    if (addedCount > 0) {
        // On insère les nouvelles clés juste avant l'accolade fermante du bloc de la langue
        content = content.slice(0, bounds.end) + insertion + "\n  " + content.slice(bounds.end);
        console.log(`✅ ${addedCount} traductions manquantes ajoutées dans '${lang}'.`);
    } else {
        console.log(`👍 Aucune traduction manquante pour '${lang}'.`);
    }
}

// 3. Sauvegarder le fichier
fs.writeFileSync(file, content, 'utf8');
console.log("🚀 Fichier translations.ts mis à jour avec succès !");
