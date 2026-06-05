window.onload = function () {

    //TODO: verificare inputuri, foloseste "expresii regulate", vezi site-ul regex101.com
    //cica o sa ai 3 inputuri de verificat
    //o sa trebuiasca sa explici expresii regulate, vezi ppt javascript, slide ~ 85
    //nu trb sa ai expresii regulate complexe, daca ai doar sa fie toate litere e ok

    //schimbarea temei nu e predata, restul la munca

    //actualizeaza inputul de tip range
    document.getElementById("inp-rezolutie").oninput = function () {
        let val = this.value.trim();
        document.getElementById("infoRezolutie").innerHTML = `(${val} Mpx)`;
    };

    function validareInput() {
        let inpNume = document.getElementById("inp-nume").value.trim();
        let inpBrand = document.getElementById("inp-brand").value.trim();
        let inpCuvinte = document.getElementById("inp-cuvinte").value.trim();

        // nume: doar litere, numere, spații și cratime
        if (inpNume !== "") {
            //OBS! + inseamna ca trb sa aiba cel putin un caracter valid
            let regexNume = /^[a-zA-Z0-9\s-]+$/;
            if (!regexNume.test(inpNume)) {
                alert("Eroare Validare Nume: Câmpul poate conține doar litere, numere, spații și cratime ('-').");
                return false;
            }
        }

        // brand: un singur cuvânt, doar litere
        if (inpBrand !== "") {
            let regexBrand = /^[a-zA-Z]+$/;
            if (!regexBrand.test(inpBrand)) {
                alert("Eroare Validare Brand: Câmpul trebuie să conțină un singur cuvânt format exclusiv din litere.");
                return false;
            }
        }

        // cuvinte cheie: grupuri care încep obligatoriu cu + sau - urmate de litere/numere/cratime
        if (inpCuvinte !== "") {
            let tokenuri = inpCuvinte.split(/\s+/); //delimitare folosind expresie regulata - unul sau > spatii
            let regexCuvantCheie = /^[+-][a-zA-Z0-9-]+$/;

            for (let token of tokenuri) {
                if (!regexCuvantCheie.test(token)) {
                    alert("Eroare Validare Cuvinte Cheie: Fiecare cuvânt trebuie să înceapă cu '+' sau '-' și să conțină doar litere, numere și cratime (ex: +4k -second-hand).");

                    // adauga clasa de eroare pentru floating label
                    document.getElementById("inp-cuvinte").classList.add("is-invalid");
                    return false;
                }
            }
        }

        // dacă totul este în regulă, curățăm clasa de eroare dacă exista
        document.getElementById("inp-cuvinte").classList.remove("is-invalid");
        return true;
    }

    function filtrare() {
        // preluare valori
        let inpNume = document.getElementById("inp-nume").value.trim().toLowerCase();
        let inpCategorie = document.getElementById("inp-categorie").value.trim().toLowerCase();
        let rezolutieMin = parseInt(document.getElementById("inp-rezolutie").value);
        let brandSelectat = document.getElementById("inp-brand").value.trim().toLowerCase();

        // preluare val radio
        let radioSenzor = document.getElementsByName("gr_senzor");
        let senzorSelectat = "toate"; //valoare default
        for (let r of radioSenzor) {
            if (r.checked) {
                senzorSelectat = r.value;
                break;
            }
        }

        // IBIS
        let ibisDoarActive = document.getElementById("inp-ibis").checked;

        // textarea
        let textCuvinte = document.getElementById("inp-cuvinte").value.trim();
        let cuvintePlus = [];
        let cuvinteMinus = [];

        if (textCuvinte.length > 0) {
            // impartim textul in spatii
            let tokenuri = textCuvinte.split(/\s+/);
            for (let token of tokenuri) {
                if (token.startsWith("+") && token.length > 1) {
                    cuvintePlus.push(token.substring(1).toLowerCase());
                } else if (token.startsWith("-") && token.length > 1) {
                    cuvinteMinus.push(token.substring(1).toLowerCase());
                }
            }
        }

        // preluare intervale din Select-ul Multiplu
        let selectMultiplu = document.getElementById("inp-intervale-pret");
        let intervaleSelectate = [];
        for (let opt of selectMultiplu.options) {
            if (opt.selected) {
                let parti = opt.value.split("-");
                intervaleSelectate.push({
                    min: parseFloat(parti[0]),
                    max: parseFloat(parti[1])
                });
            }
        }


        // parcurgerea produselor din DOM
        let produse = document.getElementsByClassName("produs");

        for (let prod of produse) {
            // colectare specificatii produs
            let numeProd = prod.getElementsByClassName("val-nume")[0].textContent.trim().toLowerCase();
            let categorieProd = prod.getElementsByClassName("val-categorie")[0].textContent.trim().toLowerCase();
            let rezolutieProd = parseInt(prod.getElementsByClassName("val-rezolutie")[0].textContent.trim());
            let brandProd = prod.getElementsByClassName("val-brand")[0].textContent.trim().toLowerCase();
            let senzorProd = prod.getElementsByClassName("val-senzor")[0].textContent.trim().toLowerCase();
            let ibisProdTxt = prod.getElementsByClassName("val-ibis")[0].textContent.trim().toLowerCase();
            let descriereProd = prod.getElementsByClassName("val-descriere")[0].textContent.trim().toLowerCase();
            let pretProd = parseFloat(prod.getElementsByClassName("val-pret")[0].textContent.trim());

            prod.style.display = "none";

            //nume
            let condNume = numeProd.includes(inpNume);

            //categorie
            let condCategorie = (inpCategorie === "toate") || categorieProd.includes(inpCategorie);

            // rezoluție minimă
            let condRezolutie = rezolutieProd >= rezolutieMin;

            // brand (Datalist)
            let condBrand = (brandSelectat === "") || (brandProd === brandSelectat);

            // tip Senzor (Radio)
            let condSenzor = (senzorSelectat === "toate") || (senzorProd === senzorSelectat);

            // IBIS (Checkbox)
            let condIbis = true;
            if (ibisDoarActive) {
                condIbis = (ibisProdTxt === "true" || ibisProdTxt === "da" || ibisProdTxt === "yes");
            }

            // textarea
            let condTextarea = true;
            if (cuvintePlus.length > 0) { // cuvinte plus
                let areMultePlus = cuvintePlus.some(cuvant => descriereProd.includes(cuvant));
                if (!areMultePlus) condTextarea = false;
            }
            if (cuvinteMinus.length > 0) { // cuvinte minus
                let areInterziseMinus = cuvinteMinus.some(cuvant => descriereProd.includes(cuvant));
                if (areInterziseMinus) condTextarea = false;
            }

            // select multiplu preturi
            let condPretInterval = true;
            if (intervaleSelectate.length > 0) {
                condPretInterval = intervaleSelectate.some(interv => pretProd >= interv.min && pretProd <= interv.max);
            }

            // filtrare efecitva
            if (condNume && condCategorie && condRezolutie && condBrand && condSenzor && condIbis && condTextarea && condPretInterval) {
                prod.style.display = "block";
            }
        }
        let chkSalveaza = document.getElementById("inp-salveaza-filtre");
        if (chkSalveaza && chkSalveaza.checked) {
            let obiectFiltre = {
                nume: document.getElementById("inp-nume").value,
                categorie: document.getElementById("inp-categorie").value,
                rezolutie: document.getElementById("inp-rezolutie").value,
                brand: document.getElementById("inp-brand").value,
                senzor: senzorSelectat,
                ibis: ibisDoarActive,
                cuvinte: textCuvinte,
                intervalePret: Array.from(document.getElementById("inp-intervale-pret").options).map(opt => opt.selected)
            };
            localStorage.setItem("filtre_salvate", JSON.stringify(obiectFiltre));
        } else {
            // Dacă utilizatorul filtrează având căsuța DEBIFATĂ, opțional poți șterge vechea salvare
            localStorage.removeItem("filtre_salvate");
        }
    };

    document.getElementById("filtrare").onclick = function () {
        if (!validareInput()) return;

        // sterge parametrii din URL fără a reîncărca pagina (pentru atunci cand intri din meniu in pagina)
        if (window.location.search !== "") { // daca exista parametrii in URL
            // inlocuiește URL-ul curent cu calea simpla
            window.history.replaceState({}, document.title, window.location.pathname);
        }

        filtrare();
    }


    document.getElementById("resetare").onclick = function () {
        if (confirm("Doriți să resetați toate filtrele aplicate?")) {
            //stergere filtre salvate
            document.getElementById("inp-salveaza-filtre").checked = false;
            localStorage.removeItem("filtre_salvate");

            // Resetare filtre reintroduse
            document.getElementById("inp-nume").value = "";
            document.getElementById("inp-categorie").value = "toate";

            // Resetare celelalte controale
            document.getElementById("inp-rezolutie").value = 2;
            document.getElementById("infoRezolutie").innerHTML = "(2 Mpx)";
            document.getElementById("inp-brand").value = "";
            document.getElementById("senzor_toate").checked = true;
            document.getElementById("inp-ibis").checked = false;
            document.getElementById("inp-cuvinte").value = "";

            let selectMultiplu = document.getElementById("inp-intervale-pret");
            for (let opt of selectMultiplu.options) {
                opt.selected = false;
            }

            // Reafișarea tuturor produselor
            letGrid = document.getElementsByClassName("produs");
            for (let prod of letGrid) {
                prod.style.display = "block";
            }
        }
    };



    function sortare(semn) {
        let produse = document.getElementsByClassName("produs");
        let vProduse = Array.from(produse);

        // console.log(vProduse);
        vProduse.sort(function (a, b) {
            //a, b sunt taguri <article>, trb sa definim o functie de sortare
            let pretA = parseFloat(a.getElementsByClassName("val-pret")[0].innerHTML.trim()); // trim taie spatiile din cuvant
            let pretB = parseFloat(b.getElementsByClassName("val-pret")[0].innerHTML.trim());
            if (pretA == pretB) {
                let numeA = a.getElementsByClassName("val-nume")[0].innerHTML.trim()
                let numeB = b.getElementsByClassName("val-nume")[0].innerHTML.trim()
                return semn * numeA.localeCompare(numeB); // local compare compara stringurile in functie de limba setata
            }
            return (pretA - pretB) * semn
        })
        for (let prod of vProduse) {
            prod.parentElement.appendChild(prod)
        }
    }

    document.getElementById("sortCrescNume").onclick = function () { if (!validareInput()) return; filtrare(); sortare(1) };
    document.getElementById("sortDescrescNume").onclick = function () { if (!validareInput()) return; sortare(-1) };

    document.getElementById("calculaSuma").onclick = function () {
        if (!validareInput()) return;
        filtrare();
        // console.log(e)
        let produse = document.getElementsByClassName("produs")
        let suma = 0
        for (let prod of produse) {
            if (prod.style.display != "none") { // calculam doar pt prod afisate
                let pret = parseFloat(prod.getElementsByClassName("val-pret")[0].innerHTML.trim())
                suma += pret;
            }
        }

        let p = document.getElementById("infoSuma");
        if (!p) { // ca sa nu apara de fiecare data cand apas alt-c
            p = document.createElement("p") // <p>
            p.innerHTML = "Suma totala pt produsele afisate: " + suma;
            p.id = "infoSuma"
            p.className = "fw-bold mt-3 text-center text-dark";
            let sectiuneProduse = document.getElementById("produse")
            sectiuneProduse.parentElement.insertBefore(p, sectiuneProduse)

            setTimeout(function () {
                let p1 = document.getElementById("infoSuma")
                if (p1) {
                    p1.remove()
                }
            }, 2000) //dispare automat dupa 2000ms = 2s
        }
        else //daca exista deja, ii dau update
            p.innerHTML = "Suma totala pt produsele afisate: " + suma;

    }

    //aplicare filtru din req parameter

    const urlParams = new URLSearchParams(window.location.search);
    const tipParam = urlParams.get('tip');

    //daca exista parametrul pt tip, il pune in filtre si executa filtrarea
    if (tipParam) {
        let selectCategorie = document.getElementById("inp-categorie");
        if (selectCategorie) {
            //seteaza valoarea din select
            selectCategorie.value = tipParam;
            // da automat click pe butonul de filtrare
            let butonFiltrare = document.getElementById("filtrare");
            if (butonFiltrare) {
                butonFiltrare.click();
            }
        }
    }

// ==== filtre persistente ====

    const filtreSalvateRaw = localStorage.getItem("filtre_salvate");

    // Aplicăm filtrele persistente doar dacă NU avem un parametru "?tip" activ în URL
    if (filtreSalvateRaw && !tipParam) {
        try {
            const filtre = JSON.parse(filtreSalvateRaw);

            // Restaurare valori inputuri simple
            document.getElementById("inp-nume").value = filtre.nume;
            document.getElementById("inp-categorie").value = filtre.categorie;
            document.getElementById("inp-rezolutie").value = filtre.rezolutie;
            document.getElementById("infoRezolutie").innerHTML = `(${filtre.rezolutie} Mpx)`;
            document.getElementById("inp-brand").value = filtre.brand;
            document.getElementById("inp-cuvinte").value = filtre.cuvinte;
            document.getElementById("inp-salveaza-filtre").checked = true;

            // Restaurare butoane radio (Tip Senzor)
            let radioSenzor = document.getElementsByName("gr_senzor");
            for (let r of radioSenzor) {
                r.checked = (r.value === filtre.senzor);
            }

            // Restaurare checkbox IBIS
            document.getElementById("inp-ibis").checked = filtre.ibis;

            // Restaurare selecție multiplă (Intervale Preț)
            let selectMultiplu = document.getElementById("inp-intervale-pret");
            if (filtre.intervalePret && selectMultiplu) {
                for (let i = 0; i < selectMultiplu.options.length; i++) {
                    if (filtre.intervalePret[i] !== undefined) {
                        selectMultiplu.options[i].selected = filtre.intervalePret[i];
                    }
                }
            }

            // Reapelăm funcția de filtrare pentru a ascunde produsele necorespunzătoare
            filtrare();
        } catch (e) {
            console.error("Eroare la restaurarea filtrelor din localStorage:", e);
        }
    }

}