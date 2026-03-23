const express= require("express");
const path= require("path");

app= express();
app.set("view engine", "ejs")

console.log("Folder index.js", __dirname);
console.log("Folder curent (de lucru)", process.cwd());
console.log("Cale fisier", __filename);

app.get("/", function(req, res){
    console.log("get on '/' ")
    res.render("pagini/index")
})

// app.get()

app.use("/resurse", express.static(path.join(__dirname, "resurse")))
//orice caut in /resurse cauta in acest folder


app.get("/what", function(req, res){
    res.write("123");
    res.write("456");
    res.end();
})

app.listen(4080);
console.log("Serverul a pornit!");