const AccesBD = require('./accesbd.js');
const parole = require('./parole.js');

const { RolFactory } = require('./roluri.js');
const crypto = require("crypto");
const nodemailer = require("nodemailer");

/**
 * Clasa Utilizator reprezinta un utilizator al aplicatiei
 * Ofera metode de interactiune cu baza de date si de verificare a datelor
 */
class Utilizator {
    static tipConexiune = "local";
    static tabel = "utilizatori"
    static parolaCriptare = "tehniciweb";
    static emailServer = "cobscura15@gmail.com";
    static lungimeCod = 64;
    static numeDomeniu = "localhost:4080";
    #eroare;


    /**
 * Creeaza o instanta de Utilizator
 * @param {Object} param - Datele utilizatorului
 * @param {number} param.id - ID-ul utilizatorului
 * @param {string} param.username - Username-ul
 * @param {string} param.nume - Numele
 * @param {string} param.prenume - Prenumele
 * @param {string} param.email - Adresa de email
 * @param {string} param.parola - Parola 
 * @param {string|Object} param.rol - Rolul utilizatorului
 * @param {string} [param.culoare_chat="black"] - Culoarea in chat
 * @param {string} param.poza - Calea catre poza de profil
 */

    constructor({ id, username, nume, prenume, email, parola, rol, culoare_chat = "black", poza } = {}) {
        this.id = id;

        //optional sa facem asta in constructor
        try {
            if (this.checkUsername(username))
                this.username = username;
            else throw new Error("Username incorect");
            if (this.checkName(nume))
                this.name = nume;
            else throw new Error("Name incorrect!")
        }
        catch (e) { this.#eroare = e.message }

        for (let prop in arguments[0]) {
            this[prop] = arguments[0][prop]
        }
        if (this.rol)
            this.rol = this.rol.cod ? RolFactory.creeazaRol(this.rol.cod) : RolFactory.creeazaRol(this.rol);
        console.log(this.rol);

        this.#eroare = "";
    }

    /**
     * Verifica daca numele respecta formatul cerut (prima litera mare, restul mici)
     * @param {string} nume - Numele de verificat
     * @returns {boolean} true daca e valid, false altfel
     */
    checkMail(mail) {
        return mail != "" && mail.match(new RegExp("^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$"));
    }

    checkName(nume) {
        return nume != "" && nume.match(new RegExp("^[A-Z][a-z]+$"));
    }

    set setareNume(nume) {
        if (this.checkName(nume)) this.nume = nume
        else {
            throw new Error("Nume gresit")
        }
    }

    /*
    * folosit doar la inregistrare si modificare profil
    */
    set setareUsername(username) {
        if (this.checkUsername(username)) this.username = username
        else {
            throw new Error("Username gresit")
        }
    }

    /**
    * Verifica daca username-ul contine doar caractere permise; folosit doar la inregistrare si modificare profil
    * @param {string} username - Username-ul de verificat
    * @returns {boolean} true daca e valid, false altfel
    */
    checkUsername(username) {
        return username != "" && username.match(new RegExp("^[A-Za-z0-9#_./]+$"));
    }

    /**
     * Cripteaza o parola folosind scrypt
     * @param {string} parola - Parola de criptat
     * @returns {string} Parola criptata in format hex
     */
    static criptareParola(parola) {
        return crypto.scryptSync(parola, Utilizator.parolaCriptare, Utilizator.lungimeCod).toString("hex");
        //bonus etapa8: fiecare user are o parola de criptare randomized si pusa in BD
        //ca sa verifici parola la login tre sa iei cheia din BD, sa o criptezi cu ea si dupa sa o verifici cu parola din BD (cred)
    }

    /**
     * Salveaza utilizatorul in baza de date si trimite mail de confirmare
     * @returns {void}
     */
    salvareUtilizator() {
        let utilizExistent = Utilizator.getUtilizDupaUsername(this.username);
        if (utilizExistent)
            throw new Error("Username-ul exista deja!");
        let parolaCriptata = Utilizator.criptareParola(this.parola);
        let utiliz = this;
        let token = parole.genereazaToken(100);
        getUtilizDupaUsername(this.username)
        AccesBD.getInstanta(Utilizator.tipConexiune).insert({
            tabel: Utilizator.tabel,
            campuri: {
                username: this.username,
                nume: this.nume,
                prenume: this.prenume,
                parola: parolaCriptata,
                email: this.email,
                culoare_chat: this.culoare_chat,
                cod: token,
                poza: this.poza
            }
        }, function (err, rez) {
            if (err)
                console.log(err);
            else
                utiliz.trimiteMail("Te-ai inregistrat cu succes", "Username-ul tau este " + utiliz.username,
                    `<h1>Salut!</h1><p style='color:blue'>Username-ul tau este ${utiliz.username}.</p> <p><a href='http://${Utilizator.numeDomeniu}/cod/${utiliz.username}/${token}'>Click aici pentru confirmare</a></p>`,
                )
        });
    }
    //xjxwhotvuuturmqm


    /**
    * Cauta un utilizator dupa username 
    * @param {string} username - Username-ul cautat
    * @param {Object} obparam - Obiect cu date suplimentare ex: parola
    * @param {function(Utilizator, Object, number): void} proceseazaUtiliz - Callback de procesare
    * @returns {void}
    */
    static getUtilizDupaUsername(username, obparam, proceseazaUtiliz) {
        if (!username) return null;
        let eroare = null;
        AccesBD.getInstanta(Utilizator.tipConexiune).select(
            {
                tabel: "utilizatori",
                campuri: ['*'],
                conditiiAnd: [`username='${username}'`]
            }
            , function (err, rezSelect) {
                if (err) {
                    console.error("Utilizator:", err);
                    //throw new Error()
                    eroare = -2;
                }
                else if (rezSelect.rowCount == 0) {
                    eroare = -1;
                }
                //constructor({id, username, nume, prenume, email, rol, culoare_chat="black", poza}={})
                let u = new Utilizator(rezSelect.rows[0])
                proceseazaUtiliz(u, obparam, eroare);
            });
    }

    /**
     * Cauta un utilizator dupa username, varianta asincrona
     * @param {string} username - Username-ul cautat
     * @returns {Promise<Utilizator|null>} Utilizatorul gasit sau null
     */
    static async getUtilizDupaUsernameAsync(username) {
        if (!username) return null;
        try {
            let rezSelect = await AccesBD.getInstanta(Utilizator.tipConexiune).selectAsync(
                {
                    tabel: "utilizatori",
                    campuri: ['*'],
                    conditiiAnd: [`username='${username}'`]
                });
            if (rezSelect.rowCount != 0) {
                return new Utilizator(rezSelect.rows[0])
            }
            else {
                console.log("getUtilizDupaUsernameAsync: Nu am gasit utilizatorul");
                return null;
            }
        }
        catch (e) {
            console.log(e);
            return null;
        }

    }

    /**
     * Trimite un email utilizatorului
     * @param {string} subiect - Subiectul emailului
     * @param {string} mesajText - Continutul plain text
     * @param {string} mesajHtml - Continutul HTML
     * @param {Array} [atasamente=[]] - Lista de atasamente
     * @returns {Promise<void>}
     */
    async trimiteMail(subiect, mesajText, mesajHtml, atasamente = []) {
        var transp = nodemailer.createTransport({
            service: "gmail",
            secure: false,
            auth: {//date login 
                user: Utilizator.emailServer,
                pass: "iqurnadzbaiygkkj"
            },
            tls: {
                rejectUnauthorized: false
            }
        });
        //genereaza html
        await transp.sendMail({
            from: Utilizator.emailServer,
            to: this.email,
            subject: subiect,//"Te-ai inregistrat cu succes",
            text: mesajText, //"Username-ul tau este "+username
            html: mesajHtml,// `<h1>Salut!</h1><p style='color:blue'>Username-ul tau este ${username}.</p> <p><a href='http://${numeDomeniu}/cod/${username}/${token}'>Click aici pentru confirmare</a></p>`,
            attachments: atasamente
        })
        console.log("trimis mail");
    }

    /**
     * Sterge utilizatorul din baza de date
     * @returns {void}
     * @throws {Error} Daca utilizatorul nu exista
     */
    sterge() {
        AccesBD.getInstanta(Utilizator.tipConexiune).delete({
            tabel: Utilizator.tabel,
            conditiiAnd: [`id=${this.id}`]
        }, function (err, rez) {
            if (err) throw new Error("Utilizatorul nu există sau nu a putut fi șters");
        });
    }

    /**
     * Cauta utilizatori dupa mai multe criterii, varianta sincrona
     * @param {Object} obParam - Obiect cu proprietatile de cautare (cele undefined sunt ignorate)
     * @param {function(Error, Utilizator[]): void} callback - Callback cu lista de utilizatori gasiti
     * @returns {void}
     */
    static cauta(obParam, callback) {
        let conditii = [];
        for (let prop in obParam) {
            if (obParam[prop] !== undefined)
                conditii.push(`${prop}='${obParam[prop]}'`);
        }
        AccesBD.getInstanta(Utilizator.tipConexiune).select({
            tabel: Utilizator.tabel,
            campuri: ['*'],
            conditiiAnd: conditii
        }, function (err, rez) {
            if (err) callback(err, []);
            else callback(null, rez.rows.map(r => new Utilizator(r)));
        });
    }

    /**
    * Cauta utilizatori dupa mai multe criterii, varianta asincrona
    * @param {Object} obParam - Obiect cu proprietatile de cautare
    * @returns {Promise<Utilizator[]>} Lista utilizatorilor gasiti (poate fi vida)
    */
    static async cautaAsync(obParam) {
        let conditii = [];
        for (let prop in obParam) {
            if (obParam[prop] !== undefined)
                conditii.push(`${prop}='${obParam[prop]}'`);
        }
        let rez = await AccesBD.getInstanta(Utilizator.tipConexiune).selectAsync({
            tabel: Utilizator.tabel,
            campuri: ['*'],
            conditiiAnd: conditii
        });
        if (!rez) return [];
        return rez.rows.map(r => new Utilizator(r));
    }


    /**
     * Verifica daca utilizatorul are un anumit drept
     * @param {Symbol} drept - Dreptul de verificat (din drepturi.js)
     * @returns {boolean} true daca are dreptul, false altfel
     */
    areDreptul(drept) {
        return this.rol.areDreptul(drept);
    }
}
module.exports = { Utilizator: Utilizator }