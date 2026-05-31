//setCookie("a",10, 1000)
function setCookie(nume, val, timpExpirare){//timpExpirare in milisecunde
    d=new Date();
    d.setTime(d.getTime()+timpExpirare)
    document.cookie=`${nume}=${val}; expires=${d.toUTCString()}`;
}

function getCookie(nume){
    vectorParametri=document.cookie.split(";") // ["a=10","b=ceva"]
    for(let param of vectorParametri){
        if (param.trim().startsWith(nume+"="))
            return param.split("=")[1]
    }
    return null;
}

function deleteCookie(nume){
    console.log(`${nume}; expires=${(new Date()).toUTCString()}`)
    document.cookie=`${nume}=0; expires=${(new Date()).toUTCString()}`;
}

function deleteAllCookies() {
    let vectorParametri = document.cookie.split(";");
    for (let param of vectorParametri) {
        let numeCookie = param.split("=")[0].trim();
        if (numeCookie) {
            deleteCookie(numeCookie);
        }
    }
    console.log("Toate cookie-urile au fost sterse.");
}

window.addEventListener("DOMContentLoaded", function(){
    if (getCookie("acceptat_banner")){
        document.getElementById("banner").style.display="none";
    }

    this.document.getElementById("ok_cookies").onclick=function(){
        setCookie("acceptat_banner",true,43200000); // timp de jumatate de zi
        // setCookie("acceptat_banner",true,5000); //timp de 5s pt testare
        document.getElementById("banner").style.display="none"
    }
})

window.addEventListener("DOMContentLoaded", function() {
    let articoleProduse = document.querySelectorAll(".produs"); // selectam toate articolele de tip produs
    
    articoleProduse.forEach(function(articol) {
        // presupunem ca fiecare articol are un link sau titlu pe care se da click pentru detalii
        let linkProdus = articol.querySelector("h3 a") || articol.querySelector(".val-nume a") || articol.querySelector("a"); 
        
        if(linkProdus) {
            linkProdus.addEventListener("click", function() {
                // extragem numele produsului si idul sau urlul sau
                let numeProdus = linkProdus.innerText;
                let urlProdus = linkProdus.getAttribute("href");
                
                // stocam datele sub forma de string json in cookie, valabil jumatate de zi (43200000 ms)
                let dateProdus = JSON.stringify({ nume: numeProdus, url: urlProdus });
                setProdusCookie("ultimul_produs", dateProdus, 43200000);
            });
        }
    });
});

// afisarea linkului la incarcarea paginii de produse
window.addEventListener("DOMContentLoaded", function() {
    let container = document.getElementById("container-ultimul-produs");
    let cookieUltimulProdus = getProdusCookie("ultimul_produs");

    if (cookieUltimulProdus && container) {
        try {
            let dateProdus = JSON.parse(cookieUltimulProdus);
            
            // generam structura html pentru link
            container.innerHTML = `Ultimul produs vizitat: <a href="${dateProdus.url}">${dateProdus.nume}</a>`;
        } catch (e) {
            console.error("eroare la parsarea cookieului pentru ultimul produs", e);
        }
    }
});