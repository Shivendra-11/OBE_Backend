const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('./src/models/User');
const User = mongoose.model('User');

async function createStudentsBulk() {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/OBEbackend');
    console.log('Connected to MongoDB');

    const salt = await bcrypt.genSalt(10);
    const password = await bcrypt.hash('Student123!', salt);

    const firstNames = ['James', 'Mary', 'Robert', 'Patricia', 'John', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Matthew', 'Lisa', 'Anthony', 'Betty', 'Mark', 'Margaret', 'Donald', 'Sandra', 'Steven', 'Ashley', 'Paul', 'Kimberly', 'Andrew', 'Donna', 'Joshua', 'Emily', 'Kenneth', 'Michelle', 'Kevin'];
    const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green'];

    console.log('Generating students...');

    for (let i = 0; i < 40; i++) {
        // 0-19 -> Section A, 20-39 -> Section B
        const section = i < 20 ? 'A' : 'B';
        const name = `${firstNames[i]} ${lastNames[i]}`;
        const email = `stu_${section.toLowerCase()}_${i + 1}@obe.com`;
        
        // Random roll number between 2200320100 and 2200320999
        const randomRoll = '2200320' + Math.floor(100 + Math.random() * 899);

        const studentData = {
            name,
            email,
            password,
            role: 'student',
            studentId: randomRoll,
            semester: 3,
            section: section,
            academicYear: '2025-2026'
        };

        const exists = await User.findOne({ email: studentData.email });
        if (!exists) {
            await User.create(studentData);
            console.log(`[Section ${section}] Created: ${name} | Roll: ${randomRoll}`);
        } else {
            console.log(`[Section ${section}] Exists: ${studentData.email}`);
        }
    }

    console.log('\nDeployment Complete!');
    console.log('- Total Students Targeted: 40');
    console.log('- Sections: A (20), B (20)');
    console.log('- Role: Student');
    console.log('- Academic Session: 2025-2026 (Sem 3)');
    
    await mongoose.disconnect();
  } catch (err) {
    console.error('Deployment Error:', err);
    process.exit(1);
  }
}

createStudentsBulk();
