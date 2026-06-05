document.addEventListener("DOMContentLoaded", function () {
    // incarcam starea salvata din localStorage
    let acorduriDeschise = JSON.parse(localStorage.getItem("acordeoaneDeschise")) || [];

    // aplicam starea salvata
    acorduriDeschise.forEach(id => {
        let elementCollapse = document.getElementById(`collapse-${id}`);
        let butonAcordeon = document.querySelector(`[data-bs-target="#collapse-${id}"]`);
        
        if (elementCollapse && butonAcordeon) {
            elementCollapse.classList.add("show"); // deschide conținutul
            butonAcordeon.classList.remove("collapsed"); // modifică aspectul butonului
            butonAcordeon.setAttribute("aria-expanded", "true");
        }
    });

    // ascultăm evenimentele de deschidere/închidere pentru a actualiza localStorage
    const butoane = document.querySelectorAll(".btn-acordeon");
    
    butoane.forEach(buton => {
        let prodId = buton.getAttribute("data-prod-id");
        let tintaCollapse = document.querySelector(buton.getAttribute("data-bs-target"));

        if (tintaCollapse) {
            // eveniment declansat de Bootstrap cand acordeonul s-a deschis complet
            tintaCollapse.addEventListener('shown.bs.collapse', function () {
                if (!acorduriDeschise.includes(prodId)) {
                    acorduriDeschise.push(prodId);
                    localStorage.setItem("acordeoaneDeschise", JSON.stringify(acorduriDeschise));
                }
            });

            // eveniment declanaat de Bootstrap cand acordeonul s-a închis complet
            tintaCollapse.addEventListener('hidden.bs.collapse', function () {
                acorduriDeschise = acorduriDeschise.filter(id => id !== prodId);
                localStorage.setItem("acordeoaneDeschise", JSON.stringify(acorduriDeschise));
            });
        }
    });
});