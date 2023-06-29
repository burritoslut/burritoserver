const bcrypt = require('bcrypt');
const password = 'test6'; // your plaintext password
const hash = '$2b$10$0131nbW1J4EdbNjxPriCfO4TIKQers2/dxGwjWQFh9kP8aCrj4ADu'; // the hashed password from your database

bcrypt.compare(password, hash, function(err, isMatch) {
    if (err) {
        console.log(err);
    } else {
        console.log(isMatch); // this should be 'true' if the password and hash match
    }
});
