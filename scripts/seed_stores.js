const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Merchant = require('../models/Merchant');
const Store = require('../models/Store');
const Offer = require('../models/Offer');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../config.env') });

const storesList = [
    { name: 'Daraz', category: 'E-commerce', description: 'Best online shopping experience in Bangladesh.' },
    { name: 'Aarong', category: 'Fashion', description: 'Ethically made, handcrafted lifestyle products.' },
    { name: 'Walton', category: 'Electronics', description: 'Best electronics brand in Bangladesh.' },
    { name: 'PRAN', category: 'Food & Beverage', description: 'Largest food and beverage company in Bangladesh.' },
    { name: 'Pickaboo', category: 'E-commerce', description: 'Trusted online shop for mobile and electronics.' },
    { name: 'Yellow', category: 'Fashion', description: 'Trendy fashion brand for men and women.' },
    { name: 'Singer', category: 'Electronics', description: 'Home appliances and consumer electronics.' },
    { name: 'Kazi Farms', category: 'Food & Beverage', description: 'Quality frozen food and poultry products.' },
    { name: 'Chaldal', category: 'E-commerce', description: 'Online grocery shop in Bangladesh.' },
    { name: 'Cats Eye', category: 'Fashion', description: 'Pioneer lifestyle brand in Bangladesh.' },
    { name: 'Foodpanda', category: 'Food & Beverage', description: 'Fastest food delivery service in Bangladesh.' },
    { name: "Believer's Sign", category: 'Fashion', description: 'Premium modest fashion brand.' }
];

const offerTypes = ['percentage', 'fixed'];
const discountValues = [10, 15, 20, 25, 30, 50, 500, 1000];

const getRandomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

const seedData = async () => {
    await connectDB();

    try {
        // 1. Create or Find Official Merchant
        let merchant = await Merchant.findOne({ email: 'official@offerbazar.com' });

        if (!merchant) {
            console.log('Creating Official Merchant account...');
            merchant = await Merchant.create({
                name: 'Official Stores',
                email: 'official@offerbazar.com',
                businessName: 'Offer Bazar Official',
                businessType: 'Aggregator',
                phone: '01700000000',
                approvalStatus: 'approved',
                isApproved: true,
                isActive: true,
                accessFeePaid: true
            });
        } else {
            console.log('Official Merchant account found.');
        }

        // 2. Create Stores and Offers
        for (const storeInfo of storesList) {
            // Find or create store
            let store = await Store.findOne({ name: storeInfo.name, merchant: merchant._id });

            if (!store) {
                console.log(`Creating store: ${storeInfo.name}`);
                store = await Store.create({
                    name: storeInfo.name,
                    category: storeInfo.category,
                    description: storeInfo.description,
                    merchant: merchant._id,
                    isActive: true,
                    isApproved: true,
                    contactEmail: 'contact@' + storeInfo.name.toLowerCase().replace(/['\s]/g, '') + '.com',
                    websiteUrl: 'https://www.' + storeInfo.name.toLowerCase().replace(/['\s]/g, '') + '.com'
                });
            } else {
                console.log(`Store exists: ${storeInfo.name}`);
            }

            // Remove existing offers for this store to ensure only 6 exists
            await Offer.deleteMany({ store: store._id });
            console.log(`Cleared existing offers for ${storeInfo.name}`);

            console.log(`Adding 1 offer for ${storeInfo.name}...`);

            const offersToCreate = [];
            for (let i = 0; i < 1; i++) {
                const discountType = offerTypes[Math.floor(Math.random() * offerTypes.length)];
                let discountVal;

                if (discountType === 'percentage') {
                    // For percentage, pick from values <= 80
                    const percentageValues = [10, 15, 20, 25, 30, 40, 50, 60, 70, 80];
                    discountVal = percentageValues[Math.floor(Math.random() * percentageValues.length)];
                } else {
                    // For fixed, pick from all, maybe prefer larger ones
                    discountVal = discountValues[Math.floor(Math.random() * discountValues.length)];
                }

                offersToCreate.push({
                    title: `${discountType === 'percentage' ? discountVal + '%' : '৳' + discountVal} Off at ${storeInfo.name}`,
                    offerCode: (storeInfo.name.substring(0, 3).replace(/[^a-zA-Z]/g, 'OFF') + Math.floor(Math.random() * 10000)).toUpperCase(),
                    description: `Enjoy huge savings with this exclusive offer from ${storeInfo.name}. Valid for a limited time!`,
                    discount: discountVal,
                    discountType: discountType,
                    store: store._id,
                    category: storeInfo.category,
                    merchant: merchant._id,
                    expiryDate: getRandomDate(new Date(), new Date(new Date().setFullYear(new Date().getFullYear() + 1))),
                    isActive: true,
                    isApproved: true,
                    isFeatured: Math.random() < 0.2 // 20% chance to be featured
                });
            }

            await Offer.insertMany(offersToCreate);
        }

        console.log('Data seeding completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error(`Error seeding data: ${error.message}`);
        process.exit(1);
    }
};

seedData();
