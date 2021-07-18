const { v4: uuidv4 } = require("uuid"); //correct new version compared to the course

const HttpError = require("../models/http-error");

let DUMMY_USERS = [
  {
    id: "u1",
    name: "Aderson",
    email: "aderson@dnnhero.com",
    password: "pxyz",
  },
  {
    id: "u2",
    name: "Eduardo",
    email: "eduardo@luis.com",
    password: "fhug",
  },
];

const getUsers = (req, res, next) => {
  res.json({ users: DUMMY_USERS });
};

const signup = (req, res, next) => {
  const { name, email, password } = req.body;

  const hasUser = DUMMY_USERS.find(p => p.email === email);

  if (hasUser) {
      throw new HttpError("Email already exists!", 422);
  }

  const createdUser = {
    id: uuidv4(),
    name,
    email,
    password,
  };

  DUMMY_USERS.push(createdUser);

  res.status(201).json({ user: createdUser });
};

const login = (req, res, next) => {
  const { email, password } = req.body;

  //create a copy of the previous place with the spread operator ...
  const user = DUMMY_USERS.find((u) => u.email === email);

  if (!user || user.password !== password) {
    throw new HttpError(`Could not validate user, or password is wrong!`, 404);
  }
  
  res.json({ message: "User is logged in!" });
};

exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
