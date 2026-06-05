const express = require("express");
const path = require("path");
const fs = require("fs");
const sass = require("sass");
const sharp = require("sharp");

// const ejs=require('ejs');
const pg = require("pg");
//parola BD: SQLpa55

const AccesBD= require("./module_proprii/accesbd.js");
const {Utilizator}=require("./module_proprii/utilizator.js")
const Drepturi = require("./module_proprii/drepturi.js");


const formidable=require("formidable");
const session=require('express-session');

app = express();
app.set("view engine", "ejs")

client=new pg.Client({
    database:"cti",
    user:"david",
    password:"david",
    host:"localhost",
    port:5432
})

client.connect()

app.use(session({ // aici se creeaza proprietatea session a requestului (pot folosi req.session)
    secret: 'abcdefg',//folosit de express session pentru criptarea id-ului de sesiune
    resave: true,
    saveUninitialized: false
}));

// console.log("Folder index.js", __dirname);
// console.log("Folder curent (de lucru)", process.cwd());
// console.log("Cale fisier", __filename);


obGlobal = {
    obErori: null,
    obImagini: null,
    obGalerie: null,
    folderScss: path.join(__dirname, "resurse/scss"),
    folderCss: path.join(__dirname, "resurse/css"),
    folderBackup: path.join(__dirname, "backup"),
    optiuniMeniu:[]
}

client.query("select * from unnest(enum_range(null::tipuri_cam))", function(err, rez){
    if (err){
        console.log("Eroare", err)
    }
    else{
        // console.log(rez)
        obGlobal.optiuniMeniu=rez.rows
    }
})

vect_foldere = [
    "temp", "logs", "backup", "fisiere_uploadate", "backup", "poze_uploadate"
]

for (let folder of vect_foldere) {
    let caleFolder = path.join(__dirname, folder);
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(caleFolder, { recursive: true });
    }
}

app.use("/resurse", express.static(path.join(__dirname, "resurse")))
app.use("/dist", express.static(path.join(__dirname, "node_modules/bootstrap/dist")))

//orice caut in /resurse cauta in acest folder

//BONUS 4
/**
 * 
 * Functie care valideaza continutul fisierului erori.json
 */
function validareErori() {
    const caleFisier = path.join(__dirname, "resurse/json/erori.json");

    // verificare existenta fisier
    if (!fs.existsSync(caleFisier)) {
        console.error("CRITICAL ERROR: Fisierul 'erori.json' nu exista la calea: " + caleFisier);
        process.exit(1);
    }

    const rawData = fs.readFileSync(caleFisier, "utf8");

    // verif duplicate
    // folosim o expresie regulata pentru a extrage cheile
    const regexCheie = /"([^"]+)"\s*:/g;
    let match;
    
    //verificăm cheile din fiecare set de acolade
    const obiecteBrute = rawData.split('{');
    for (let objText of obiecteBrute) {
        let chei = [];
        let matchCheie;
        while ((matchCheie = regexCheie.exec(objText)) !== null) {
            let cheie = matchCheie[1];
            if (chei.includes(cheie)) {
                console.warn(`EROARE JSON: Proprietatea "${cheie}" apare de mai multe ori intr-un obiect din fisierul brut.`);
            }
            chei.push(cheie);
        }
    }

    // restul verificarilor

    //eroare de sintaxa
    let erori;
    try {
        erori = JSON.parse(rawData);
    } catch (e) {
        console.error("EROARE: JSON-ul are erori de sintaxa si nu poate fi parsat.");
        return;
    }

    //proprietăți principale
    const proprietatiPrincipale = ["info_erori", "cale_baza", "eroare_default"];
    for (let prop of proprietatiPrincipale) {
        if (!erori.hasOwnProperty(prop)) {
            console.warn(`EROARE: Proprietatea principala "${prop}" lipseste din JSON.`);
        }
    }

    // eroare_default
    if (erori.eroare_default) {
        const campuriDefault = ["titlu", "text", "imagine"];
        for (let camp of campuriDefault) {
            if (!erori.eroare_default[camp]) {
                console.warn(`EROARE: Pentru 'eroare_default' lipseste proprietatea: ${camp}`);
            }
        }
    }

    // folder cale_baza
    const caleBazaAbs = path.join(__dirname, erori.cale_baza || "");
    if (!fs.existsSync(caleBazaAbs)) {
        console.warn(`EROARE: Folderul specificat in 'cale_baza' nu exista: ${caleBazaAbs}`);
    }

    // duplicate identificator și existență imagini
    if (Array.isArray(erori.info_erori)) {
        let idsVazute = {};
        
        for (let i = 0; i < erori.info_erori.length; i++) {
            let err = erori.info_erori[i];

            // Verificare duplicate identificator
            if (idsVazute[err.identificator]) {
                const infoAlteProp = { ...err };
                delete infoAlteProp.identificator;
                console.warn(`EROARE: Identificatorul "${err.identificator}" este duplicat. Date eroare:`, infoAlteProp);
            }
            idsVazute[err.identificator] = true;

            // Verificare existență imagini asociate
            if (err.imagine) {
                const caleImagine = path.join(caleBazaAbs, err.imagine);
                if (!fs.existsSync(caleImagine)) {
                    console.warn(`EROARE: Imaginea pentru eroarea ${err.identificator} nu a fost gasita la: ${caleImagine}`);
                }
            }
        }
    }
}

