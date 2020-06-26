const express = require("express");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");
const jwtVerify = require("./middlewares/jwt");
const bcrypt = require("bcryptjs");
const cookieParser = require("./middlewares/cookie-parser");
const cors = require('cors');
const app = express();
const port = process.env.PORT || 8080;

let fileUrl = path.join(__dirname, "users.json");
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

const readFile = pathURL => {
  return new Promise((resolve, reject) => {
    fs.readFile(pathURL, (error, data) => {
      if (!error) {
        resolve(data);
      } else {
        reject(error);
      }
    });
  });
};

const writeFileJSON = (pathURL, data) => {
    fs.writeFile(pathURL, JSON.stringify(data), (error) => {
        if(error){
            return Promise.reject(error);
        }else{
            return Promise.resolve();
        }
    })
}

app.use(cookieParser);

//Middleware en caso de que el usuario se encuentre loggeado
app.get('/', jwtVerify, (req, res) => {
    res.redirect('/dashboard');    
});

app.get("/login", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.get("/tables", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "tables.html"));
})

app.get("/register", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "register.html"));
});

app.get("/dashboard", jwtVerify, (req, res) => {
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
        users.push(req.body); //Guardaremos el usuario en el arreglo de usuarios
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
    let expiration = new Date();
    expiration.setDate(expiration.getDate() + 1);
    if (response) {
        res.cookie('token', jwtToken, {expires: expiration, httpOnly: true});
        res.redirect('/dashboard');
        // res.json({
        //     message: "Has iniciado sesión correctamente",
        //     token: jwtToken
        // });
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
  users = JSON.parse(users);
  let htmlO = "";
  for(let i = 0; i < users.length; i++){
    htmlO+= "<li>"+users[i].name+" "+users[i].lastname+"</li>";
  }
  res.send("<ul>"+htmlO+"</ul>");
//   res.json({ message: JSON.parse(users) });
});

app.post("/transfer", (req, res) => {
    let client = req.user.email;
    let userToTransfer = req.body.user;
    console.log("La transferencia se ha hecho con exito del usuario "+ client + " a: "+ userToTransfer);
    res.json({message: "La transferencia se ha hecho con exito del usuario "+ client + " a: "+ userToTransfer});
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

app.listen(port, () => {
  console.log("Servidor iniciado en el puerto 8080");
});
