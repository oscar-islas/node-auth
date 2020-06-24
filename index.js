const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const jwtVerify = require("./middlewares/jwt");
const bcrypt = require("bcryptjs");

const app = express();

let fileUrl = path.join(__dirname, "users.json");

app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());

const readFile = url => {
  return new Promise((resolve, reject) => {
    fs.readFile(url, (error, data) => {
      if (!error) {
        resolve(data);
      } else {
        reject(error);
      }
    });
  });
};

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "register.html"));
});

app.get("/dashboard", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "charts.html"));
});

app.post("/register", (req, res) => {
  fs.readFile(fileUrl, (error, data) => {
    if (!error) {
      let users = JSON.parse(data); //Arreglo de usuarios
      let email = req.body.email;
      let userExist = users.filter(user => user.email === email);
      if (userExist.length > 0) {
        res.status(400).json({
          message: "Ya existe el usuario en la BD"
        });
      } else {
        let password = req.body.password;
        let hash = bcrypt.hashSync(password, 10);
        req.body.password = hash; //sustituiremos la contraseña por la contraseña encriptada
        users.push(req.body);
        fs.writeFile(fileUrl, JSON.stringify(users), error => {
          if (!error) {
            res.json({
              message: "Se ha registrado el usuario satisfactoriamente"
            });
          } else {
            res.json({
              message: "Hubo un error al leer el archivo"
            });
          }
        });
      }
    } else {
      res.status(400).json({
        message: "Hubo un error al leer el archivo"
      });
    }
  });
});

app.post("/login", async (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  try {
    let users = await readFile(fileUrl);
    let userObj = JSON.parse(users).find(user => user.email === email);
    let jwtToken = jwt.sign(
      { email: userObj.email, name: userObj.name, lastname: userObj.lastname },
      "AcademloSecret",
      {
        expiresIn: "1 day"
      }
    ); //Firmar los datos de usuario con la llave privada
    let response = bcrypt.compareSync(password, userObj.password);
    if (response) {
      res.json({
        message: "Has iniciado sesión correctamente",
        token: jwtToken
      });
    } else {
      res.status(401).json({
        message: "Credenciales incorrectas"
      });
    }
  } catch (error) {
    res.status(400).json({
      message: "Hubo un error al leer el archivo",
      error: error.message
    });
  }
});

app.use(jwtVerify);
app.get("/users", async (req, res) => {
  let users = await readFile(fileUrl);
  res.json({ message: JSON.parse(users) });
});

app.delete("/users", async (req, res) => {
  let email = req.body.email;
  let users = await readFile(fileUrl);
  users = JSON.parse(users);
  let index = users.findIndex(user => user.email === email);
  users.splice(index, 1);
  fs.writeFileSync(fileUrl, JSON.stringify(users));
  res.json({
    message: "Se ha eliminado el registro del usuario satisfactoriamente"
  });
});

app.listen(8080, () => {
  console.log("Servidor iniciado en el puerto 8080");
});
