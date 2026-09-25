// Test script to verify chapter generation
const fs = require('fs');

// Read and evaluate the app.js to extract the KNOWLEDGE_BASE and functions
const appContent = fs.readFileSync('app.js', 'utf8');

// Extract KNOWLEDGE_BASE
const knowledgeMatch = appContent.match(/const KNOWLEDGE_BASE = \{[\s\S]*?\n\};/);
if (!knowledgeMatch) {
  console.error('Could not extract KNOWLEDGE_BASE');
  process.exit(1);
}

// Extract generateAutoContentFallback function
const functionMatch = appContent.match(/function generateAutoContentFallback\([\s\S]*?\n\}/);
if (!functionMatch) {
  console.error('Could not extract generateAutoContentFallback function');
  process.exit(1);
}

// Create a mock environment
const state = { currentSerie: 'C' };

// Evaluate the extracted code
eval(knowledgeMatch[0]);
eval(functionMatch[0]);

// Test different subjects
const subjects = ['Mathématiques', 'SVT', 'Physique-Chimie'];

console.log('🧪 Testing chapter generation for fallback content:\n');

subjects.forEach(subject => {
  console.log(`📚 Testing: ${subject}`);
  const chapters = generateAutoContentFallback(subject, 'bac');
  console.log(`   Generated: ${chapters.length} chapters`);
  chapters.forEach((chapter, i) => {
    console.log(`   ${i + 1}. ${chapter.title}`);
  });
  console.log('');
});

console.log('💡 Expected behavior: Each subject should show ALL generated chapters in the UI.');
console.log('🐛 Bug: Only 2 chapters are displaying instead of the full count above.');