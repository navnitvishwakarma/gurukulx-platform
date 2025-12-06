const mongoose = require('mongoose');
const Doubt = require('./models/Doubt');
const path = require('path');
const dotenv = require('dotenv');

async function checkDoubts() {
    try {
        const envPath = path.join(__dirname, '.env');
        dotenv.config({ path: envPath });

        if (!process.env.MONGODB_URI) {
            console.error("No MONGODB_URI found");
            return;
        }

        await mongoose.connect(process.env.MONGODB_URI);

        const count = await Doubt.countDocuments();
        console.log(`Total Doubts in DB: ${count}`);

        if (count > 0) {
            const doubts = await Doubt.find().limit(5);
            console.log('Sample Doubts:', JSON.stringify(doubts, null, 2));
        }

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.disconnect();
    }
}

checkDoubts();
