
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Merchant = require('../models/Merchant');
const dotenv = require('dotenv');

dotenv.config({ path: './config.env' });

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://loopsridoway:jASEqeDKhwO2D21H@cluster0.zfv1kvp.mongodb.net/offer_bazar_prod?retryWrites=true&w=majority&appName=Cluster0', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('DB connected');
    } catch (err) {
        console.error('DB connection error', err);
        process.exit(1);
    }
};

const inspectLastPayment = async () => {
    await connectDB();

    const lastPayment = await Payment.findOne().sort({ createdAt: -1 });

    if (!lastPayment) {
        console.log('No payments found.');
    } else {
        console.log('--- Last Payment Details ---');
        console.log('ID:', lastPayment._id);
        console.log('Merchant ID:', lastPayment.merchant);
        console.log('Payment Method:', lastPayment.paymentMethod);
        console.log('Amount:', lastPayment.amount);
        console.log('Status:', lastPayment.status);
        console.log('Package ID:', lastPayment.package);
        console.log('Package Duration:', lastPayment.packageDurationMonths);
        console.log('Created At:', lastPayment.createdAt);

        const merchant = await Merchant.findById(lastPayment.merchant);
        if (merchant) {
            console.log('\n--- Associated Merchant ---');
            console.log('Merchant ID:', merchant._id);
            console.log('Package Status:', merchant.packageStatus);
            console.log('Package Start:', merchant.packageStartDate);
            console.log('Package End:', merchant.packageEndDate);
        } else {
            console.log('Merchant not found!');
        }
    }

    process.exit();
};

inspectLastPayment();
