//IMPORTING 
import express, { json } from 'express';
import mongoose from 'mongoose';

import Messages from './dbMessages.js';
import Pusher from 'pusher';
import cors from 'cors';



//app config
const app = express()
const port = process.env.PORT || 9000


const pusher = new Pusher({
    appId: "1119868",
    key: "c2a4de29722316b51f3d",
    secret: "0b4c3d70a428da646d5e",
    cluster: "ap2",
    useTLS: true
});


//Middleware
app.use(express.json());

app.use(cors());




//DB config 

const db = mongoose.connection;
db.once("open", () => {
    console.log("DB CONNECTED");

    //changeStream function
    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log("A change occured", change);                                                                                                                                                            

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted',
                {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timestamp: messageDetails.timestamp,
                    received: messageDetails.received
                   
                }
            );
        }
        else {
            console.log('Error trigerring pusher')
        }
    });
});



const connection_url = "mongodb+srv://admin:RmG57u2PwK6toTFT@cluster0.d1o70.mongodb.net/whatsappbackend?retryWrites=true&w=majority";
mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

//????



//API Routes
app.get('/', (req, res) => {
    res.status(200).send('hello world')
});


app.get("/messages/sync", (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err);
        }
        else {
            res.status(200).send(data);
        }
    });
});

app.post("/messages/new", (req, res) => {
    const dbMessage = req.body;

    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.status(201).send(data);
        }
    });
});



/// Listen
app.listen(port, () => {
    console.log(`Listening on localhost : ${port}`)
});