const { assert } = require('chai');
const { searchForEmail } = require('../helpers.js');


// Test user database
const testUsers = {
  "userRandomID": {
    id: "userRandomID", 
    email: "user@example.com", 
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "dishwasher-funk"
  }
};

// Testing conditions
describe('getUserByEmail', function() {
  it('should return a user with valid email', () => {
    const user = searchForEmail(testUsers, "user@example.com");
    const expectedUserID = "userRandomID";
    assert.deepEqual(user, testUsers[expectedUserID]);
  });
  it('should return false when the email is not in our user database', () => {
    const user = searchForEmail(testUsers, "notAUser@example.com");
    assert.deepEqual(user, false);
  });
});