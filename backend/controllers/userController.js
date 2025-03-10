const ApiError = require("../Error/ApiError");
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const modelsPromise = require('../models/models');
const { tokenService } = require('../middleware/tokenService');
const vault = require('../config/vault');
require("dotenv").config();

async function getJwtSecret() {
    try {
        await vault.initVault();
        const secret = await vault.readSecret('kv/data/app/jwt', 'secret');
        return secret;
    } catch (error) {
        console.log('Failed to get JWT secret from Vault, using environment variable instead:', error.message);
        return process.env.SECRET_JWT;
    }
}
let cachedJwtSecret = null;
async function getCachedJwtSecret() {
    if (!cachedJwtSecret) {
        cachedJwtSecret = await getJwtSecret();
    }
    return cachedJwtSecret;
}

const generateJWT = async (id, name, email) => {
    const secret = await getCachedJwtSecret();
    return jwt.sign({ id, name, email },
        secret,
        { expiresIn: '24h' });
};

class UserController {
    async registration(req, res, next) {
        try {
            const { name, email, password } = req.body;
            if (!email || !password || !name) {
                return next(ApiError.badRequest('Incorrect password or email!'));
            }
            
            const { User } = await modelsPromise;
            
            const checkEmail = await User.findOne({ where: { email } });
            const checkUserName = await User.findOne({ where: { name } });
            if(checkEmail || checkUserName){
                return res.json({ unvailableEmail: !!checkEmail, unavailableUserName: !!checkUserName });
            }
            const hashPassword = await bcrypt.hash(password, 5);
            const user = await User.create({ name, email, password: hashPassword });
            const token = await generateJWT(user.id, user.name, user.email);
            return res.json({ unvailableEmail: !!checkEmail, unavailableUserName: !!checkUserName, token: token, id: user.id });
        } catch (error) {
            console.error("Error with registration", error);
            return next(ApiError.internal("Error with registration"));
        }
    }

    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            
            const { User } = await modelsPromise;
            
            const user = await User.findOne({ where: { email } });
            if (!user) {
                return next(ApiError.badRequest('User was not found!'));
            }
            let comparePassword = bcrypt.compareSync(password, user.password);
            if (!comparePassword) {
                return next(ApiError.badRequest('Uncorrect password'));
            }
            const token = await generateJWT(user.id, user.name, user.email);
            return res.json({ token: token, name: user.name, id: user.id, email: user.email});
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
            const secret = await getCachedJwtSecret();
            const decoded = jwt.verify(token, secret);
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
            const secret = await getCachedJwtSecret();
            const decoded = jwt.verify(token, secret);
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
            
            const { User } = await modelsPromise;
            
            const user = await User.findOne({ where: { id: id } });
            if (!user) {
                return next(ApiError.badRequest("User was not found!"));
            }
            return res.json(user.name);
        } catch (error) {
            console.error("Can't recieve user name by id", error);
            return next(ApiError.internal("Can't recieve user name by id"));
        }
    }

    async findByName(req, res, next){
        try{
            const {name} = req.body;
            if(!name){
                return next(ApiError.badRequest("Name is empty!"));
            }
            
            const { User } = await modelsPromise;
            
            const user = await User.findOne({where: {name: name}});
            if (!user) {
                return next(ApiError.badRequest("User was not found!"));
            }
            return res.json({ username: user.name, userid: user.id, email: user.email });
        } catch (error) {
            console.error("User was not found!", error);
            return next(ApiError.internal("User was not found!"));
        }
    }

    
}

module.exports = new UserController();