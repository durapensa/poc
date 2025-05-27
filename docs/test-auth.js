// Quick test script to validate our API setup
const axios = require('axios');

async function testAuth() {
  try {
    // Read auth from the file
    const fs = require('fs');
    const auth = JSON.parse(fs.readFileSync('/Users/dp/.poc/auth.json', 'utf8'));
    
    console.log('Testing with token:', auth.sessionToken.substring(0, 20) + '...');
    console.log('Organization ID:', auth.organizationId);
    
    // Make the exact same request as our API client
    const response = await axios.get(
      `https://claude.ai/api/organizations/${auth.organizationId}/chat_conversations`,
      {
        params: { limit: 30, starred: true },
        headers: {
          'Accept': '*/*',
          'Content-Type': 'application/json',
          'Cookie': `activitySessionId=131d246a-de60-4e07-b294-55a6699743a1; anthropic-device-id=9e375fc5-ab10-418c-ac42-141811bc1825; ajs_anonymous_id=dc893078-42fd-4638-9048-3a30469b5933; CH-prefers-color-scheme=dark; cf_clearance=Cjd3O1vFpSMT46rdwb3GU8X.gOj.Ucl7uMmsh4plexk-1748372491-1.2.1.1-B7GLmEEHpdJdOqES1bIs5ZcecFo7qBwcMUd6B6KO9N..C_k5fZQacqrJosMGDDXCAxTYM2ijmGXhakGMBPj7O8Jc0zPJmLXKS6gTJK0K5mvkd5NIxWjgW9absf6SsL1CMXYTSs2YuJrntIrJ1y.eZhzxvMgDp50F52fU2O5r7ruspahwKYxON6046RGB65Oz_XgfA6YpG3gXZwY.ZztxrFMTidQWfGA6hgMKez1CtcAYJAL3t5L0RY5wUCkXAlPfAP4O0D6nH2H9H4T_MUoPcUoQSXV321LOchrDmu63RCkKMh_2C1ShSrX_IeUhvo3StTpNS3f1yJNiBXaZgQ81opQ1eV0b8Jcz5x.DeH9beFU; __ssid=dbb0bd6ca90d8571816366c06a4c2df; lastActiveOrg=${auth.organizationId}; intercom-device-id-lupk8zyo=372790a8-ba08-4696-9b57-f6db0053e92d; sessionKey=${auth.sessionToken}; intercom-session-lupk8zyo=WjhMTGp2blNTRkRidlljNENvb3ZtNGZUQWllYnBFMlJhVVZpa2RFWmRJQnRYMkN5OFpwZTY1cHFRNG8xSS8xTDVOY1hBOEZ0UEFkNkJCREVLNDZhck5XUUJiakN2K1UyOWV3b3JRMlpXRlk9LS1abG9lby9VWm5xUkJ3eWVFUkdQWUNBPT0=--06381b0061a4f37885a86ec487610755afa766df; user-sidebar-visible-on-load=false; __cf_bm=781vgbuexkEiHllgPPZY.Db3KYKRbbPB2q8Ok6bxeZg-1748374291-1.0.1.1-s_5pAMQXwYZRwJQH8ix8DMIsTxhQQ3K0OSooomjd_JXmKvoSCX4vKY2bhvc7cBowo4XzCI_I6V4EtC2rAFrgvZfpUeJau15GhAnzL_VuoEU`,
          'anthropic-client-platform': 'web_claude_ai',
          'anthropic-client-version': 'unknown',
          'anthropic-client-sha': 'unknown',
          'anthropic-device-id': '9e375fc5-ab10-418c-ac42-141811bc1825',
          'anthropic-anonymous-id': 'dc893078-42fd-4638-9048-3a30469b5933',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36',
          'Referer': 'https://claude.ai/',
          'Origin': 'https://claude.ai'
        }
      }
    );
    
    console.log('✅ Success! Status:', response.status);
    console.log('✅ Conversations found:', response.data.conversations?.length || 0);
    
  } catch (error) {
    console.log('❌ Error:', error.response?.status, error.response?.statusText);
    console.log('Response data:', error.response?.data);
  }
}

testAuth();