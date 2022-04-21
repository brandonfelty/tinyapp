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
  const user = users[userId];

  if (!user) {
    return res.status(401).send("You are not authorized to edit this short URL")
  }

  urlDatabase[shortURL].longURL = longURL;
    
  res.redirect(`/urls/${shortURL}`)
});

app.post("/urls/:shortURL/delete", (req, res) =>{
  const shortURL = req.params.shortURL;
  const userId = req.cookies["user_id"];
  const user = users[userId];
  if (!user) {
    return res.status(401).send("You are not authorized to delete this short URL")
  }
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const generatedURL = generateRandomString();
  const user = users[userId];

  // Checks if a user is logged in and returns an error if not logged in
  if (!user) {
    return res.status(401).send("Please register or login to create tiny URLs <a href=\"/register\" >Register</a> <a href=\"/login\" >Login</a>")
  }
  
  // If the user is logged in, a shortURL is generated and then the user is redirected to /urls/:id
  const shortURL = urlDatabase[generatedURL];
  shortURL = {
    longURL: req.body.longURL,
    userID: userId  
  }
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

  // searches through the short URL's in database and redirects to the long URL if it exists
  for (const key in urlDatabase) {
    if (key === shortURL) {
      const longURL = urlDatabase[shortURL].longURL;
      return res.redirect(`https://${longURL}`);
    }
  }

  // If the URL for the given ID doesn't exist, returns HTML with error message
  res.status(404).send("Short URL does not exist");
});

app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const userId = req.cookies["user_id"];
  const user = users[userId];

  // if user is not logged in an error message is sent 
  if (!user) {
    return res.status(401).send("Please login to see your urls <a href=\"/register\" >Register</a> <a href=\"/login\" >Login</a>")
  }
  
  // checks if there is an entry in the database with the short url id and if exists in the database it renders HTML or it will error if the page is not found
  if (urlDatabase[shortURL]) {
  const templateVars = { 
    user,
    shortURL: shortURL, 
    longURL: urlDatabase[shortURL].longURL
  };
    res.render("urls_show", templateVars);
  } else {
    res.status = 404;
    res.send("404 Page Not Found");
  }
});

app.get("/urls/new", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId];
  
  // checks if the user is logged in or send to login page
  if (!user) {
    return res.redirect("/login");
  }

  const templateVars = {
    user
  };

  // render the HTML that allows users to create a new short url
  res.render("urls_new", templateVars);
});

app.get("/urls", (req, res) => {
  const userId = req.cookies["user_id"];
  const user = users[userId]; 
  
  // if user is not logged on, it will show an error message and HTML
  if (!user) {
    return res.status(401).send("Please login to see your urls <a href=\"/register\" >Register</a> <a href=\"/login\" >Login</a>")
  }

  // need to call after the user is verified or will receive an error. The function below will return all the urls associated with the user.
  const userDB = urlsForUser(userId);
  
  const templateVars = { 
    user,
    urls: userDB
}
  // Renders the HTML for when a user is logged in
  res.render("urls_index", templateVars);
});

app.get('/', (req, res) => {
  
  // if user logged in redirect to /urls
  const userId = req.cookies["user_id"];
  const user = users[userId];
  if (user) {
    return res.redirect("/urls");
  }

  // if user logged in redirect to /urls
  if (!user) {
    return res.redirect("/login");
  }

});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});