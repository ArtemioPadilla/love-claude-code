#!/usr/bin/env node

/**
 * MCP Cost Estimation Script
 * Estimates costs across providers based on usage
 */

const args = process.argv.slice(2);
const users = parseInt(args[0]) || 10000;
const projectType = args[1] || 'web';
const dataVolume = args[2] || 'medium';

console.log('\n💰 Cost Estimation Report\n');
console.log('━'.repeat(60));
console.log(`Project Type: ${projectType}`);
console.log(`Expected Users: ${users.toLocaleString()}`);
console.log(`Data Volume: ${dataVolume}`);
console.log('━'.repeat(60));

// Cost calculation logic
function calculateCosts(users, projectType, dataVolume) {
  const costs = {
    local: { monthly: 0, setup: 0 },
    firebase: { monthly: 0, setup: 0 },
    aws: { monthly: 0, setup: 0 }
  };

  // Data volume multipliers
  const dataMultiplier = {
    low: 0.5,
    medium: 1,
    high: 2
  };

  // Project type multipliers
  const projectMultiplier = {
    web: 1,
    mobile: 1.2,
    api: 0.8,
    fullstack: 1.5
  };

  const dataMult = dataMultiplier[dataVolume] || 1;
  const projMult = projectMultiplier[projectType] || 1;

  // Local costs (hosting only)
  if (users > 1000) {
    costs.local.monthly = 20 * projMult; // Basic VPS
  }
  if (users > 10000) {
    costs.local.monthly = 50 * projMult; // Better server
  }
  if (users > 100000) {
    costs.local.monthly = 200 * projMult; // Dedicated server
  }

  // Firebase costs
  if (users <= 10000) {
    costs.firebase.monthly = 0; // Free tier
  } else {
    // Base cost after free tier
    costs.firebase.monthly = 25;
    
    // Additional users (Firestore reads/writes)
    const additionalUsers = users - 10000;
    costs.firebase.monthly += (additionalUsers / 1000) * 5 * dataMult;
    
    // Storage costs
    if (dataVolume === 'high') {
      costs.firebase.monthly += 30;
    } else if (dataVolume === 'medium') {
      costs.firebase.monthly += 10;
    }
    
    // Functions/hosting
    costs.firebase.monthly += 20 * projMult;
  }

  // AWS costs
  if (users <= 1000) {
    costs.aws.monthly = 10; // Minimal usage
  } else {
    // Base infrastructure
    costs.aws.monthly = 50;
    
    // Compute (Lambda/EC2)
    costs.aws.monthly += (users / 1000) * 10 * projMult;
    
    // Storage (S3/DynamoDB)
    costs.aws.monthly += (users / 1000) * 5 * dataMult;
    
    // Data transfer
    costs.aws.monthly += (users / 10000) * 20;
    
    // Additional services
    if (projectType === 'fullstack' || projectType === 'mobile') {
      costs.aws.monthly += 30; // CloudFront, API Gateway, etc.
    }
  }

  // AWS has higher setup costs
  costs.aws.setup = 500; // Initial configuration and setup

  return costs;
}

const costs = calculateCosts(users, projectType, dataVolume);

// Display results
console.log('\n📊 Estimated Monthly Costs:\n');

const providers = [
  { name: 'Local Provider', cost: costs.local, icon: '🏠' },
  { name: 'Firebase', cost: costs.firebase, icon: '🔥' },
  { name: 'AWS', cost: costs.aws, icon: '☁️' }
];

providers.sort((a, b) => a.cost.monthly - b.cost.monthly);

providers.forEach((provider, index) => {
  const yearly = provider.cost.monthly * 12;
  console.log(`${index + 1}. ${provider.icon} ${provider.name}`);
  console.log(`   Monthly: $${provider.cost.monthly.toFixed(2)}`);
  console.log(`   Yearly: $${yearly.toFixed(2)}`);
  if (provider.cost.setup > 0) {
    console.log(`   Setup: $${provider.cost.setup.toFixed(2)} (one-time)`);
  }
  console.log('');
});

// Free tier information
console.log('📌 Free Tier Limits:\n');
console.log('• Local: No limits (self-hosted)');
console.log('• Firebase: 10k users, 1GB storage, 125k function calls/month');
console.log('• AWS: 12-month free tier for new accounts\n');

// Recommendations
console.log('💡 Cost Optimization Tips:\n');

if (users <= 10000) {
  console.log('✓ You can use Firebase free tier!');
  console.log('✓ Local development is perfect for prototyping');
} else if (users <= 50000) {
  console.log('✓ Firebase offers the best value at this scale');
  console.log('✓ Consider AWS if you need specific compliance features');
} else {
  console.log('✓ AWS becomes more cost-effective at scale');
  console.log('✓ Consider reserved instances for additional savings');
  console.log('✓ Implement caching to reduce costs');
}

console.log('\n⚠️  Note: These are estimates. Actual costs may vary based on:');
console.log('  • Specific feature usage');
console.log('  • Geographic distribution');
console.log('  • Traffic patterns');
console.log('  • Optimization efforts\n');

// Cost breakdown chart
console.log('📈 Cost Breakdown by User Count:\n');
console.log('Users'.padEnd(15) + 'Local'.padEnd(15) + 'Firebase'.padEnd(15) + 'AWS');
console.log('─'.repeat(60));

const userCounts = [100, 1000, 10000, 50000, 100000, 500000];
userCounts.forEach(count => {
  const c = calculateCosts(count, projectType, dataVolume);
  console.log(
    count.toLocaleString().padEnd(15) +
    ('$' + c.local.monthly.toFixed(0)).padEnd(15) +
    ('$' + c.firebase.monthly.toFixed(0)).padEnd(15) +
    '$' + c.aws.monthly.toFixed(0)
  );
});

console.log('\n');