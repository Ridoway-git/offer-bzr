
const mongoose = require('mongoose');
const Payment = require('../models/Payment');
const Merchant = require('../models/Merchant');
const Package = require('../models/Package');
const Commission = require('../models/Commission');
const dotenv = require('dotenv');

dotenv.config({ path: './config.production.env' }); // Use PROD config

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

const forceApprove = async () => {
    await connectDB();

    const paymentId = '6974f5a69744f3286162f7ff'; // ID obtained from debug script
    const payment = await Payment.findById(paymentId);

    if (!payment) {
        console.log('Payment not found');
        process.exit(1);
    }

    if (payment.status === 'approved') {
        console.log('Payment already approved');
        process.exit(0);
    }

    console.log(`Approving payment ${paymentId}...`);

    payment.status = 'approved';
    payment.approvedAt = new Date();
    payment.adminNotes = 'Force approved by Agent';
    await payment.save();

    const merchant = await Merchant.findById(payment.merchant);
    if (!merchant) {
        console.log('Merchant not found');
        process.exit(1);
    }

    // Access Fee Logic
    if (payment.amount >= (merchant.accessFee || 0) && !merchant.accessFeePaid) {
        console.log('Marking access fee paid...');
        merchant.accessFeePaid = true;
        merchant.accessFeePaymentDate = new Date();
        merchant.accessFeePaymentId = payment._id;
        await merchant.save();
    }

    // Package Logic
    if (payment.package && payment.packageDurationMonths) {
        console.log('Processing package activation...');
        const pkg = await Package.findById(payment.package);
        if (pkg) {
            let startDate = new Date();
            let endDate = new Date();

            if (merchant.packageStatus === 'active' && merchant.packageEndDate && new Date(merchant.packageEndDate) > new Date()) {
                console.log('Extending existing subscription...');
                startDate = merchant.packageStartDate;
                endDate = new Date(merchant.packageEndDate);
            } else {
                console.log('Starting new subscription...');
            }

            endDate.setMonth(endDate.getMonth() + payment.packageDurationMonths);

            merchant.package = payment.package;
            merchant.packageStartDate = startDate;
            merchant.packageEndDate = endDate;
            merchant.packageStatus = 'active';
            await merchant.save();
            console.log('Merchant subscription activated! Expires:', endDate);
        } else {
            console.log('Package not found!');
        }
    } else {
        console.log('No package info in payment.');
    }

    console.log('Done.');
    process.exit(0);
};

forceApprove();
