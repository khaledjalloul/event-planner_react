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

let EventSchema, Event;

app.listen(port, async () => {
    await mongoose.connect('mongodb+srv://khaledjalloul:Kj542533@cluster0.qpcmz.mongodb.net/eventPlanner?retryWrites=true&w=majority');

    EventSchema = new mongoose.Schema({
        title: String,
        eventLocation: String,
        dateTime: Date,
        image: String,
        attendees: [{ username: String, id: String }],
        creatorID: String,
        description: String,
        items: [{ name: String, available: Boolean }]
    }, { collection: 'events' });
    Event = mongoose.model('Event', EventSchema);

    console.log("Event Planner ExpressJS API running on port " + port + ".");
})

app.get("/getEvents/:userID", async (req, res) => {
    try {
        const events = await Event.find({})
        const userEvents = events.filter(event => event.attendees.some(attendee => attendee.id === req.params.userID))
        res.status(200).json({ events: userEvents })
    } catch (e) {
        console.error(e)
        res.status(404).json("User not found.")
    }
})

app.get("/getEvent/:id", async (req, res) => {
    try {
        const doc = await Event.findById(mongoose.Types.ObjectId(req.params.id))
        if (doc) res.status(200).json({ event: doc })
        else return res.status(404).json("Event not found.")
    } catch (e) {
        if (e instanceof TypeError) res.status(400).json('Invalid event ID.')
        else { console.error(e); res.status(404).json("Event not found.") }
    }
})

app.patch("/attendEvent/:id", async (req, res) => {
    try {
        const doc = await Event.findById(req.params.id)
        doc.attendees.push({ username: req.body.username, id: req.body.userID })
        doc.save().then(savedDoc => {
            if (savedDoc === doc) {
                console.log("Updated users of document " + req.params.id)
                res.status(200).json({ attendees: doc.attendees })
            } else res.status(500).json("Server error occurred.")
        })
    } catch (e) { console.error(e); res.status(404).json("Event not found.") }
})

app.patch("/unAttendEvent/:id", async (req, res) => {
    try {
        const doc = await Event.findById(req.params.id)
        doc.attendees = doc.attendees.filter(attendee => attendee.id !== req.body.userID)
        doc.save().then(savedDoc => {
            if (savedDoc === doc) {
                console.log("Updated users of document " + req.params.id)
                res.status(200).json({ attendees: doc.attendees })
            } else res.status(500).json("Server error occurred.")
        })
    } catch (e) { console.error(e); res.status(404).json("Event not found.") }
})

app.patch("/checkItem/:id", async (req, res) => {
    try {
        const doc = await Event.findOne({ _id: req.params.id })
        doc.items.map(item => {
            if (item.name === req.body.item) {
                item.available = req.body.available;
                return item
            } else return item
        })
        doc.save().then(savedDoc => {
            if (savedDoc === doc) {
                console.log("Updated items of document " + id)
                res.status(200).json({ items: doc.items })
            } else res.status(500).json("Server error occurred.")
        })
    } catch (e) { console.error(e); res.status(404).json("Event not found.") }
})

app.post("/createEvent", async (req, res) => {
    try {
        var newEvent = new Event({
            title: req.body.title,
            eventLocation: req.body.location,
            dateTime: req.body.dateTime,
            image: req.body.image,
            items: req.body.items.map(item => { return { name: item.charAt(0).toUpperCase() + item.slice(1), available: false } }),
            description: req.body.description,
            creatorID: req.body.creatorID,
            attendees: [{ username: req.body.creatorName, id: req.body.creatorID }]
        })
        newEvent.save().then(savedDoc => {
            if (savedDoc === newEvent) {
                console.log("Created event: " + req.body.title)
                res.status(201).send('')
            }
        })
    } catch (e) { console.error(e); res.status(500).json("Could not create event.") }
})

app.delete("/deleteEvent/:id", async (req, res) => {
    try {
        await Event.deleteOne({ _id: req.params.id })
        res.status(204).send('')
    } catch (e) { console.error(e); res.status(500).json("Could not delete event.") }
})