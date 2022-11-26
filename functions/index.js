import functions from "firebase-functions";
import express from "express";
import cors from "cors";
import admin from "firebase-admin";

admin.initializeApp();

const app = express();

app.use(cors({ origin: true }));

const CHANNELS_COLLECTION = "channels";
const CURRENT_CHANNEL_COLLECTION = "current_channel";

/**
 * /channels:
 *   get:
 *     summary: Retrieve a list of TV channels from "channels" collection
 */
app.get("/", async (req, res) => {
    const channelsSnapshot = await admin.firestore().collection(CHANNELS_COLLECTION).get();

    if (!channelsSnapshot.empty) {
        let channels = [];
        for (const doc of channelsSnapshot.docs) {
            channels.push({ ...doc.data() });
        }

        res.status(200).send(channels);
    }
});

/**
 * /currentChannel:
 *   get:
 *     summary: Retrieve the current TV channel from "current_channel" collection
 */
app.get("/currentChannel", async (req, res) => {
    const currentChannelSnapshot = await admin.firestore().collection(CURRENT_CHANNEL_COLLECTION).get();

    if (!currentChannelSnapshot.empty) {
        res.status(200).send(currentChannelSnapshot.docs[0].data());
    }
});

/**
 * /previousChannel:
 *   get:
 *     summary: Retrieve the previous TV channel from "channels" collection, and update "current_channel" collection
 */
app.get("/previousChannel", async (req, res) => {
    const currentChannelSnapshot = await admin.firestore().collection(CURRENT_CHANNEL_COLLECTION).get();

    if (!currentChannelSnapshot.empty) {
        const currentChannelNumber = currentChannelSnapshot.docs[0].data().number;

        // Get the previous document in "channels" collection using the "currentChannelNumber"
        const previousChannelSnapshot = await admin
            .firestore()
            .collection(CHANNELS_COLLECTION)
            .where("number", "==", currentChannelNumber - 1)
            .get();

        // If the previous document exists, update the existing document ref in the "current_channel" collection to the previous document
        if (!previousChannelSnapshot.empty) {
            currentChannelSnapshot.docs[0].ref.update(previousChannelSnapshot.docs[0].data());

            res.status(200).send();
        } else {
            res.status(404).send("Previous channel doesn't exist");
        }
    } else {
        res.status(404).send("Current channel doesn't exist");
    }
});

/**
 * /nextChannel:
 *   get:
 *     summary: Retrieve the next TV channel from "channels" collection, and update "current_channel" collection
 */
app.get("/nextChannel", async (req, res) => {
    const currentChannelSnapshot = await admin.firestore().collection(CURRENT_CHANNEL_COLLECTION).get();

    if (!currentChannelSnapshot.empty) {
        const currentChannelNumber = currentChannelSnapshot.docs[0].data().number;

        // Get the next document in "channels" collection using the "currentChannelNumber"
        const nextChannelSnapshot = await admin
            .firestore()
            .collection(CHANNELS_COLLECTION)
            .where("number", "==", currentChannelNumber + 1)
            .get();

        // If the next document exists, update the existing document ref in the "current_channel" collection to the next document
        if (!nextChannelSnapshot.empty) {
            currentChannelSnapshot.docs[0].ref.update(nextChannelSnapshot.docs[0].data());

            res.status(200).send();
        } else {
            res.status(404).send("Next channel doesn't exist");
        }
    } else {
        res.status(404).send("Current channel doesn't exist");
    }
});

export const channels = functions.https.onRequest(app);