// Apelare la pornire
validareErori();


function initErori() {
    let continut = fs.readFileSync(path.join(__dirname, "resurse/json/erori.json")).toString("utf-8");
    let erori = obGlobal.obErori = JSON.parse(continut) //transforma fisierul JSON intr-un obiect
    let err_default = erori.eroare_default
    err_default.imagine = path.join(erori.cale_baza, err_default.imagine) //completez path-ul complet prin concatenare
    for (let eroare of erori.info_erori) {
        eroare.imagine = path.join(erori.cale_baza, eroare.imagine)
    }

}
initErori()

function afisareEroare(res, identificator, titlu, text, imagine) {
    //TO DO cautam eroarea dupa identificator
    let eroare = obGlobal.obErori.info_erori.find((elem) =>
        elem.identificator == identificator
    );
    //daca sunt setate titlu, text, imagine, le folosim, 
    //altfel folosim cele din fisierul json pentru eroarea gasita
    //daca nu o gasim, afisam eroarea default
    let errDefault = obGlobal.obErori.eroare_default;
    if (eroare?.status) {
        res.status(eroare.identificator);
    }
    res.render("pagini/eroare", {
        imagine: imagine || eroare?.imagine || errDefault.imagine, // ?. iti returneaza undefined daca nu exista eroarea
        //altfel direct .imagine iti da eroare si crapa
        // also ?. e in loc de if-else somehow da idk
        titlu: titlu || eroare?.titlu || errDefault.titlu,
        text: text || eroare?.text || errDefault.text,
    });

}

//obtinem ora curenta
const acum = new Date();
const oraCurenta = `${acum.getHours().toString().padStart(2, '0')}:${acum.getMinutes().toString().padStart(2, '0')}`;
// const oraCurenta = "13:40" //alt pentru test: 14:00

