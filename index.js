const express = require('express');
const mongoose = require('mongoose');
const cors = require("cors");

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

app.listen(port, async () => {
    mongoClient = new MongoClient();
    await mongoClient.start()
    console.log("Event Planner ExpressJS API running on port " + port + ".");
})

app.get("/getEvents/:userID", async (req, res) => {
    res.json(await mongoClient.getEvents(req.params.userID).catch(e => console.error(e)))
})

app.get("/getEvent/:id", async (req, res) => {
    res.json(await mongoClient.getEvent(req.params.id).catch(e => console.error(e)))
})

app.patch("/attendEvent/:id", async (req, res) => {
    res.json(await mongoClient.attendEvent(req.params.id, req.body.username, req.body.userID).catch(e => console.error(e)))
})

app.patch("/unAttendEvent/:id", async (req, res) => {
    res.json(await mongoClient.unAttendEvent(req.params.id, req.body.userID).catch(e => console.error(e)))
})

app.patch("/checkItem/:id", async (req, res) => {
    res.json(await mongoClient.checkItem(req.params.id, req.body.item, req.body.available).catch(e => console.error(e)))
})

app.post("/createEvent", async (req, res) => {
    res.json(await mongoClient.createEvent(req.body.title, req.body.location, req.body.dateTime, req.body.image, req.body.items, req.body.description, req.body.creatorName, req.body.creatorID).catch(e => { console.error(e) }))
})

app.delete("/deleteEvent/:id", async (req, res) => {
    res.json(await mongoClient.deleteEvent(req.params.id).catch(e => { console.error(e) }))
})

class MongoClient {

    async start() {
        await mongoose.connect('mongodb+srv://khaledjalloul:Kj542533@cluster0.qpcmz.mongodb.net/eventPlanner?retryWrites=true&w=majority');

        this.EventSchema = new mongoose.Schema({
            title: String,
            eventLocation: String,
            dateTime: Date,
            image: String,
            attendees: [{ username: String, id: String }],
            creatorID: String,
            description: String,
            items: [{ name: String, available: Boolean }]
        }, { collection: 'events' });
        this.Event = mongoose.model('Event', this.EventSchema);
    }

    async getEvents(userID) {
        try {
            const events = await this.Event.find({})
            const userEvents = events.filter(event => event.attendees.some(attendee => attendee.id === userID))
            return { success: true, events: userEvents }
        } catch (e) { console.log(e); }
    }

    async getEvent(id) {
        try {
            const doc = await this.Event.findById(mongoose.Types.ObjectId(id))
            if (doc) return { success: true, event: doc }
            else return { success: false, message: 'Event not found.' }
        } catch (e) {
            if (e instanceof TypeError) return { success: false, message: 'Invalid event ID.' }
            else console.log(e)
        }
    }

    async attendEvent(id, username, userID) {
        try {
            const doc = await this.Event.findById(id)
            doc.attendees.push({ username: username, id: userID })
            return await doc.save().then(savedDoc => {
                if (savedDoc === doc) {
                    console.log("Updated users of document " + id)
                    return { success: true, attendees: doc.attendees }
                }
            })
        } catch (e) { console.log(e) }
    }

    async unAttendEvent(id, userID) {
        try {
            const doc = await this.Event.findById(id)
            doc.attendees = doc.attendees.filter(attendee => attendee.id !== userID)
            return await doc.save().then(savedDoc => {
                if (savedDoc === doc) {
                    console.log("Updated users of document " + id)
                    return { success: true, attendees: doc.attendees }
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
                    return { success: true, items: doc.items }
                }
            })
        } catch (e) { console.log(e) }
    }

    async createEvent(title, location, dateTime, image, items, description, creatorName, creatorID) {
        try {
            var newEvent = new this.Event({
                title: title,
                eventLocation: location,
                dateTime: dateTime,
                image: image,
                items: items.map(item => { return { name: item.charAt(0).toUpperCase() + item.slice(1), available: false } }),
                description: description,
                creatorID: creatorID,
                attendees: [{ username: creatorName, id: creatorID }]
            })
            return await newEvent.save().then(savedDoc => {
                if (savedDoc === newEvent) {
                    console.log("Created event: " + title)
                    return { success: true }
                }
            })
        } catch (e) { console.log(e); return { success: false } }
    }

    async deleteEvent(id) {
        try {
            await this.Event.deleteOne({ _id: id })
            return { success: true }
        } catch (e) { console.error(e); }
    }
}