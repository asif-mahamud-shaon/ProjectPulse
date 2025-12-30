require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://asif_mahamud_shaon:asif_mahamud_shaon200@cluster0.bdborqr.mongodb.net/ProjectPulse?appName=Cluster0';

// Function to generate employee email from name
// Example: "John Doe" -> "j.doe@projectpulse.com"
// Example: "Shamim Hossein" -> "s.hossein@projectpulse.com"
const generateEmployeeEmail = (fullName) => {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length >= 2) {
    const firstName = parts[0].toLowerCase();
    const lastName = parts[parts.length - 1].toLowerCase();
    return `${firstName.charAt(0)}.${lastName}@projectpulse.com`;
  } else if (parts.length === 1) {
    return `${parts[0].toLowerCase()}@projectpulse.com`;
  }
  return `employee@projectpulse.com`;
};

// Function to generate client email from company name
// Example: "Acme Corporation" -> "acme.corporation@projectpulse.com"
const generateClientEmail = (companyName) => {
  return companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .trim()
    .replace(/\s+/g, '.') // Replace spaces with dots
    .replace(/\.+/g, '.') // Replace multiple dots with single dot
    + '@projectpulse.com';
};

const seedUsers = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    
    // Wait a bit to ensure connection is stable
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Clear existing users
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Create Admin (1)
    const admin = new User({
      name: 'Admin User',
      email: 'admin@projectpulse.com',
      password: 'admin123',
      role: 'ADMIN'
    });
    await admin.save();
    console.log('✅ Created Admin: admin@projectpulse.com / admin123');

    // Create Employees (10)
    const employeeNames = [
      'John Doe',
      'Jane Smith',
      'Mike Johnson',
      'Sarah Williams',
      'David Brown',
      'Emily Davis',
      'Robert Wilson',
      'Lisa Anderson',
      'James Taylor',
      'Maria Garcia'
    ];

    const employees = [];
    for (let i = 0; i < employeeNames.length; i++) {
      const email = generateEmployeeEmail(employeeNames[i]);
      const employee = new User({
        name: employeeNames[i],
        email: email,
        password: 'employee123',
        role: 'EMPLOYEE'
      });
      await employee.save();
      employees.push(employee);
      console.log(`✅ Created Employee ${i + 1}: ${email} / employee123`);
    }

    // Create Clients (15)
    const clientNames = [
      'Acme Corporation',
      'Tech Solutions Inc',
      'Global Industries Ltd',
      'Digital Innovations Co',
      'Future Systems LLC',
      'Smart Business Group',
      'Advanced Technologies',
      'Modern Solutions Inc',
      'Enterprise Partners',
      'Innovation Labs',
      'Cloud Services Corp',
      'Data Analytics Ltd',
      'Software Solutions Inc',
      'Network Systems Co',
      'Creative Digital Agency'
    ];

    const clients = [];
    for (let i = 0; i < clientNames.length; i++) {
      const email = generateClientEmail(clientNames[i]);
      const client = new User({
        name: clientNames[i],
        email: email,
        password: 'client123',
        role: 'CLIENT'
      });
      await client.save();
      clients.push(client);
      console.log(`✅ Created Client ${i + 1}: ${email} / client123`);
    }

    console.log('\n🎉 Seed completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Admin: 1`);
    console.log(`   - Employees: ${employees.length}`);
    console.log(`   - Clients: ${clients.length}`);
    console.log('\n📋 Login Credentials:');
    console.log('\n🔴 ADMIN:');
    console.log('   Email: admin@projectpulse.com');
    console.log('   Password: admin123');
    console.log('\n🟢 EMPLOYEES (10 users):');
    for (let i = 0; i < employees.length; i++) {
      console.log(`   ${i + 1}. ${employeeNames[i]} - Email: ${employees[i].email} / Password: employee123`);
    }
    console.log('\n🔵 CLIENTS (15 users):');
    for (let i = 0; i < clients.length; i++) {
      console.log(`   ${i + 1}. ${clientNames[i]} - Email: ${clients[i].email} / Password: client123`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedUsers();
