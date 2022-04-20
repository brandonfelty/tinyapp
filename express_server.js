const generateRandomString = () => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

const searchForEmail = (userDB, email) => {
  for (const user in userDB) {
    if (userDB[user].email === email) {
      return true;
    }
  }
  return false;
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

const users = {};


app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

const templateVars = {
  //username: req.cookies["username"],
};
// res.render("urls_index", templateVars);
// res.render("urls_show", templateVars);
// res.render("urls_new", templateVars);

app.post("/register", (req, res) => {
  const userId = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const user = users[userId];
  
  if (!email) {
    return res.status(400).send('Invalid email');
  }
      
  if (searchForEmail(users, email)) {
    return res.status(400).send("Email is already in use");
  }
      
  users[userId] = {
    userId,
    email,
    password
  };

  res.cookie("user_id", userId);
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  res.cookie('username', req.body.username);
  res.redirect('/urls');
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id"); 
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

app.get('/register', (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  //console.log(user) ;
  const templateVars = {
    user
  };
  //console.log(templateVars.user)
  res.render("urls_registration", templateVars)
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
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const templateVars = {
    user
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:shortURL", (req, res) => {
  const shortURL = req.params.shortURL;
  const userId = req.cookies["user_id"];
  const user = users[userId];
  // console.log(shortURL)
  // console.log(urlDatabase)
  const templateVars = { 
    user,
    shortURL: shortURL, 
    longURL: urlDatabase[shortURL]
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
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const templateVars = { 
    user,
    urls: urlDatabase 
  };
  //console.log(templateVars.user.email);
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