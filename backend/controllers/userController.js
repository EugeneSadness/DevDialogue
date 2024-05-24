const ApiError = require("../Error/ApiError");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { User } = require('../models/models');
const { tokenService } = require('../middleware/tokenService');
require("dotenv").config();

const generateJWT = (id, name, email) => {
    return jwt.sign({ id, name, email },
        process.env.SECRET_JWT,
        { expiresIn: '24h' });
};

class UserController {
    async registration(req, res, next) {
        try {
            const { name, email, password } = req.body;
            if (!email || !password || !name) {
                return next(ApiError.badRequest('Uncorrect password or email!'));
            }
            const candidate = await User.findOne({ where: { email } });
            if (candidate) {
                return next(ApiError.badRequest('User was registered already!'));
            }
            const hashPassword = await bcrypt.hash(password, 5);
            const user = await User.create({ name, email, password: hashPassword });
            const token = generateJWT(user.id, user.name, user.email);
            return res.json({ token: token });
        } catch (error) {
            console.error("Error with registration", error);
            return next(ApiError.internal("Error with registration"));
        }
    };

    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ where: { email } });
            if (!user) {
                return next(ApiError.badRequest('User was not found!'));
            }
            let comparePassword = bcrypt.compareSync(password, user.password);
            if (!comparePassword) {
                return next(ApiError.badRequest('Uncorrect password'));
            }
            const token = generateJWT(user.id, user.name, user.email);
            return res.json({ token: token });
        } catch (error) {
            console.error("Error with login", error);
            return next(ApiError.internal("Error with login"));
        }
    }

    async getUserId(req, res, next) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            if (!token) {
                return next(ApiError.badRequest('Token is empty'));
            }
            const decoded = jwt.verify(token, "random_secret");
            const userId = decoded.id;
            return res.json({ userId });
        } catch (error) {
            console.error("Can't recieve user id", error);
            return next(ApiError.internal("Can't recieve user id"));
        }
    }

    async getName(req, res, next) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            if (!token) {
                return next(ApiError.badRequest('Token is empty'));
            }
            const decoded = jwt.verify(token, "random_secret");
            const name = decoded.name;
            return res.json({ name });
        } catch (error) {
            console.error("Can't recieve user name", error);
            return next(ApiError.internal("Can't recieve user name"));
        }
    }

    async getNameById(req, res, next) {
        try {
            const id = req.params.id;
            const user = User.findOne({ where: { id: id } });
            if (!User) {
                return next(ApiError.badRequest("User was not found!"));
            }
            return res.json(user.name);
        } catch (error) {
            console.error("Can't recieve user name by id", error);
            return next(ApiError.internal("Can't recieve user name by id"));
        }
    }

    async checkUsername(req, res, next) {
        try {
            const { username } = req.query;
            if (!username) {
                return next(ApiError.badRequest('Username is empty'));
            }
            const user = await User.findOne({ where: { name: username } });
            if (user) {
                return res.json({ available: false });
            } else {
                return res.json({ available: true });
            }
        } catch (error) {
            console.error("Error checking username availability", error);
            return next(ApiError.internal("Error checking username availability"));
        }
    }


}

module.exports = new UserController();