//OBS! fisierul mediu se face automat in functie de imaginile din galerie
//etapa 5
function initImagini() {

    //citire din fisier
    var continut = fs.readFileSync(path.join(__dirname, "resurse/json/galerie.json")).toString("utf-8");
    obGlobal.obImagini = JSON.parse(continut);
    let vImagini = obGlobal.obImagini.imagini;
    let caleGalerie = obGlobal.obImagini.cale_galerie

    //setare cai absolute
    let caleAbs = path.join(__dirname, caleGalerie);
    let caleAbsMediu = path.join(caleAbs, "mediu");
    const caleAbsMic = path.join(caleAbs, "mic");

    //creare fisiere daca nu exista
    if (!fs.existsSync(caleAbsMediu)) fs.mkdirSync(caleAbsMediu);
    if (!fs.existsSync(caleAbsMic)) fs.mkdirSync(caleAbsMic);

    //punem imaginile de afisat intr-un alt obiect
    let imaginiRezultat = [];
    for (let img of vImagini) {

        // extragere interval orar (ex: "09:00-12:00")
        let interval = img.timp.split("-");
        let oraStart = interval[0];
        let oraSfarsit = interval[1];

        // verificare criteriu timp și limită de 10 imagini
        if (oraCurenta >= oraStart && oraCurenta <= oraSfarsit && imaginiRezultat.length < 10) {

            let numeFisierComplet = img.cale_imagine;
            let numeFisierFaraExt = path.parse(numeFisierComplet).name;
            let extensieNoua = ".webp";

            // căile relative pentru a fi folosite în EJS
            img.fisier = path.join("/", obGlobal.obImagini.cale_galerie, numeFisierComplet);
            img.fisier_mediu = path.join("/", obGlobal.obImagini.cale_galerie, "mediu", numeFisierFaraExt + extensieNoua);
            img.fisier_mic = path.join("/", obGlobal.obImagini.cale_galerie, "mic", numeFisierFaraExt + extensieNoua);

            // scriere imagini mici si medii
            let caleIntrare = path.join(caleAbs, numeFisierComplet);
            sharp(caleIntrare).resize(400).toFile(path.join(caleAbsMediu, numeFisierFaraExt + extensieNoua)).catch(err => console.error(err));
            sharp(caleIntrare).resize(200).toFile(path.join(caleAbsMic, numeFisierFaraExt + extensieNoua)).catch(err => console.error(err));

            imaginiRezultat.push(img);
        }
    }

    // salvare în obiectul global
    obGlobal.obGalerie = imaginiRezultat;

}
initImagini();

//etapa 5
function compileazaScss(caleScss, caleCss) {
    if (!caleCss) {
        //setare cale CSS daca nu exista
        let numeFisExt = path.basename(caleScss); // "folder1/folder2/a.scss" -> "a.scss"
        //BONUS 5.4
        let pozitieUltimulPunct = numeFisExt.lastIndexOf(".");
        let numeFaraExtensie = pozitieUltimulPunct !== -1 ? numeFisExt.substring(0, pozitieUltimulPunct) : numeFisExt;

        caleCss = numeFaraExtensie + ".css";
    }

    //setare cai
    if (!path.isAbsolute(caleCss))
        caleCss = path.join(obGlobal.folderCss, caleCss)

    let caleBackup = path.join(obGlobal.folderBackup, "resurse/css");
    if (!fs.existsSync(caleBackup)) {
        fs.mkdirSync(caleBackup, { recursive: true })
    }

    //salvare backup
    //BONUS 5.3
    // if (fs.existsSync(caleCss)) {
    //     let numeFisCss = path.basename(caleCss); // Ex: "stil.frumos.css"
    //     let pozitiePunctCss = numeFisCss.lastIndexOf(".");

    //     let numeBaza = pozitiePunctCss !== -1 ? numeFisCss.substring(0, pozitiePunctCss) : numeFisCss;
    //     let extensie = pozitiePunctCss !== -1 ? numeFisCss.substring(pozitiePunctCss) : ".css";

    //     // Generăm timestamp-ul
    //     let timestamp = Date.now();
    //     let numeBackupCuTimestamp = `${numeBaza}_${timestamp}${extensie}`; // Ex: stil.frumos_1681124489791.css

    //     try {
    //         fs.copyFileSync(caleCss, path.join(caleBackup, numeBackupCuTimestamp));
    //     } catch (err) {
    //         console.error("Eroare la salvarea backup-ului:", err);
    //     }
    // }

    //compilare
    try {
        let rez = sass.compile(caleScss, { "sourceMap": true });
        fs.writeFileSync(caleCss, rez.css);
    } catch (err) {
        console.error("Eroare la compilare SASS:", err);
    }

}


