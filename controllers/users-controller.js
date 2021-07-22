const { v4: uuidv4 } = require("uuid"); //correct new version compared to the course
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");

const User = require("../models/user");

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

const signup = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    console.log(errors);
    return next(new HttpError("Invalid inputs passed", 422));
  }

  const { name, email, password, places } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError("Couldn't retrieve user!", 500);
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError("User exists already, please login!", 422);
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    password,
    image:
      "https://cdn.vox-cdn.com/thumbor/JMqrPS2RmaDK6S5zaMuIw03I5Ns=/1400x1400/filters:format(jpeg)/cdn.vox-cdn.com/uploads/chorus_asset/file/18971698/151006_19_00_22_5DSR9489.jpg",
    places,
  });

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError("Creating user failed, please try again.", 500);
    return next(error);
  }

  res.status(201).json({ user: createdUser.toObject({ getters: true }) });
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
