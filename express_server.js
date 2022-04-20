const generateRandomString = () => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const express = require('express');
const req = require('express/lib/request');
const bodyParser = require('body-parser');
const res = require('express/lib/response');
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "www.lighthouselabs.ca",
  "9sm5xK": "www.google.com"
};


app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const templateVars = {
  //username: req.cookies["username"],
};
// res.render("urls_index", templateVars);
// res.render("urls_show", templateVars);
// res.render("urls_new", templateVars);


app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie("username"); 
  res.redirect('/urls');
});

app.post("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const longURL = req.body.newLongURL;
  if (longURL) {
    urlDatabase[shortURL] = longURL;
  }  
  res.redirect(`/urls/${shortURL}`)
});

app.post("/urls/:shortURL/delete", (req, res) =>{
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const generatedURL = generateRandomString();
  urlDatabase[generatedURL] = req.body.longURL;
  res.redirect(`/urls/${generatedURL}`);
});

app.get("/u/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  //const longURL = urlDatabase[shortURL];
  //console.log(shortURL);
  const longURL = urlDatabase[shortURL];
  res.redirect(`https://${longURL}`);
});

app.get('/', (req, res) => {
  res.send("Hello!");
});

app.get("/urls/new", (req, res) => {
  const templateVars = {
    username: req.cookies["username"]
  };
  res.render("urls_new");
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  console.log(shortURL)
  console.log(urlDatabase)
  const templateVars = { 
    shortURL: shortURL, 
    longURL: urlDatabase[shortURL],
    username: req.cookies["username"]
  };
  console.log(urlDatabase[shortURL]);
  if (urlDatabase[shortURL] !== undefined) {
    res.render("urls_show", templateVars);
  } else {
    res.status = 404;
    res.send("404 Page Not Found");
  }
});

app.get("/urls", (req, res) => {
  const templateVars = { 
    username: req.cookies["username"],
    urls: urlDatabase 
  };
  res.render("urls_index", templateVars);
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b><html>\n");
});


// -- TEST CODE --

// app.get("/set", (req, res) => {
//   const a = 1;
//   res.send(`a = ${a}`);
// });

// app.get('/fetch', (req, res) => {
//   res.send(`a = ${a}`);
// });

// -- END TEST CODE --


app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});