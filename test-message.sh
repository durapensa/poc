#!/bin/bash

# Test the actual message sending curl command
curl -s 'https://claude.ai/api/organizations/1ada8651-e431-4f80-b5da-344eb1d3d5fa/chat_conversations/835dc1bf-a19d-44a8-a52b-c61fc587aac0/completion' \
  -H 'accept: text/event-stream, text/event-stream' \
  -H 'accept-language: en-US,en;q=0.9' \
  -H 'anthropic-client-platform: web_claude_ai' \
  -H 'content-type: application/json' \
  -b 'activitySessionId=131d246a-de60-4e07-b294-55a6699743a1; anthropic-device-id=9e375fc5-ab10-418c-ac42-141811bc1825; ajs_anonymous_id=dc893078-42fd-4638-9048-3a30469b5933; CH-prefers-color-scheme=dark; __ssid=dbb0bd6ca90d8571816366c06a4c2df; lastActiveOrg=1ada8651-e431-4f80-b5da-344eb1d3d5fa; intercom-device-id-lupk8zyo=372790a8-ba08-4696-9b57-f6db0053e92d; sessionKey=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; user-sidebar-visible-on-load=false; cf_clearance=SiU9z2HkUQzj7iixIIWLmCW8eFi.r3N8DEheMJ46650-1748374291-1.2.1.1-O7HI6Lq3i2BwyJ3vCo6KhjZ5iKu_R0xr.n74BLkOHBul7UBe81k01QNuRTDAFH8ae_2NAmVLZhM2ozlA7afyXP4NRLKSX9QqE4FMfm1nKv6AqNomAKXKnDJlDSZ2SE7LSI.2NA2C_VxaTBCoorT3FCGE67jS.9fv1OJ7HrIXp7z0QL.bTcRx2tQAeUyIyouk1U1dsHtNpfMekt5QjWhbUqEC2t3kouD4Ny4wAb0dKapSpq9ZhNR61HQX9KEI7UEz6aRtZIBldAMMVLKvehPiiUlYlKLMd8ZGsKGWv7nb98OdEma.9UUwj_d5a51QTXQO4nNYPuGk_U5W3Bw0Z6ZqMAdUkBf8QnGAVZ.cgc.n5.A; intercom-session-lupk8zyo=QWVqNzZQbDVJSGVhTncyRVlaTVo2MHRnWXNtazNPTFF6OEhUa1ozcDNxeWNLOCt1bW0vZFBtZFBmenI0bEl3c2w3NDdxa3d0UFNqckROdTFOS2JndUZ4bzBPc044V0NuejZ2b0VBdVZhdjQ9LS15TDUvU3hZbjRWaWpCd3krendkMUZRPT0=--6dd2535f0a077041d56c71cb70f652253a855360' \
  -H 'origin: https://claude.ai' \
  -H 'referer: https://claude.ai/chat/835dc1bf-a19d-44a8-a52b-c61fc587aac0' \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36' \
  --data-raw '{
    "prompt": "Hello from the CLI tool!",
    "parent_message_uuid": null,
    "timezone": "America/New_York",
    "personalized_styles": [
      {
        "type": "default",
        "key": "Default", 
        "name": "Normal",
        "nameKey": "normal_style_name",
        "prompt": "Normal",
        "summary": "Default responses from Claude",
        "summaryKey": "normal_style_summary",
        "isDefault": true
      }
    ],
    "locale": "en-US",
    "tools": [
      {"type": "web_search_v0", "name": "web_search"},
      {"type": "artifacts_v0", "name": "artifacts"},
      {"type": "repl_v0", "name": "repl"}
    ],
    "attachments": [],
    "files": [],
    "sync_sources": [],
    "rendering_mode": "messages"
  }'