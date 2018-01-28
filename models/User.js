const thinky = require('../utils/thinky.js');
const type = thinky.type;
const Account = require('./Account');

const User = thinky.createModel("User", {
    id: type.string(),
    email: type.string(),
    password: type.string()
});

User.define("isAdult", function() {
    return this.age > 18;
});

User.ensureIndex("email");

module.exports = User;
