
/**
 @typedef Drepturi
 @type {Object}
 @property {Symbol} vizualizareUtilizatori Dreptul de a intra pe  pagina cu tabelul de utilizatori.
 @property {Symbol} stergereUtilizatori Dreptul de a sterge un utilizator
 @property {Symbol} cumparareProduse Dreptul de a cumpara
 @property {Symbol} vizualizareGrafice Dreptul de a vizualiza graficele de vanzari
 @property {Symbol} adaugareProduse Dreptul de a adauga produse in baza de date
 @property {Symbol} modificareProduse Dreptul de a modifica valori ale produselor din baza de date
 @property {Symbol} stergereProduse Dreptul de a sterge produse din baza de date
 */


/**
 * @name module.exports.Drepturi
 * @type Drepturi
 */
const Drepturi = {
	vizualizareUtilizatori: Symbol("vizualizareUtilizatori"),
	vizualizareGrafice: Symbol("vizualizareGrafice"),
	stergereUtilizatori: Symbol("stergereUtilizatori"),
	cumparareProduse: Symbol("cumparareProduse"),
	adaugareProduse: Symbol("adaugareProduse"),
	modificareProduse: Symbol("modificareProduse"),
	stergereProduse: Symbol("stergereProduse")
}

module.exports = Drepturi;