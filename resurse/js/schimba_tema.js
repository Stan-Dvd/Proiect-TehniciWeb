window.addEventListener("DOMContentLoaded", function(){  //declansat dupa ce se citeste HTML-ul, inainte sa se incarce toata pagina
    let butonTema = document.getElementById("schimba_tema");

    // bifam switch-ul daca tema e dark
    if (localStorage.getItem("tema") === "dark" && butonTema) {
        butonTema.checked = true;
    }

    if (butonTema) {
        butonTema.onclick = function(){
            if(document.body.classList.contains("dark")){
                document.body.classList.remove("dark");
                localStorage.removeItem("tema");
            }
            else{
                document.body.classList.add("dark");
                localStorage.setItem("tema","dark");
            }
        }
    }
});