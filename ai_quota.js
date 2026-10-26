/**
 * ai_quota.js — pilotage du quota IA et cache durable.
 *
 * Le quota gratuit Google est de 20 requêtes/JOUR et par modèle. Il ne peut
 * pas être augmenté : la seule façon de tenir est donc de le gérer nous-mêmes.
 *
 *   1. Budget d'appels (global + par modèle) sur une fenêtre glissante de
 *      24 h : au-delà, on n'appelle plus Google — on sert le cache ou le
 *      contenu local, sans jamais renvoyer une erreur 502 à l'élève.
 *   2. Cache durable sur disque : un cours ou une banque d'exercices déjà
 *      payés en quota reste disponible après un redémarrage de l'instance
 *      (le cache mémoire, lui, disparaît à chaque redémarrage).
 *
 * Module sans dépendance externe, testable isolément.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const FENETRE_QUOTA_MS = 24 * 60 * 60 * 1000;

/**
 * Budget d'appels IA.
 *
 * La fenêtre est glissante : au plus N appels par modèle sur n'importe
 * quelle période de 24 h. C'est plus strict que le quota quotidien de
 * Google (qui remise à l'heure fixe) mais c'est le seul moyen de ne jamais
 * dépasser le plafond, quel que soit l'alignement des horloges.
 */
class BudgetQuota {
  constructor(options = {}) {
    this.budgetTotal = Math.max(1, Number(options.budgetTotal) || 45);
    this.budgetParModele = Math.max(1, Number(options.budgetParModele) || 15);
    this.fenetreMs = Math.max(60 * 1000, Number(options.fenetreMs) || FENETRE_QUOTA_MS);
    this.total = [];
    this.parModele = new Map();
  }

  /** Retire les appels sortis de la fenêtre. */
  _purge(list) {
    const limite = Date.now() - this.fenetreMs;
    return list.filter(t => t > limite);
  }

  /**
   * Autorise (et compte) un appel vers un modèle.
   * @param {string} model  identifiant du modèle Gemini
   * @returns {{ok:boolean, raison?:string}}  `raison` explique le refus
   */
  autorise(model) {
    this.total = this._purge(this.total);
    const hitsModele = this._purge(this.parModele.get(model) || []);
    this.parModele.set(model, hitsModele);

    if (this.total.length >= this.budgetTotal) {
      return { ok: false, raison: 'budget-quotidien-atteint' };
    }
    if (hitsModele.length >= this.budgetParModele) {
      return { ok: false, raison: 'quota-modele-atteint' };
    }

    const now = Date.now();
    this.total.push(now);
    this.parModele.set(model, hitsModele.concat(now));
    return { ok: true };
  }

  /**
   * Délai avant que le quota se libère (sortie du plus ancien appel).
   * @returns {number} secondes (0 si le budget est libre)
   */
  retryDansSecondes() {
    if (!this.total.length) return 0;
    const plusAncien = Math.min.apply(null, this.total);
    return Math.max(60, Math.ceil((plusAncien + this.fenetreMs - Date.now()) / 1000));
  }

  /** État du budget (pour le diagnostic et les tests). */
  etat() {
    this.total = this._purge(this.total);
    const parModele = {};
    for (const [model, hits] of this.parModele.entries()) {
      const kept = this._purge(hits);
      this.parModele.set(model, kept);
      parModele[model] = kept.length;
    }
    return {
      utilise: this.total.length,
      budgetTotal: this.budgetTotal,
      budgetParModele: this.budgetParModele,
      restant: Math.max(0, this.budgetTotal - this.total.length),
      parModele,
      fenetreHeures: Math.round(this.fenetreMs / 3600000),
      retryDansSecondes: this.retryDansSecondes()
    };
  }

  /** Remet les compteurs à zéro (tests, ou changement de clé API). */
  reinitialiser() {
    this.total = [];
    this.parModele = new Map();
  }
}

/**
 * Cache durable sur disque.
 *
 * Sert de filet de sécurité quand l'IA est indisponible : le contenu
 * déjà généré (cours du pays, 50 exercices d'un chapitre) est relu au
 * lieu de régénérer — donc sans consommer de quota.
 */
class CacheDisque {
  constructor(dossier, options = {}) {
    this.dossier = dossier;
    this.ttlMs = Number(options.ttlMs) || 30 * 24 * 60 * 60 * 1000;
    this.maxFichiers = Number(options.maxFichiers) || 400;
    this.actif = true;
    this.erreur = null;
    try {
      fs.mkdirSync(dossier, { recursive: true });
    } catch (e) {
      // Système de fichiers en lecture seule (certains hébergeurs) : on
      // continue sans cache disque, le cache mémoire prend le relais.
      this.actif = false;
      this.erreur = e.message;
    }
  }

  /** Nom de fichier stable (hash de la clé) : pas de caractères invalides. */
  _chemin(cle) {
    const hash = crypto.createHash('sha1').update(String(cle)).digest('hex');
    return path.join(this.dossier, `${hash}.json`);
  }

  /**
   * Relit une entrée (null si absente ou expirée).
   * @param {string} cle
   * @returns {any|null}
   */
  get(cle) {
    if (!this.actif) return null;
    const fichier = this._chemin(cle);
    try {
      if (!fs.existsSync(fichier)) return null;
      const data = JSON.parse(fs.readFileSync(fichier, 'utf8'));
      if (!data || typeof data.at !== 'number') return null;
      if (Date.now() - data.at > this.ttlMs) {
        try { fs.unlinkSync(fichier); } catch (_) { /* fichier déjà supprimé */ }
        return null;
      }
      return data.value === undefined ? null : data.value;
    } catch (_) {
      return null;
    }
  }

  /**
   * Écrit une entrée.
   * @returns {boolean} true si l'écriture a réussi
   */
  set(cle, valeur) {
    if (!this.actif) return false;
    try {
      fs.writeFileSync(
        this._chemin(cle),
        JSON.stringify({ at: Date.now(), value: valeur }),
        'utf8'
      );
      this._purger();
      return true;
    } catch (_) {
      return false;
    }
  }

  /** Supprime les entrées les plus anciennes quand le dossier grossit. */
  _purger() {
    try {
      const fichiers = fs.readdirSync(this.dossier).filter(f => f.endsWith('.json'));
      if (fichiers.length <= this.maxFichiers) return;
      const infos = fichiers
        .map(f => {
          const chemin = path.join(this.dossier, f);
          let at = 0;
          try { at = fs.statSync(chemin).mtimeMs; } catch (_) { at = 0; }
          return { chemin, at };
        })
        .sort((a, b) => a.at - b.at);
      const excess = infos.length - this.maxFichiers;
      for (let i = 0; i < excess; i++) {
        try { fs.unlinkSync(infos[i].chemin); } catch (_) { /* ignore */ }
      }
    } catch (_) { /* ignore */ }
  }
}

module.exports = { BudgetQuota, CacheDisque, FENETRE_QUOTA_MS };
