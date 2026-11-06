# Le Levier IA : veille IA pour evolvia-agence.com

Accessible sans compte :

- **Dernière édition (6 novembre 2026)** : [editions/2026-11-06.md](editions/2026-11-06.md)
- **Toutes les éditions** : dossier [editions/](editions/)
- **Le flux à intégrer au site** : https://raw.githubusercontent.com/Tanzer88/veille-ia/main/editions.json

Chaque édition (lundi, mercredi, vendredi) contient l'actualité IA, puis, **à part**, un cas d'usage Evolvia pour un
métier précis (pharmacie, BTP, boulangerie, cabinet médical…).

Le programme qui produit la newsletter est dans le dépôt privé https://github.com/Tanzer88/newsletter-ia
(connexion GitHub requise).

## Tester la rédaction soi-même

1. Télécharger [`tester/prompt-2026-11-06.md`](tester/prompt-2026-11-06.md) (consignes + sources du 6 novembre).
2. Sur https://claude.ai, joindre le fichier et écrire : « Suis exactement ces consignes et rédige l'édition. »
3. Puis : « Présente cette édition comme un article de blog, sans rien ajouter. »
4. Comparer avec [l'édition publiée du 6 novembre](editions/2026-11-06.md).

## Intégration au site

Depuis le 2026-11-06, chaque construction du site publie `editions.json` à la racine :
`https://raw.githubusercontent.com/Tanzer88/veille-ia/main/editions.json` (site en lecture libre seulement ; jamais bloquant pour la
parution). Il contient toutes les éditions publiées (365 au plus), de la plus récente à la plus ancienne.

## Usage prévu

Le site d'Evolvia (Next.js) lit ce fichier au moment de la construction ou en revalidation périodique (ISR, une fois
par heure suffit : trois éditions par semaine, lundi, mercredi et vendredi vers 8 h, heure de Montréal) et génère ses propres pages. Les pages du site
Levier IA portent `noindex` (`web.indexable: false`) : la page d'Evolvia est la seule version indexée, donc la page
canonique. Ne pas passer `web.indexable` à `true` sans décision, sous peine de contenu dupliqué.

## Objectif SEO (demande de Lucien, 2026-11-06)

Faire remonter evolvia-agence.com sur les recherches francophones « automatisation », « agent IA »,
« digitalisation » (+ métier), et plus seulement sur « evolvia agence ». Deux types de pages :

1. **Une page par édition** (`/veille-ia/AAAA-MM-JJ`) : actualité IA publiée trois fois par semaine, avec `title`,
   `description` et `keywords` de l'édition.
2. **Une page par cas d'usage sectoriel** (`/cas-usage/<slug>`, ou intégrée dans `/ressources`) : l'objet
   `editions[].use_case` (bloc séparé de l'actualité, affiché après les brèves) contient à chaque édition un métier (boulangerie, BTP, cabinet médical, salle de sport…,
   30 secteurs en rotation), son vocabulaire, le problème et la solution Evolvia. Ce sont des pages durables, ciblées
   sur la longue traîne (« automatisation boulangerie », « agent IA cabinet dentaire »…). Elles portent leur
   propre `seo.title`, `seo.description`, `seo.keywords` et `slug`, et des liens internes vers les pages services
   (`services[].url`). Le cas est un **exemple illustratif** (`illustrative: true`) : afficher la mention
   « Exemple illustratif » et ne jamais le présenter comme une réalisation.

## Format (version 1)

```json
{
  "version": 1, "publication": "Le Levier IA", "tagline": "…", "language": "fr",
  "generated_at": "ISO 8601", "site": "https://github.com/Tanzer88/veille-ia",
  "statuses": {"annoncé": "…", "accessible": "…", "accès limité": "…", "affirmation commerciale": "…"},
  "editions": [{
    "date": "2026-11-06", "slug": "2026-11-06", "published_at": "ISO 8601",
    "title": "≤ 70 caractères (balise <title>)", "subject": "titre complet",
    "description": "≤ 160 caractères (meta description)", "intro": "…", "closing": "… ou null",
    "reading_minutes": 6, "url": "page d'origine (noindex)",
    "items": [{
      "id": "2026-11-06-actualite-majeure", "anchor": "actualite-majeure",
      "rubric": "majeure | utile | cas | depot | bref", "rubric_label": "L'actualité majeure",
      "domain": "Marché | Régulation | Recherche | Produits | Entreprises | Modèles | Société (brèves) ou null",
      "title": "…", "status": "accessible … ou null", "announced_on": "AAAA-MM-JJ ou null",
      "effective_on": "… ou null",
      "blocks": [{"label": "Ce qui change", "text": "…"}],
      "sources": [{"url": "…", "title": "…", "publisher": "…", "published_at": "AAAA-MM-JJ", "tier": "primary|secondary"}],
      "url": "page d'origine#ancre",
    }],
    "use_case": "objet séparé (ou null) : mêmes champs qu'un élément + sector, slug, seo{title, description, keywords}, services[{slug, name, url}], illustrative: true ; sources souvent vides",
    "keywords": ["expressions de recherche de l'édition"],
    "sources": ["toutes les sources citées dans l'édition, sans doublon"]
  }]
}
```

Règles de stabilité : on ajoute des champs sans changer la version ; tout changement incompatible fait passer
`version` à 2. `selection.json` (veille LinkedIn) reste inchangé.

## Bonnes pratiques côté site

- Afficher les sources de chaque élément (liens sortants) et le statut : c'est la garantie de qualité de la veille.
- JSON-LD `NewsArticle` (ou `Article`) par édition : `headline` = `title`, `description`, `datePublished` =
  `published_at`, `inLanguage: fr`, éditeur Evolvia.
- Un `<h2>` par rubrique, un `<h3>` par élément ; `blocks[].label` vide (brèves) = paragraphe simple.
- Texte brut, sans HTML : l'échapper normalement à l'affichage.
- En cas d'indisponibilité du fichier, conserver la dernière version construite (ne pas vider la page).