//la pornirea serverului
vFisiere = fs.readdirSync(obGlobal.folderScss);
for (let numeFis of vFisiere) {
    if (path.extname(numeFis) == ".scss") {
        compileazaScss(numeFis);
    }
}

fs.watch(obGlobal.folderScss, function (eveniment, numeFis) {
    if (eveniment == "change" || eveniment == "rename") {
        let caleCompleta = path.join(obGlobal.folderScss, numeFis);
        if (fs.existsSync(caleCompleta)) {
            compileazaScss(caleCompleta);
        }
    }
})

app.use(function(req, res, next){
    res.locals.optiuni = obGlobal.optiuniMeniu
    res.locals.Drepturi=Drepturi;
    if (req.session.utilizator){
        req.utilizator=res.locals.utilizator=new Utilizator(req.session.utilizator);
        res.locals.mesajLogin=req.session.mesajLogin
    }
    next()
})


app.get(["/", "/index", "/home"], function (req, res) { //cerinta 8
    console.log("get on '/' ")
    res.render("pagini/index", {
        ip: req.ip,
        imagini: obGlobal.obGalerie,
    })
})

app.get("/galerie", function (req, res) {
    console.log("get on '/galerie' ")
    res.render("pagini/galerie", {
        imagini: obGlobal.obGalerie,
    })
})

app.get("/favicon.ico", function (req, res) {
    res.sendFile(path.join(__dirname, "resurse/imagini/favicon/favicon.ico"))
})

app.get("/produse", function(req, res){
    let clauzaWhere=""
    if (req.query.tip)
        clauzaWhere=`where tip_cam='${req.query.tip}'`
    client.query(`select * from cam_view ${clauzaWhere}`, function(err, rez){
        if (err){
            console.log("Eroare", err)
            afisareEroare(res,2)
        }
        else{
            client.query("select * from unnest(enum_range(null::tipuri_cam))", function(err, rezOptiuni){
                if (err){
                    afisareEroare(res,2)
                }
                else{
                    res.render("pagini/produse",{
                        produse:rez.rows,
                        optiuni:rezOptiuni.rows
                    })
                }
            })
            
        }
    })
})

// Ruta pentru afișarea tuturor seturilor de produse
app.get("/seturi", function (req, res) {
    // Interogare complexă pentru a aduce seturile împreună cu toate produsele asociate lor într-un singur query folosind JSON_AGG
    const querySeturi = `
        SELECT s.id AS set_id, s.nume_set, s.descriere_set,
               json_agg(json_build_object(
                   'id', c.id,
                   'nume', c.nume,
                   'pret', c.pret,
                   'imagine', c.imagine
               )) AS produse
        FROM seturi s
        JOIN asociere_set asoc ON s.id = asoc.id_set
        JOIN camere c ON asoc.id_produs = c.id
        GROUP BY s.id, s.nume_set, s.descriere_set
        ORDER BY s.id ASC;
    `;

    client.query(querySeturi, function (err, rezQuery) {
        if (err) {
            console.error("Eroare la preluarea seturilor:", err);
            // Presupunem că ai o funcție afisareEroare definită în index.js
            if (typeof afisareEroare === "function") afisareEroare(res, 500); 
            else res.status(500).send("Eroare Server");
        } else {
            // Calculăm prețul cu reducere pentru fiecare set direct în JS înainte de randare
            let seturiProcesate = rezQuery.rows.map(set => {
                let n = set.produse.length;
                let sumaPreturi = set.produse.reduce((sum, prod) => sum + parseFloat(prod.pret), 0);
                let reducereProcent = Math.min(5, n) * 5; // min(5, n) * 5%
                let pretFinal = sumaPreturi * (1 - reducereProcent / 100);
                
                return {
                    ...set,
                    sumaPreturi: sumaPreturi.toFixed(2),
                    pretFinal: pretFinal.toFixed(2),
                    reducereProcent: reducereProcent
                };
            });

            res.render("pagini/seturi", {
                seturi: seturiProcesate
            });
        }
    });
});

