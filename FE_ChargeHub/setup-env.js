#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.join(__dirname, '.env');
const envTemplate = `# MapTiler API Key for map functionality
# Get your API key from: https://cloud.maptiler.com/
VITE_MAPTILER_API_KEY=your_maptiler_api_key_here

# Backend API URL
VITE_API_BASE_URL=http://localhost:8080

# Instructions:
# 1. Replace 'your_maptiler_api_key_here' with your actual MapTiler API key
# 2. Get API key from: https://cloud.maptiler.com/
# 3. Restart your development server after updating this file
`;

if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, envTemplate);
  console.log('✅ Created .env file with template');
  console.log('📝 Please edit .env file and add your MapTiler API key');
  console.log('🔗 Get API key from: https://cloud.maptiler.com/');
} else {
  console.log('⚠️  .env file already exists');
  console.log('📝 Please check if VITE_MAPTILER_API_KEY is configured');
}
