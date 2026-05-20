window.addEventListener("DOMContentLoaded", function() { //altfel risti sa modifici body inainte ca acesta sa se fi incarcat
    if (localStorage.getItem("tema") === "dark") {
        document.body.classList.add("dark");
    } else {
        document.body.classList.remove("dark");
    }
});