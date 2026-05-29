import mongoose from 'mongoose';
import { User, Village, Pregnancy, Malnutrition } from '../models/index.js';
import dotenv from 'dotenv';
dotenv.config();

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/swasth-guardian');
    
    // Clear existing
    await User.deleteMany({});
    await Village.deleteMany({});
    await Pregnancy.deleteMany({});
    await Malnutrition.deleteMany({});

    // 1. Villages
    const v1 = await Village.create({ villageId: 'v101', name: 'Rampur', district: 'Varanasi', population: 1200, ashaContact: '9998887771' });
    const v2 = await Village.create({ villageId: 'v102', name: 'Mohanlal Ganj', district: 'Lucknow', population: 850, ashaContact: '9998887772' });

    // 2. Users
    await User.create({ phone: '9998887770', name: 'Ram Kumar', role: 'villager', villageId: 'v101' });
    await User.create({ phone: 'asha123', name: 'Sita Devi', role: 'ngo', villageId: 'v101' });
    await User.create({ phone: 'admin123', name: 'CMO Varanasi', role: 'admin' });

    // 3. Pregnancies
    await Pregnancy.create({ name: 'Sunita Devi', age: 24, villageId: v1.villageId, trimester: 3, riskLevel: 'High', dueDate: new Date('2026-08-15') });
    await Pregnancy.create({ name: 'Meena Kumari', age: 21, villageId: v1.villageId, trimester: 2, riskLevel: 'Low', dueDate: new Date('2026-11-05') });

    // 4. Malnutrition
    await Malnutrition.create({ childName: 'Raju', villageId: v1.villageId, ageMonths: 24, weight: 11.2, height: 85, status: 'Moderate' });
    await Malnutrition.create({ childName: 'Priya', villageId: v1.villageId, ageMonths: 36, weight: 14.5, height: 95, status: 'Normal' });

    console.log('Sample Datasets Initialized Successfully.');
    process.exit();
  } catch (err) {
    console.error('Seed Error:', err);
    process.exit(1);
  }
};

seedData();
