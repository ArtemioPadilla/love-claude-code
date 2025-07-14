#!/usr/bin/env node

/**
 * MCP Project Analysis Script
 * Analyzes a project directory and recommends the best provider
 */

const fs = require('fs');
const path = require('path');

const projectDir = process.argv[2] || '.';

console.log('\n🔍 Analyzing Project...\n');
console.log(`Directory: ${path.resolve(projectDir)}`);
console.log('━'.repeat(60));

// Analysis functions
function analyzeProject(dir) {
  const analysis = {
    type: 'unknown',
    features: [],
    estimatedUsers: 1000,
    dataVolume: 'low',
    hasAuth: false,
    hasRealtime: false,
    hasStorage: false,
    hasApi: false,
    hasMobile: false,
    framework: null,
    dependencies: []
  };

  // Check for package.json
  const packagePath = path.join(dir, 'package.json');
  if (fs.existsSync(packagePath)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      analysis.dependencies = Object.keys(pkg.dependencies || {});
      
      // Detect framework
      if (analysis.dependencies.includes('react')) analysis.framework = 'React';
      if (analysis.dependencies.includes('vue')) analysis.framework = 'Vue';
      if (analysis.dependencies.includes('express')) analysis.hasApi = true;
      if (analysis.dependencies.includes('socket.io')) analysis.hasRealtime = true;
      if (analysis.dependencies.includes('firebase')) analysis.features.push('firebase-sdk');
      if (analysis.dependencies.includes('aws-sdk')) analysis.features.push('aws-sdk');
      
      // Detect features
      if (analysis.dependencies.some(d => d.includes('auth'))) analysis.hasAuth = true;
      if (analysis.dependencies.some(d => d.includes('storage'))) analysis.hasStorage = true;
      if (analysis.dependencies.some(d => d.includes('react-native'))) analysis.hasMobile = true;
    } catch (e) {
      console.error('Error reading package.json');
    }
  }

  // Check for common files
  const files = fs.readdirSync(dir);
  
  if (files.includes('index.html') || analysis.framework) {
    analysis.type = analysis.hasApi ? 'fullstack' : 'web';
  } else if (analysis.hasApi) {
    analysis.type = 'api';
  }
  
  if (analysis.hasMobile) {
    analysis.type = 'mobile';
  }

  // Estimate project scale
  const sourceFiles = files.filter(f => f.endsWith('.js') || f.endsWith('.ts') || f.endsWith('.jsx') || f.endsWith('.tsx'));
  if (sourceFiles.length > 50) {
    analysis.estimatedUsers = 10000;
    analysis.dataVolume = 'medium';
  }
  if (sourceFiles.length > 100) {
    analysis.estimatedUsers = 50000;
    analysis.dataVolume = 'high';
  }

  return analysis;
}

function generateRecommendations(analysis) {
  const scores = {
    local: 0,
    firebase: 0,
    aws: 0
  };

  // Scoring based on project characteristics
  if (analysis.type === 'web' || analysis.type === 'mobile') {
    scores.firebase += 30;
    scores.local += 20;
    scores.aws += 10;
  }

  if (analysis.type === 'api') {
    scores.aws += 30;
    scores.local += 25;
    scores.firebase += 15;
  }

  if (analysis.type === 'fullstack') {
    scores.firebase += 25;
    scores.aws += 25;
    scores.local += 15;
  }

  // Feature-based scoring
  if (analysis.hasRealtime) {
    scores.firebase += 20;
    scores.aws += 5;
  }

  if (analysis.hasAuth) {
    scores.firebase += 15;
    scores.aws += 10;
  }

  if (analysis.hasStorage) {
    scores.firebase += 10;
    scores.aws += 15;
  }

  // Scale-based scoring
  if (analysis.estimatedUsers < 10000) {
    scores.local += 20;
    scores.firebase += 15;
  } else if (analysis.estimatedUsers > 50000) {
    scores.aws += 25;
    scores.firebase += 10;
  }

  // If already using a provider
  if (analysis.features.includes('firebase-sdk')) {
    scores.firebase += 20;
  }
  if (analysis.features.includes('aws-sdk')) {
    scores.aws += 20;
  }

  return scores;
}

// Run analysis
const analysis = analyzeProject(projectDir);
const scores = generateRecommendations(analysis);

// Display results
console.log('\n📋 Project Analysis Results:\n');
console.log(`Type: ${analysis.type}`);
console.log(`Framework: ${analysis.framework || 'None detected'}`);
console.log(`Estimated Scale: ${analysis.estimatedUsers.toLocaleString()} users`);
console.log(`Data Volume: ${analysis.dataVolume}`);
console.log('\nDetected Features:');
if (analysis.hasAuth) console.log('  ✓ Authentication');
if (analysis.hasRealtime) console.log('  ✓ Real-time features');
if (analysis.hasStorage) console.log('  ✓ File storage');
if (analysis.hasApi) console.log('  ✓ API backend');
if (analysis.hasMobile) console.log('  ✓ Mobile app');

// Provider recommendations
console.log('\n🏆 Provider Recommendations:\n');

const providers = [
  { name: 'Local', score: scores.local, icon: '🏠' },
  { name: 'Firebase', score: scores.firebase, icon: '🔥' },
  { name: 'AWS', score: scores.aws, icon: '☁️' }
].sort((a, b) => b.score - a.score);

providers.forEach((provider, index) => {
  const percentage = Math.round((provider.score / 100) * 100);
  const bar = '█'.repeat(Math.floor(percentage / 5)).padEnd(20);
  console.log(`${index + 1}. ${provider.icon} ${provider.name.padEnd(10)} ${bar} ${percentage}% match`);
});

// Detailed recommendation
console.log('\n💡 Recommendation:\n');

const winner = providers[0];
if (winner.name === 'Local') {
  console.log('Start with Local Provider because:');
  console.log('• Your project is in early stages');
  console.log('• You want zero configuration');
  console.log('• You\'re focused on development');
  console.log('\nYou can easily migrate to cloud providers later!');
} else if (winner.name === 'Firebase') {
  console.log('Firebase is recommended because:');
  console.log('• Your project needs real-time features');
  console.log('• You want rapid development');
  console.log('• The free tier covers your initial needs');
  console.log('• Built-in features match your requirements');
} else {
  console.log('AWS is recommended because:');
  console.log('• Your project requires enterprise features');
  console.log('• You need fine-grained control');
  console.log('• Scalability is a priority');
  console.log('• You have AWS expertise available');
}

// Migration path
if (analysis.estimatedUsers < 10000) {
  console.log('\n📈 Growth Path:');
  console.log('1. Start with Local (now)');
  console.log('2. Move to Firebase (1k-10k users)');
  console.log('3. Consider AWS (50k+ users)');
}

console.log('\n✨ Next Steps:');
console.log('1. Run "make dev-' + winner.name.toLowerCase() + '" to start with ' + winner.name);
console.log('2. Configure your settings in the app');
console.log('3. Use "make mcp-estimate" to see detailed costs');
console.log('4. Ask Claude Code for help with setup!\n');