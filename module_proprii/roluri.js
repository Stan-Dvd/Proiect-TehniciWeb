
const Drepturi=require('./drepturi.js');

/**
 * Clasa generica pentru Roluri - extinsa in roluri particulare
 */
class Rol{
    /**
     * Returneaza numele rolului
     * @returns {string} numele rolului
     */
    static get tip() {return "generic"}
    /**
     * Returneaza lista de drepturi a rolului
     * @returns {Symbol[]} Lista de drepturi
     */
    static get drepturi() {return []}
    constructor (){
        this.cod=this.constructor.tip;
    }
    /**
     * Verifica daca un rol are sau nu un anumit drept
     * @param {Object} drept Dreptul care va fi verificat
     * @returns {boolean}
     */
    areDreptul(drept){ //drept trebuie sa fie tot Symbol
        console.log("in metoda rol!!!!")
        return this.constructor.drepturi.includes(drept); 
    }
}

/**
 * SuperUser - Are toate drepturile
 */
class RolAdmin extends Rol{
    
    static get tip() {return "admin"}
    constructor (){
        super();
        
    }

    areDreptul(){
        return true; //pentru ca e admin
    }
}

/**
 * Are drepturi asupra utilizatorilor
 */
class RolModerator extends Rol{
    
    static get tip() {return "moderator"}
    static get drepturi() { return [
        Drepturi.vizualizareUtilizatori,
        Drepturi.stergereUtilizatori
    ] }
    constructor (){
        super()
    }
}
/**
 * Are dreptul de adauga, sterge si modifica produse
 */
class RolAdminProduse extends Rol{
    
    static get tip() {return "moderator"}
    static get drepturi() { return [
        Drepturi.adaugareProduse,
        Drepturi.stergereProduse,
        Drepturi.modificareProduse
    ] }
    constructor (){
        super()
    }
}
/**
 * Are doar dreptul de a modifica produsele, pentru a le verifica
 */
class RolManagerProduse extends Rol{
    
    static get tip() {return "moderator"}
    static get drepturi() { return [
        Drepturi.modificareProduse
    ] }
    constructor (){
        super()
    }
}

/**
 * Client simplu - are dreptul de a cumpara produse
 */
class RolClient extends Rol{
    static get tip() {return "comun"}
    static get drepturi() { return [
        Drepturi.cumparareProduse
    ] }
    constructor (){
        super()
    }
}

/**
 * Instantiaza un obiect de tip rol cu particularitatile selectate
 */
class RolFactory{
    static creeazaRol(tip) {
        /**
         * Creeaza o instanta de Rol
         * 
         * @param {Object} tip - tipul de Rol ce va fi instantiat
         * @returns {Rol}
         */
        switch(tip){
            case RolAdmin.tip : return new RolAdmin();
            case RolModerator.tip : return new RolModerator();
            case RolClient.tip : return new RolClient();
            case RolAdminProduse.tip: return new RolAdminProduse();
            case RolManagerProduse.tip: return new RolManagerProduse();
        }
    }
}


module.exports={
    RolFactory:RolFactory,
    RolAdmin:RolAdmin
}