// app.get("/produs/:id", function(req, res){
//     client.query(`select * from cam_view where id=${req.params.id}`, function(err, rez){
//     if (err){
//         console.log("Eroare", err)
//         afisareEroare(res,2)
//     }
//     else{
//         if (rez.rowCount==0){
//             afisareEroare(res,404,"Produs inexistent")
//         }
//         else{
            
//             res.render("pagini/produs",{
//                 prod:rez.rows[0],
//             })
//         }
        
//     }
// })
// })

// Ruta modificată pentru pagina unui singur produs
app.get("/produs/:id", function (req, res) {
    
    // preluam datele produsului curent
    client.query(`SELECT * FROM cam_view WHERE id = ${req.params.id}`, function (err, rezProdus) {
        if (err) {
            console.error("Eroare la preluarea produsului:", err);
            afisareEroare(res, 500);
        } else if (rezProdus.rowCount == 0) {
            afisareEroare(res, 404, "Produs inexistent");
        } else {
            let produsCurent = rezProdus.rows[0];

            // preluam seturile din care face parte camera
            // folosim un sub-query pentru a gasi ID-urile seturilor asociate
            const querySeturiProdus = `
                SELECT s.id AS set_id, s.nume_set, s.descriere_set,
                       json_agg(json_build_object(
                           'id', c.id,
                           'nume', c.nume,
                           'pret', c.pret,
                           'imagine', c.imagine
                       )) AS produse
                FROM seturi s
                JOIN asociere_set asoc ON s.id = asoc.id_set
                JOIN camere c ON asoc.id_produs = c.id
                WHERE s.id IN (
                    SELECT id_set FROM asociere_set WHERE id_produs = ${req.params.id}
                )
                GROUP BY s.id, s.nume_set, s.descriere_set
                ORDER BY s.id ASC;
            `;

            client.query(querySeturiProdus, function (errSeturi, rezSeturi) {
                if (errSeturi) {
                    console.error("Eroare la preluarea seturilor pentru produs:", errSeturi);
                    afisareEroare(res, 500);
                } else {
                    // Pasul 3: Procesăm formulele de reducere pentru fiecare pachet în parte
                    let seturiProcesate = rezSeturi.rows.map(set => {
                        let n = set.produse.length;
                        let sumaPreturi = set.produse.reduce((sum, prod) => sum + parseFloat(prod.pret), 0);
                        let reducereProcent = Math.min(5, n) * 5; // Formula min(5, n) * 5%
                        let pretFinal = sumaPreturi * (1 - reducereProcent / 100);

                        return {
                            ...set,
                            sumaPreturi: sumaPreturi.toFixed(2),
                            pretFinal: pretFinal.toFixed(2),
                            reducereProcent: reducereProcent
                        };
                    });

                    // Pasul 4: Trimitem atât pachetul 'prod', cât și pachetul 'seturi' către template-ul EJS
                    res.render("pagini/produs", {
                        prod: produsCurent,
                        seturi: seturiProcesate
                    });
                }
            });
        }
    });
});

// ==== UTILIZATORI ====

