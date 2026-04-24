const express = require("express");
const path = require("path");
const fs = require("fs");
const sass = require("sass");
const sharp = require("sharp");

//parola BD: SQLpa55

app = express();
app.set("view engine", "ejs")

console.log("Folder index.js", __dirname);
console.log("Folder curent (de lucru)", process.cwd());
console.log("Cale fisier", __filename);


obGlobal = {
    obErori: null,
    obImagini: null,
    obGalerie: null,
    folderScss: path.join(__dirname, "resurse/scss"),
    folderCss: path.join(__dirname, "resurse/css"),
    folderBackup: path.join(__dirname, "backup"),
}

vect_foldere = [
    "temp", "logs", "backup", "fisiere_uploadate", "backup"
]

for (let folder of vect_foldere) {
    let caleFolder = path.join(__dirname, folder);
    if (!fs.existsSync(caleFolder)) {
        fs.mkdirSync(caleFolder, { recursive: true });
    }
}

app.use("/resurse", express.static(path.join(__dirname, "resurse")))
app.use("/dist", express.static(path.join(__dirname, "node_modules/dist")))

//orice caut in /resurse cauta in acest folder


// app.get("/what", function (req, res) {
//     res.write("123");
//     res.write("456");
//     res.end();
// })

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
    let errDefault = obGlobal.obErori.err_default;
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

// app.get("*/galerie-animata.css",function(req, res){

//     var sirScss=fs.readFileSync(path.join(__dirname,"resurse/scss_ejs/galerie_animata.scss")).toString("utf8");
//     var culori=["navy","black","purple","grey"];
//     var indiceAleator=Math.floor(Math.random()*culori.length);
//     var culoareAleatoare=culori[indiceAleator]; 
//     rezScss=ejs.render(sirScss,{culoare:culoareAleatoare});
//     console.log(rezScss);
//     var caleScss=path.join(__dirname,"temp/galerie_animata.scss")
//     fs.writeFileSync(caleScss,rezScss);
//     try {
//         rezCompilare=sass.compile(caleScss,{sourceMap:true});

//         var caleCss=path.join(__dirname,"temp/galerie_animata.css");
//         fs.writeFileSync(caleCss,rezCompilare.css);
//         res.setHeader("Content-Type","text/css");
//         res.sendFile(caleCss);
//     }
//     catch (err){
//         console.log(err);
//         res.send("Eroare");
//     }
// });

// app.get("*/galerie-animata.css.map",function(req, res){
//     res.sendFile(path.join(__dirname,"temp/galerie-animata.css.map"));
// });

// app.get("/eroare", function (req, res) {
//     afisareEroare(res, 404, "Error 404 - no tengo dinero")
// });

// ==== GALERIE ====

//obtinem ora curenta
const acum = new Date();
// const oraCurenta = `${acum.getHours().toString().padStart(2, '0')}:${acum.getMinutes().toString().padStart(2, '0')}`;
const oraCurenta = "13:00"

//OBS! fisierul mediu se face automat in functie de imaginile din galerie
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


    // for (let imag of vImagini) {
    //     [numeFis, ext] = imag.fisier.split("."); //"ceva.png" -> ["ceva", "png"]
    //     let caleFisAbs = path.join(caleAbs, imag.fisier);
    //     let caleFisMediuAbs = path.join(caleAbsMediu, numeFis + ".webp");
    //     sharp(caleFisAbs).resize(300).toFile(caleFisMediuAbs); // o sa ai de facut asta si pentru mobil, cu folder small
    //     imag.fisier_mediu = path.join("/", caleGalerie, "mediu", numeFis + ".webp")
    //     imag.fisier = path.join("/", caleGalerie, imag.fisier)
    // }

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

function compileazaScss(caleScss, caleCss) {
    if (!caleCss) {
        let numeFisExt = path.basename(caleScss); // "folder1/folder2/a.scss" -> "a.scss"
        //BONUS 5.4
        let pozitieUltimulPunct = numeFisExt.lastIndexOf(".");
        let numeFaraExtensie = pozitieUltimulPunct !== -1 ? numeFisExt.substring(0, pozitieUltimulPunct) : numeFisExt;

        caleCss = numeFaraExtensie + ".css";
    }

    //setare cai
    if (!path.isAbsolute(caleScss))
        caleScss = path.join(obGlobal.folderScss, caleScss)
    if (!path.isAbsolute(caleCss))
        caleCss = path.join(obGlobal.folderCss, caleCss)

    let caleBackup = path.join(obGlobal.folderBackup, "resurse/css");
    if (!fs.existsSync(caleBackup)) {
        fs.mkdirSync(caleBackup, { recursive: true })
    }

    //salvare backup
    //BONUS 5.3
    if (fs.existsSync(caleCss)) {
        let numeFisCss = path.basename(caleCss); // Ex: "stil.frumos.css"
        let pozitiePunctCss = numeFisCss.lastIndexOf(".");

        let numeBaza = pozitiePunctCss !== -1 ? numeFisCss.substring(0, pozitiePunctCss) : numeFisCss;
        let extensie = pozitiePunctCss !== -1 ? numeFisCss.substring(pozitiePunctCss) : ".css";

        // Generăm timestamp-ul
        let timestamp = Date.now();
        let numeBackupCuTimestamp = `${numeBaza}_${timestamp}${extensie}`; // Ex: stil.frumos_1681124489791.css

        try {
            fs.copyFileSync(caleCss, path.join(caleBackup, numeBackupCuTimestamp));
        } catch (err) {
            console.error("Eroare la salvarea backup-ului:", err);
        }
    }

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


app.get(["/", "/index", "/home"], function (req, res) { //cerinta 8
    console.log("get on '/' ")
    res.render("pagini/index", {
        ip: req.ip,
        imagini: obGlobal.obGalerie
    })
})

app.get("/galerie", function (req, res) { //cerinta 8
    console.log("get on '/galerie' ")
    res.render("pagini/galerie", {
        imagini: obGlobal.obGalerie
    })
})

app.get("/favicon.ico", function (req, res) {
    res.sendFile(path.join(__dirname, "resurse/imagini/favicon/favicon.ico"))
})

app.get("/*pagina", function (req, res) {

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
        console.log("Eroare la afisarea paginii", err)
        if (err?.message.includes("Cannot find module")) {
            afisareEroare(res, 404);
        }
    }
})

app.listen(4080);
console.log("Serverul a pornit!");
console.log(oraCurenta);
// console.log(obGlobal.obGalerie)