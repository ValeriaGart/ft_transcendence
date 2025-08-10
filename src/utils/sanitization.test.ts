/**
 * Test file for sanitization utilities
 * Run with: npm test
 */

import { escapeHtml, sanitizeForTemplate, createSafeTextNode } from './sanitization';

// Test escapeHtml function
function testEscapeHtml() {
  console.log('Testing escapeHtml...');
  
  const testCases = [
    { input: '<script>alert("xss")</script>', expected: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;' },
    { input: 'Hello & goodbye', expected: 'Hello &amp; goodbye' },
    { input: '<img src="x" onerror="alert(1)">', expected: '&lt;img src=&quot;x&quot; onerror=&quot;alert(1)&quot;&gt;' },
    { input: "'; DROP TABLE users; --", expected: "&#039;; DROP TABLE users; --" },
    { input: 'Normal text', expected: 'Normal text' },
    { input: '', expected: '' },
  ];
  
  testCases.forEach(({ input, expected }, index) => {
    const result = escapeHtml(input);
    if (result === expected) {
      console.log(`✓ Test ${index + 1} passed`);
    } else {
      console.error(`✗ Test ${index + 1} failed: expected "${expected}", got "${result}"`);
    }
  });
}

// Test sanitizeForTemplate function
function testSanitizeForTemplate() {
  console.log('\nTesting sanitizeForTemplate...');
  
  const testCases = [
    { input: '<script>alert("xss")</script>', expected: '&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;' },
    { input: 42, expected: '42' },
    { input: true, expected: 'true' },
    { input: null, expected: '' },
    { input: undefined, expected: '' },
    { input: { toString: () => '<script>' }, expected: '&lt;script&gt;' },
  ];
  
  testCases.forEach(({ input, expected }, index) => {
    const result = sanitizeForTemplate(input);
    if (result === expected) {
      console.log(`✓ Test ${index + 1} passed`);
    } else {
      console.error(`✗ Test ${index + 1} failed: expected "${expected}", got "${result}"`);
    }
  });
}

// Test createSafeTextNode function
function testCreateTextNode() {
  console.log('\nTesting createSafeTextNode...');
  
  if (typeof document !== 'undefined') {
    const testText = '<script>alert("xss")</script>';
    const textNode = createSafeTextNode(testText);
    
    if (textNode.nodeType === Node.TEXT_NODE && textNode.textContent === testText) {
      console.log('✓ createSafeTextNode test passed');
    } else {
      console.error('✗ createSafeTextNode test failed');
    }
  } else {
    console.log('! createSafeTextNode test skipped (no DOM environment)');
  }
}

// Run all tests
export function runSanitizationTests() {
  console.log('=== Sanitization Utility Tests ===');
  testEscapeHtml();
  testSanitizeForTemplate();
  testCreateTextNode();
  console.log('=== Tests Complete ===\n');
}

// Auto-run tests in development
if (import.meta.env?.DEV) {
  runSanitizationTests();
}