app.post("/inregistrare",function(req, res){
    var username, poza;
    var formular= new formidable.IncomingForm()
    formular.parse(req, function(err, campuriText, campuriFisier ){//4
        console.log("Inregistrare:",campuriText);
        console.log("Campuri fisier:",campuriFisier);
        console.log(poza, username);
        var eroare="";
        var utilizNou =new Utilizator();
        try{
            utilizNou.setareNume=campuriText.nume[0];
            utilizNou.setareUsername=campuriText.username[0];
            utilizNou.email=campuriText.email[0]
            utilizNou.prenume=campuriText.prenume[0]
            utilizNou.parola=campuriText.parola[0];
            utilizNou.culoare_chat=campuriText.culoare_chat[0];
            utilizNou.poza= poza;
            Utilizator.getUtilizDupaUsername(campuriText.username[0], {}, function(u, parametru ,eroareUser ){
                if (eroareUser==-1){
                    utilizNou.salvareUtilizator()
                }
                else{
                    eroare+="Mai exista username-ul";
                }
                if(!eroare){
                    res.render("pagini/inregistrare", {raspuns:"Inregistrare cu succes!"})
                }
                else
                    res.render("pagini/inregistrare", {err: "Eroare: "+eroare});
            })
        }
        catch(e){
            console.log(e);
            eroare+= "Eroare site; reveniti mai tarziu";
            res.render("pagini/inregistrare", {err: "Eroare: "+eroare})
        }

    });
    formular.on("field", function(nume,val){  // 1
        console.log(`--- ${nume}=${val}`);
        if(nume=="username")
            username=val;
    })
    formular.on("fileBegin", function(nume,fisier){ //2
        var folderUser=path.join(__dirname, "poze_uploadate", username);
        if (!fs.existsSync(folderUser))
            fs.mkdirSync(folderUser)
        fisier.filepath=path.join(folderUser, fisier.originalFilename)
        poza=fisier.originalFilename;
        console.log("fileBegin:",poza)
        console.log("fileBegin, fisier:",nume, fisier)
    })    
    formular.on("file", function(nume,fisier){//3
        console.log("file");
        console.log(nume,fisier);
    });
});


app.post("/login",function(req, res){
    var username;
    console.log("ceva");
    var formular= new formidable.IncomingForm()
    formular.parse(req, function(err, campuriText, campuriFisier ){
        var parametriCallback= {
            req:req,
            res:res,
            parola: campuriText.parola[0]
        }
        Utilizator.getUtilizDupaUsername (campuriText.username[0],parametriCallback, 
            function(u, obparam, eroare ){ //proceseazaUtiliz
            let parolaCriptata=Utilizator.criptareParola(obparam.parola)
            if(u.parola== parolaCriptata && u.confirmat_mail){
                u.poza=u.poza?path.join("poze_uploadate",u.username, u.poza):"";
                obparam.req.session.utilizator=u;               
                obparam.req.session.mesajLogin="Bravo! Te-ai logat!";
                obparam.res.redirect("/index");
                
            }
            else{
                console.log("Eroare logare")
                obparam.req.session.mesajLogin="Date logare incorecte sau nu a fost confirmat mailul!";
                obparam.res.redirect("/index");
            }
        })
    });
    
});

app.get("/logout", function(req, res){
    req.session.destroy();
    res.locals.utilizator=null;
    res.render("pagini/logout");
});


//http://${Utilizator.numeDomeniu}/cod/${utiliz.username}/${token}
app.get("/cod/:username/:token",function(req,res){
    try {
        var parametriCallback={
            req:req,
            token:req.params.token
        }
        Utilizator.getUtilizDupaUsername(req.params.username,parametriCallback ,function(u,obparam){
            let parametriCerere={
                tabel:"utilizatori",
                campuri:{confirmat_mail:true},
                conditiiAnd:[`id=${u.id}`]
            };
            AccesBD.getInstanta().update(
                parametriCerere, 
                function (err, rezUpdate){
                    if(err || rezUpdate.rowCount==0){
                        console.log("Cod:", err);
                        afisareEroare(res,3);
                    }
                    else{
                        res.render("pagini/confirmare.ejs");
                    }
                })
        })
    }
    catch (e){
        console.log(e);
        afisareEroare(res,2);
    }
})


