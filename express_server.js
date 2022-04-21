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

const urlsForUser = (id) => {
  let userDB = {};
  for (const shortURL in urlDatabase) {
    //console.log(urlDatabase)
   if (urlDatabase[shortURL].userID === id) {
     userDB[shortURL] = urlDatabase[shortURL].longURL;
   }
 };
 return userDB;
}

const express = require('express');
const req = require('express/lib/request');
const bodyParser = require('body-parser');
const res = require('express/lib/response');
const app = express();
const PORT = 8080;
const cookieParser = require('cookie-parser');

app.set("view engine", "ejs");

const urlDatabase = {
  "b6UTxQ": { 
          longURL: "www.tsn.ca",
          userID: "aJ48lW"
    },
    "9sm5xK": {
          longURL: "www.google.com",
          userID: "aJ48lW"
    }
};

const users = {};

app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

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
  const email = req.body.email;
  const password = req.body.password;

  // email not found

  if (!searchForEmail(users, email)) {
    return res.status(403).send("Email cannot be found");
  }
  
  for (const user in users) {
    if (users[user].password === password) {
      res.cookie("user_id", users[user].userId)
      return res.redirect('/urls');
    }
  }
  return res.status(403).send("Password incorrect")
});

app.post("/logout", (req, res) => {
  res.clearCookie("user_id"); 
  res.redirect('/urls');
});

app.post("/urls/:shortURL", (req, res) => {
  const userId = req.cookies["user_id"];
  const shortURL = req.params.shortURL;
  const longURL = req.body.newLongURL;
  console.log(userId);

  urlDatabase[shortURL].longURL = longURL;
    
  res.redirect(`/urls/${shortURL}`)
});

app.post("/urls/:shortURL/delete", (req, res) =>{
  const shortURL = req.params.shortURL;
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const generatedURL = generateRandomString();
  if (!userId) {
    return res.status(401).send("Please register or login to create tiny URLs")
  }
  //console.log(req.body.longURL)
  urlDatabase[generatedURL] = {
    longURL: req.body.longURL,
    userID: userId  
  }
  //console.log(urlDatabase[generatedURL])
  res.redirect(`/urls/${generatedURL}`);
});

app.get('/login', (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const templateVars = {
    user
  };
  res.render("urls_login", templateVars);
});


app.get('/register', (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  const templateVars = {
    user
  };
  res.render("urls_registration", templateVars)
});

app.get("/u/:id", (req, res) => {
  const shortURL = req.params.id;
  //const longURL = urlDatabase[shortURL];
  for (const key in urlDatabase) {
    if (key === shortURL) {
      const longURL = urlDatabase[shortURL].longURL;
      return res.redirect(`https://${longURL}`);
    }
  }
  res.status(404).send("Short URL does not exist");
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

app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const userId = req.cookies["user_id"];
  const user = users[userId];
  //console.log(urlDatabase)
  console.log(urlDatabase[shortURL])
  console.log(user)
  if (!user) {
    return res.status(401).send("Please login to see your urls")
  }
  if (urlDatabase[shortURL]) {
  
  const templateVars = { 
    user,
    shortURL: shortURL, 
    longURL: urlDatabase[shortURL].longURL
  };
  //console.log(urlDatabase[shortURL].longURL);
    res.render("urls_show", templateVars);
  } else {
    res.status = 404;
    res.send("404 Page Not Found");
  }
});

app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId]; 
  if (!user) {
    return res.status(401).send("Please login to see your urls")
  }
  const userDB = urlsForUser(userId);
    // for (const shortURL in urlDatabase) {
    //    //console.log(urlDatabase)
    //   if (urlDatabase[shortURL].userID === userId) {
    //     userDB[shortURL] = urlDatabase[shortURL].longURL;
    //   }
  
  //console.log(userId);
  const templateVars = { 
    user,
    urls: userDB
}
  //console.log(userDB)
  //console.log(userDB);
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