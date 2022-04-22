const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const PORT = 8080;
// const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const cookieSession = require('cookie-session');
const helpers = require('./helpers.js');
const generateRandomString = helpers.generateRandomString;
const searchForEmail = helpers.searchForEmail;
const urlsForUser = helpers.urlsForUser;


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
app.use(cookieSession({name: 'session', keys: ['secretKey']}));
// app.use(cookieParser());

app.post("/logout", (req, res) => {

  // Clears user cookie session and redirects to /urls
  req.session = null;
  res.redirect('/urls');
});

app.post("/register", (req, res) => {
  // First we define a random userID, and store the email and password inputs from the request. Then the password is hashed for security.
  const userId = generateRandomString();
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  // Checks if the user email or password contents were empty adn returns error if they are empty
  if (!email || !password) {
    return res.status(400).send('Invalid email or password');
  }

  // Uses a function to check if the email exists, if the function returns false, an error message comes up to tell the user the email is already in use
  if (searchForEmail(users, email)) {
    return res.status(400).send("Email is already in use");
  }
  
  // If email and password fields meet requirements, a new user is created with the hashed password. The server responds with a new cookie and redirects to urls.
  users[userId] = {
    userId,
    email,
    password: hashedPassword
  };
  req.session.user_id = userId;
  res.redirect("/urls");
});

app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  // Checks if email is in the database and returns error if none
  if (!searchForEmail(users, email)) {
    return res.status(403).send("Email cannot be found <a href=\"/login\"> Login</a>");
  }

  // Since we would return the error above if no user, now we set a user variable that grabs the unique user object
  const user = searchForEmail(users, email);

  // Uses bcryptjs to check password for the user and if hashed password doesn't match the user receives an error
  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Password incorrect <a href=\"/login\"> Login</a>");
  }
  
  // If the user's email and hashed password are a match, a cookie is set, the user is logged in and redirected to /urls
  req.session.user_id = user.userId;
  return res.redirect('/urls');
});

app.post("/urls/:id/delete", (req, res) =>{
  const shortURL = req.params.id;
  const userId = req.session.user_id;
  const user = users[userId];
  
  // If the user is not logged in, return html with error message
  if (!user) {
    return res.status(401).send("Please login to delete this short URL <a href=\"/login\" >Login</a>");
  }
  
  // If the user is logged in but doesn't own the URL for the ID, return html with error message
  const userDB = urlsForUser(userId, urlDatabase);
  if (!userDB[shortURL]) {
    return res.status(401).send("You are not authorized to delete this short URL");
  }

  // If the user is logged in and owns the URL, the short URL is deleted from the database
  delete urlDatabase[shortURL];
  res.redirect("/urls");
});

app.post("/urls/:id", (req, res) => {
  const userId = req.session.user_id;
  const shortURL = req.params.id;
  const longURL = req.body.newLongURL;
  const user = users[userId];

  // Checks if the user is logged in and returns HTML with error if they're not
  if (!user) {
    return res.status(401).send("Please login to edit URLs <a href=\"/login\" >Login</a>");
  }

  // If user is logged in but does not own the URL for the given ID return html with error message
  const userDB = urlsForUser(userId, urlDatabase);
  if (!userDB[shortURL]) {
    return res.status(401).send("You are not authorized to edit this short URL");
  }

  // If user is logged in and owns the URLs the user is redirected to /urls/:id so they can edit the long url
  urlDatabase[shortURL].longURL = longURL;
  res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  const userId = req.session.user_id;
  const generatedURL = generateRandomString();
  const user = users[userId];

  // Checks if a user is logged in and returns an error if not logged in
  if (!user) {
    return res.status(401).send("Please register or login to create tiny URLs <a href=\"/register\" >Register</a> <a href=\"/login\" >Login</a>");
  }
  
  // If the user is logged in, a shortURL is generated, saved to the database, and then the user is redirected to /urls/:id of the new url
  urlDatabase[generatedURL] = {
    longURL: req.body.longURL,
    userID: userId
  };
  res.redirect(`/urls/${generatedURL}`);
});

app.get('/register', (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  // If user is logged in, redirect to /urls
  if (user) {
    return res.redirect("/urls");
  }

  // If user is not logged in, render the registration page
  const templateVars = {
    user
  };
  res.render("urls_registration", templateVars);
});

app.get('/login', (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  // If user is logged in, redirect to /urls
  if (user) {
    return res.redirect("/urls");
  }

  // If user is not logged in, the login page is rendered
  const templateVars = {
    user
  };
  res.render("urls_login", templateVars);
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

app.get("/urls/new", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];
  
  // checks if the user is logged in and send to login page if not
  if (!user) {
    return res.redirect("/login");
  }
  const templateVars = {
    user
  };

  // render the HTML that allows users to create a new short url
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const shortURL = req.params.id;
  const userId = req.session.user_id;
  const user = users[userId];

  // if user is not logged in an error message is sent
  if (!user) {
    return res.status(401).send("Please login to see your urls <a href=\"/register\" >Register</a> <a href=\"/login\" >Login</a>");
  }

  if (!urlDatabase[shortURL]) {
    res.status = 404;
    res.send("404 Page Not Found");
  }

  // If user is logged in but does not own the URL for the given ID return html with error message
  const userDB = urlsForUser(userId, urlDatabase);
  if (!userDB[shortURL]) {
    return res.status(401).send("You are not authorized to edit this short URL");
  }
  
  // checks if there is an entry in the database with the short url id and if exists in the database it renders HTML or it will error if the page is not found
  if (urlDatabase[shortURL]) {
    const templateVars = {
      user,
      shortURL: shortURL,
      longURL: urlDatabase[shortURL].longURL
    };
    res.render("urls_show", templateVars);
  }
});

app.get("/urls", (req, res) => {
  const userId = req.session.user_id;
  const user = users[userId];

  // if user is not logged on, it will show an error message and HTML
  if (!user) {
    return res.status(401).send("Please login to see your urls <a href=\"/register\" >Register</a> <a href=\"/login\" >Login</a>");
  }

  // need to call after the user is verified or will receive an error. The function below will return all the urls associated with the user.
  const userDB = urlsForUser(userId, urlDatabase);
  const templateVars = {
    user,
    urls: userDB
  };
  // Renders the HTML for when a user is logged in
  res.render("urls_index", templateVars);
});

app.get('/', (req, res) => {
  
  // if user logged in redirect to /urls
  const userId = req.session.user_id;
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