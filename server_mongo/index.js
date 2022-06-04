const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");
var multer = require('multer')
var multerFTP = require('multer-ftp')
const crypto = require('crypto');
const corsOptions = {
    origin: '*',
    credentials: true,
    optionSuccessStatus: 200,
}

const app = express();
app.use(cors(corsOptions))
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const port = process.env.PORT || 3737;

let mongoClient;
// var upload = multer({
//     storage: new multerFTP({
//         basepath: '/public_html/images',
//         destination: function (req, file, options, callback) {
//             callback(null, path.join(options.basepath, file.originalname))
//          },
//         ftp: {
//             host: 'files.000webhost.com',
//             user: 'guides-app-img',
//             password: 'Kj542533'
//         }
//     })
// })

app.listen(port, async () => {
    mongoClient = new MongoClient();
    await mongoClient.start()
    console.log("Event Planner NodeJS API running.");
})

app.post('/register', async (req, res) => {
    res.json(await mongoClient.register(req.body.username, req.body.password).catch(e => { console.error(e) }))
})

app.use("/login", async (req, res) => {
    const result = await mongoClient.login(req.body.username, req.body.password).catch(e => { console.error(e) })

    if (result) {
        res.json({ token: crypto.randomBytes(16).toString('hex') })
    } else {
        res.json({})
    }
})

app.get("/getEvents", async (req, res) => {
    res.json(await mongoClient.getEvents().catch(e => { console.error(e) }));
})

app.post("/attendEvent", async (req, res) => {
    res.json(await mongoClient.attendEvent(req.body.id, req.body.name).catch(e => { console.error(e) }));
})

app.post("/checkItem", async (req, res) => {
    res.json(await mongoClient.checkItem(req.body.id, req.body.item, req.body.available).catch(e => { console.error(e) }));
})

// app.post("/addGuide", bodyParser.json(), async (req, res) => {
//     const result = await mongoClient.addGuide(req.body);
//     res.json({ "res": result })
// })

// app.post("/deleteGuide", bodyParser.json(), async (req, res) => {
//     const result = await mongoClient.deleteGuide(req.body);
//     res.json({ "res": result })
// })

// app.post("/uploadImage", upload.single("image"), (req, res) => {
//     res.send(req.file);
// })

app.get("/wipe", async (req, res) => {
    if (req.query.pass === "Kj542533") {
        await mongoClient.wipe();
        res.send("Done.")
    } else {
        res.send("Enter pass.")
    }
})

class MongoClient {

    async start() {
        await mongoose.connect('mongodb+srv://khaledjalloul:Kj542533@cluster0.qpcmz.mongodb.net/eventPlanner?retryWrites=true&w=majority');

        this.EventSchema = new mongoose.Schema({
            title: String,
            location: String,
            time: Date,
            attendees: [String],
            creator: String,
            items: [{ name: String, available: Boolean }]
        }, { collection: 'events' });
        this.Event = mongoose.model('Event', this.EventSchema);

        this.UserSchema = new mongoose.Schema({
            username: String,
            hash: String,
            salt: String,
            events: [String]
        }, { collection: 'users' });
        this.User = mongoose.model('User', this.UserSchema);
    }

    async register(username, password) {
        try {
            const doc = await this.User.findOne({ username: username })
            if (!doc) {
                const salt = crypto.randomBytes(16).toString('hex');
                const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')
                this.User.create({
                    username: username,
                    salt: salt,
                    hash: hash,
                    events: []
                }, (e, i) => {
                    if (e) console.error(e);
                    else console.log("Registered user: " + username)
                })
            } else console.log("User " + username + " already exists.")
        } catch (e) { console.log(e) }
    }

    async login(username, password) {
        try {
            const { salt, hash } = await this.User.findOne({ username: username })
            if (!salt) return false
             
            const hashAttempt = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex')

            return hash === hashAttempt

        } catch (e) { console.log(e) }
    }
    async getEvents() {
        try {
            return await this.Event.find({})
        } catch (e) { console.log(e); }
    }

    async attendEvent(id, user) {
        try {
            const doc = await this.Event.findById(id)
            doc.attendees.push(user)
            return await doc.save().then(savedDoc => {
                if (savedDoc === doc) {
                    console.log("Updated users of document " + id)
                    return doc.attendees
                }
            })
        } catch (e) { console.log(e) }
    }

    async checkItem(id, reqItem, available) {
        try {
            const doc = await this.Event.findOne({ _id: id })
            doc.items.map(item => {
                if (item.name === reqItem) {
                    item.available = available;
                    return item
                } else return item
            })
            return await doc.save().then(savedDoc => {
                if (savedDoc === doc) {
                    console.log("Updated items of document " + id)
                    return doc.items
                }
            })
        } catch (e) { console.log(e) }
    }

    async addGuide(data) {
        try {
            const col = data.collection;
            delete data["collection"];
            if (col === 'recipes') {
                const recipe = new this.Recipe(data);
                await recipe.save();
            } else if (col === 'generic') {
                const generic = new this.Generic(data);
                await generic.save();
            }
            return (1);
        } catch (e) {
            console.log(e);
            return (0);
        }
    }

    async deleteGuide(data) {
        try {
            if (data.password !== "Kj542533") return (0);
            if (data.collection === 'recipes') {
                this.Recipe.deleteOne({ name: data.name }, (err, res) => { })
            } else if (data.collection === 'generic') {
                this.Generic.deleteOne({ name: data.name }, (err, res) => { })
            }
            return (1);
        } catch (e) {
            console.log(e);
            return (0);
        }
    }

    async wipe() {
        this.Generic.deleteMany({}, (err, res) => { })
        this.Recipe.deleteMany({}, (err, res) => { })
    }
}