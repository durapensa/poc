# Browser Console API Test

## Quick Fresh Token Test

1. **Open claude.ai in Chrome**
2. **Open DevTools Console (F12 → Console tab)**
3. **Paste this script and press Enter:**

```javascript
// Test Claude API directly from browser console
(async function testAPI() {
  try {
    console.log('Testing Claude API...');
    
    // Get current cookies
    const cookies = document.cookie;
    console.log('Using cookies:', cookies.substring(0, 100) + '...');
    
    // Make API request
    const response = await fetch('/api/organizations/1ada8651-e431-4f80-b5da-344eb1d3d5fa/chat_conversations?limit=5&starred=false', {
      method: 'GET',
      headers: {
        'Accept': '*/*',
        'Content-Type': 'application/json',
        'anthropic-client-platform': 'web_claude_ai',
        'anthropic-client-version': 'unknown',
        'anthropic-client-sha': 'unknown'
      }
    });
    
    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! Conversations found:', data.conversations?.length || 0);
      console.log('First conversation:', data.conversations?.[0]);
      
      // Extract fresh cookies for our CLI tool
      console.log('\n🎯 COPY THIS COOKIE STRING FOR CLI:');
      console.log(document.cookie);
      
    } else {
      console.log('❌ Error:', response.status, response.statusText);
      const error = await response.text();
      console.log('Error details:', error);
    }
    
  } catch (error) {
    console.log('❌ Request failed:', error);
  }
})();
```

4. **If the test succeeds, copy the cookie string and update our CLI tool**

This will test the API with your current fresh browser session and give us working cookies if successful!