app.post("/profil", function(req, res){
    console.log("profil");
    if (!req.session.utilizator){
        afisareEroare(res,403)
        return;
    }
    var formular= new formidable.IncomingForm();
 
    formular.parse(req,function(err, campuriText, campuriFile){
       
        var parolaCriptata=Utilizator.criptareParola(campuriText.parola[0]);
 
        AccesBD.getInstanta().updateParametrizat(
            {tabel:"utilizatori",
            campuri:["nume","prenume","email","culoare_chat"],
            valori:[
                `${campuriText.nume[0]}`,
                `${campuriText.prenume[0]}`,
                `${campuriText.email[0]}`,
                `${campuriText.culoare_chat[0]}`],
            conditiiAnd:[
                `parola='${parolaCriptata}'`,
                `username='${campuriText.username[0]}'`
            ]
        },          
        function(err, rez){
            if(err){
                console.log(err);
                afisareEroare(res,2);
                return;
            }
            console.log(rez.rowCount);
            if (rez.rowCount==0){
                res.render("pagini/profil",{mesaj:"Update-ul nu s-a realizat. Verificati parola introdusa."});
                return;
            }
            else{            
                //actualizare sesiune
                console.log("ceva");
                req.session.utilizator.nume= campuriText.nume[0];
                req.session.utilizator.prenume= campuriText.prenume[0];
                req.session.utilizator.email= campuriText.email[0];
                req.session.utilizator.culoare_chat= campuriText.culoare_chat[0];
                res.locals.utilizator=req.session.utilizator;
            }
 
 
            res.render("pagini/profil",{mesaj:"Update-ul s-a realizat cu succes."});
 
        });
       
 
    });
});




app.get("/useri", function(req, res){

    if(req?.utilizator?.areDreptul(Drepturi.vizualizareUtilizatori)){
        var obiectComanda={
            tabel:"utilizatori",
            campuri:["*"],
            conditiiAnd:[]
        };
        AccesBD.getInstanta().select(obiectComanda, function(err, rezQuery){
            console.log(err);
            res.render("pagini/useri", {useri: rezQuery.rows});
        });
        
    }
    else{
        afisareEroare(res, 403);
    }
    
});




app.post("/sterge_utiliz",  function(req, res){
    if(req?.utilizator?.areDreptul(Drepturi.stergereUtilizatori)){
        var formular= new formidable.IncomingForm();
 
        formular.parse(req,function(err, campuriText, campuriFile){
                var obiectComanda= {
                    tabel:"utilizatori",
                    conditiiAnd:[`id=${campuriText.id_utiliz[0]}`]
                }
                AccesBD.getInstanta().delete(obiectComanda, function(err, rezQuery){
                console.log(err);
                res.redirect("/useri");
            });
        });
    }else{
        afisareEroare(res,403);
    }
    
})

app.get("/*pagina", function (req, res) {

    console.log('cale pagina' + req.url);

    if (req.url.startsWith("/resurse") && path.extname(req.url) == "") {
        afisareEroare(res, 403);
        return;
        //fara return merge in try si face tot restul si crapa
    }

    if (path.extname(req.url) == ".ejs") {
        afisareEroare(res, 400);
        return;
    }

    try {
        res.render("pagini" + req.url, function (err, rezRandare) {
            optiuni:obGlobal.optiuniMeniu.rows
            if (err) {
                if (err?.message.includes("Failed to lookup view")) {
                    afisareEroare(res, 404)
                }
                else {
                    console.error("Eroare la render", err);
                    afisareEroare(res);
                }
                // console.error("Eroare la render", err);
            }
            else {
                res.send(rezRandare);
            }
        });
    }
    catch (err) {
        console.log("Eroare la afisarea paginii -> ", err)
        if (err?.message.includes("Cannot find module")) {
            afisareEroare(res, 404);
        }
    }
})



app.listen(4080);
console.log("Serverul a pornit!");
console.log(oraCurenta);
// console.log(obGlobal.obGalerie)