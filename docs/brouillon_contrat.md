# Contrat de Prestation — Développement Logiciel
## Application de Gestion de Stock « StockApp »

> ⚠️ **Ce document est un brouillon à valeur indicative.** Il doit être relu, complété et validé par un juriste avant toute signature. Les clauses présentées sont des suggestions standard.

---

**Entre les soussignés :**

**Le Prestataire :**
- Raison sociale : ___________________________________
- Forme juridique : ___________________________________
- Siège social : ___________________________________
- SIRET : ___________________________________
- Représenté par : ___________________________________, agissant en qualité de ___________
- Email : ___________________________________

**et**

**Le Client :**
- Raison sociale : ___________________________________
- Forme juridique : ___________________________________
- Siège social : ___________________________________
- SIRET : ___________________________________
- Représenté par : ___________________________________, agissant en qualité de ___________
- Email : ___________________________________

**Il a été convenu ce qui suit :**

---

## Article 1 — Objet du Contrat

Le présent contrat a pour objet la réalisation par le Prestataire, pour le compte du Client, d'une application web de gestion de stock dénommée **StockApp**, conformément au cahier des charges annexé au présent contrat (Annexe A).

---

## Article 2 — Description de la Prestation

### 2.1 Périmètre des développements
Le Prestataire s'engage à livrer les éléments suivants :

- **Backend API REST** : serveur Node.js/Express, authentification JWT/bcrypt, endpoints produits et stock
- **Base de données PostgreSQL** : schéma complet avec tables, index, triggers, clés primaires et étrangères
- **Frontend React** : interface utilisateur pour les rôles Admin et Client
- **Documentation** : cahier des charges, cahier de conception, guide d'installation
- **Données de test** : script de seed avec comptes de démonstration

### 2.2 Fonctionnalités incluses
- Authentification et gestion des rôles (Admin/Client)
- CRUD produits avec catégories, prix et seuils d'alerte
- Enregistrement d'entrées et sorties de stock avec historique
- Tableau de bord avec indicateurs clés
- Protection des routes par rôle
- Sécurité : rate limiting, validation des entrées, headers sécurisés

### 2.3 Exclusions
Sont expressément exclus du périmètre :
- Gestion multi-entrepôts
- Module de facturation ou comptabilité
- Application mobile native (iOS/Android)
- Intégration avec des ERP ou logiciels tiers
- Hébergement et infogérance (sauf accord complémentaire)

---

## Article 3 — Délais et Planning

| Étape | Livrable | Délai |
|-------|---------|-------|
| Validation conception | Cahier de conception validé | J+7 |
| Livraison backend | API + base de données | J+21 |
| Livraison frontend | Interface utilisateur | J+35 |
| Recette | Correction des anomalies | J+42 |
| Livraison finale | Code + documentation | J+45 |

*J = date de signature du contrat*

Le Prestataire s'engage à respecter les délais susmentionnés sous réserve que le Client transmette les informations et validations nécessaires dans les délais convenus.

---

## Article 4 — Prix et Modalités de Paiement

### 4.1 Rémunération
La prestation est réalisée pour un montant forfaitaire de **_______________ F CFA HT** (_____________ Franc CFA hors taxes), soit **_______________ F CFA TTC** (TVA à 20%).

### 4.2 Échelonnement
| Étape | Montant | Échéance |
|-------|---------|----------|
| Acompte à la signature | 30% | À la signature |
| Livraison backend | 40% | Livraison J+21 |
| Livraison finale | 30% | Recette acceptée |

### 4.3 Modalités
- Paiement par virement bancaire à réception de facture
- Délai de paiement : 30 jours nets à date de facture
- Pénalités de retard : 3 fois le taux d'intérêt légal en vigueur, applicables de plein droit

---

## Article 5 — Propriété Intellectuelle

### 5.1 Cession des droits
À complet paiement du prix convenu, le Prestataire cède au Client l'intégralité des droits patrimoniaux sur les développements spécifiques réalisés dans le cadre du présent contrat, incluant les droits de reproduction, de modification, d'adaptation et de distribution.

### 5.2 Composants tiers
Les composants open source utilisés (Node.js, React, PostgreSQL, etc.) restent soumis à leurs licences respectives, dont le Client déclare avoir pris connaissance.

### 5.3 Réserve de propriété
Le Prestataire conserve la propriété intellectuelle sur ses méthodes, savoir-faire et outils génériques non spécifiques au projet.

---

## Article 6 — Confidentialité

Les parties s'engagent réciproquement à maintenir confidentiels les informations et documents de l'autre partie dont elles auraient connaissance à l'occasion de l'exécution du présent contrat, pendant une durée de **5 ans** à compter de la fin du contrat.

---

## Article 7 — Garanties et Responsabilités

### 7.1 Garantie de conformité
Le Prestataire garantit la conformité des livrables au cahier des charges pour une durée de **3 mois** à compter de la recette définitive. Durant cette période, les anomalies bloquantes seront corrigées sans frais supplémentaires.

### 7.2 Limitation de responsabilité
La responsabilité du Prestataire est limitée au montant des sommes effectivement perçues au titre du présent contrat. Le Prestataire ne saurait être tenu responsable des dommages indirects, pertes d'exploitation ou préjudices commerciaux.

### 7.3 Obligations du Client
Le Client s'engage à fournir dans les délais convenus les informations nécessaires à l'exécution de la prestation et à désigner un interlocuteur unique disposant du pouvoir de décision.

---

## Article 8 — Maintenance et Évolutions (optionnel)

Toute prestation de maintenance corrective, évolutive ou d'hébergement après la recette définitive fera l'objet d'un contrat séparé ou d'un avenant au présent contrat.

---

## Article 9 — Résiliation

Le présent contrat peut être résilié de plein droit par l'une ou l'autre des parties en cas de manquement grave de l'autre partie à ses obligations, après mise en demeure restée sans effet pendant **15 jours calendaires**.

En cas de résiliation à l'initiative du Client sans faute du Prestataire, les travaux réalisés restent facturés au prorata, auxquels s'ajoute une indemnité de résiliation de **15% du montant restant**.

---

## Article 10 — Droit Applicable et Litiges

Le présent contrat est régi par le droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable dans un délai de 30 jours. À défaut, le litige sera soumis à la compétence exclusive des tribunaux de **_______________ (ville)**.

---

## Article 11 — Dispositions Diverses

- Le présent contrat annule et remplace tout accord antérieur entre les parties sur le même objet
- Toute modification doit faire l'objet d'un avenant écrit signé par les deux parties
- Si une clause est déclarée nulle, les autres clauses demeurent valides

---

## Signatures

Fait à _______________, le _______________

En deux exemplaires originaux.

**Pour le Prestataire :**

Signature et cachet :

Nom : ___________________________________

Qualité : ___________________________________


**Pour le Client :**

Signature et cachet :

Nom : ___________________________________

Qualité : ___________________________________

---

## Annexes

- **Annexe A** : Cahier des charges fonctionnel (voir `docs/cahier_de_charge.md`)
- **Annexe B** : Cahier de conception technique (voir `docs/cahier_de_conception.md`)
- **Annexe C** : Conditions Générales de Vente du Prestataire

---

> 📋 **Note juridique** : Ce brouillon est fourni à titre informatif uniquement. Anthropic et les développeurs de StockApp déclinent toute responsabilité quant à son utilisation. Consultez un avocat spécialisé avant de le soumettre à la signature.
