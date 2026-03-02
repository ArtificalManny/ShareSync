import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from the backend root
dotenv.config({ path: path.join(__dirname, '../.env') });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sharesync';

// 1. Minimal Project Schema just for seeding purposes
const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  color: { type: String, default: '#7C3AED' },
  icon: { type: String, default: 'Folder' },
  public: { type: Boolean, default: true },
  taskCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
}, { strict: false }); // strict: false allows us to safely bypass complex validations during seeding

const Project = mongoose.models.Project || mongoose.model('Project', ProjectSchema);

const demoProjects = [
  {
    name: 'ShareSync Core',
    description: 'Core platform development',
    color: '#7C3AED', // violet
    icon: 'Rocket',
    public: true,
  },
  {
    name: 'Marketing Launch',
    description: 'Go-to-market campaign',
    color: '#F59E0B', // amber
    icon: 'TrendingUp',
    public: true,
  },
  {
    name: 'Mobile App',
    description: 'iOS & Android development',
    color: '#2DD4BF', // teal
    icon: 'Smartphone',
    public: true,
  },
  {
    name: 'Design System',
    description: 'Component library & tokens',
    color: '#EC4899', // pink
    icon: 'Palette',
    public: true,
  },
  {
    name: 'API v2',
    description: 'Backend infrastructure',
    color: '#3B82F6', // blue
    icon: 'Server',
    public: true,
  },
  {
    name: 'Customer Research',
    description: 'User interviews & analytics',
    color: '#10B981', // green
    icon: 'Users',
    public: true,
  }
];

async function runSeed() {
  console.log('🌱 Starting database seed...');
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`✅ Connected to MongoDB at ${MONGODB_URI}`);

    // 2. Safely purge duplicate "Uno" test projects
    const deleteResult = await Project.deleteMany({ 
      name: { $regex: /^Uno/i } 
    });
    console.log(`🧹 Cleared ${deleteResult.deletedCount} "Uno" placeholder projects.`);

    // 3. Optional: Prevent duplicate demo projects if script is run multiple times
    const existingDemoNames = demoProjects.map(p => p.name);
    const existingProjects = await Project.find({ name: { $in: existingDemoNames } });
    
    if (existingProjects.length > 0) {
      console.log(`⚠️  Found ${existingProjects.length} existing demo projects. Skipping insertion to avoid duplicates.`);
    } else {
      // 4. Insert the new beautiful demo projects
      const inserted = await Project.insertMany(demoProjects);
      console.log(`✨ Successfully seeded ${inserted.length} realistic demo projects!`);
    }

  } catch (error) {
    console.error('❌ Error during seeding:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB.');
    process.exit(0);
  }
}

runSeed();
