const express = require("express");
const path = require("path");
const fs = require("fs");
const sass = require("sass");

app = express();
app.set("view engine", "ejs")

console.log("Folder index.js", __dirname);
console.log("Folder curent (de lucru)", process.cwd());
console.log("Cale fisier", __filename);

app.get(["/", "/index", "/home"], function (req, res) { //cerinta 8
    console.log("get on '/' ")
    res.render("pagini/index", {
        ip:req.ip,
    })
})

app.get("/favicon.ico", function(req, res){
    res.sendFile(path.join(__dirname, "resurse/imagini/favicon/favicon.ico"))
})

obGlobal = {
    obErori: null,
    obImagini: null,
    folderScss: path.join(__dirname, "resurse/scss"),
    folderCss: path.join(__dirname, "resurse/css"),
    folderBackup: path.join(__dirname, "backup"),
}

vect_foldere = [
    "temp", "logs", "backup", "fisiere_uploadate"
]

for( let folder of vect_foldere){
    let caleFolder = path.join(__dirname, folder);
    if(!fs.existsSync(caleFolder)){
        fs.mkdirSync(caleFolder, {recursive: true});
    }
}

app.use("/resurse", express.static(path.join(__dirname, "resurse")))
//orice caut in /resurse cauta in acest folder


app.get("/what", function (req, res) {
    res.write("123");
    res.write("456");
    res.end();
})

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
        imagine: imagine || eroare?.imagine || err_default.imagine, // ?. iti returneaza undefined daca nu exista eroarea
        //altfel direct .imagine iti da eroare si crapa
        // also ?. e in loc de if-else somehow da idk
        titlu: titlu || eroare?.titlu || err_default.titlu,
        text: text || eroare?.text || err_default.text,
    });

}

app.get("/eroare", function (req, res) {
    afisareEroare(res, 404, "Error 404 - no tengo dinero")
});

app.get("/*pagina", function (req, res) {

    if(req.url.startsWith("/resurse") && path.extname(req.url)==""){
        afisareEroare(res, 403);
        return;
        //fara return merge in try si face tot restul si crapa
    }

    if(path.extname(req.url) == ".ejs"){
        afisareEroare(res, 400);
        return;
    }

    try {
        res.render("pagini" + req.url, function (err, rezRandare) {
            if (err) {
                if (err?.message.includes("Failed to lookup view")) {
                    afisareEroare(res, 404)
                }
                else{
                    afisareEroare(res);
                }
            }
            else{
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