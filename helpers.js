// Function that generates a random 6 digit string
const generateRandomString = () => {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 6; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
};

// Function that takes in a database of users and checks if the email is in the database. If no email the function returns false, otherwise it returns a user object
const searchForEmail = (userDB, email) => {
  for (const user in userDB) {
    if (userDB[user].email === email) {
      return userDB[user];
    }
  }
  return false;
};


// Function that searches the userdatabase for an id and returns an object with all the urls associated with that ID
const urlsForUser = (id, database) => {
  let userDB = {};
  for (const shortURL in database) {
    //console.log(urlDatabase)
   if (database[shortURL].userID === id) {
     userDB[shortURL] = database[shortURL].longURL;
   }
 };
 return userDB;
}

module.exports = {
  generateRandomString,
  searchForEmail,
  urlsForUser
};