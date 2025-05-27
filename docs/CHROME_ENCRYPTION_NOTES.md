# Chrome Cookie Encryption Discovery

## Issue
Chrome encrypts cookie values in the cookies SQLite database. The `value` field is empty and actual values are stored in the `encrypted_value` BLOB field.

## Database Schema
```sql
CREATE TABLE cookies(
  creation_utc INTEGER NOT NULL,
  host_key TEXT NOT NULL,
  top_frame_site_key TEXT NOT NULL,
  name TEXT NOT NULL,
  value TEXT NOT NULL,                -- This is empty for encrypted cookies
  encrypted_value BLOB NOT NULL,      -- Actual encrypted value stored here
  path TEXT NOT NULL,
  expires_utc INTEGER NOT NULL,
  is_secure INTEGER NOT NULL,
  is_httponly INTEGER NOT NULL,
  last_access_utc INTEGER NOT NULL,
  has_expires INTEGER NOT NULL,
  is_persistent INTEGER NOT NULL,
  priority INTEGER NOT NULL,
  samesite INTEGER NOT NULL,
  source_scheme INTEGER NOT NULL,
  source_port INTEGER NOT NULL,
  last_update_utc INTEGER NOT NULL,
  source_type INTEGER NOT NULL,
  has_cross_site_ancestor INTEGER NOT NULL
);
```

## Next Steps for Authentication
1. Implement Chrome cookie decryption (requires OS keychain access)
2. Alternative: Parse localStorage when Chrome is closed
3. Alternative: Use browser automation to extract tokens from running Chrome
4. Alternative: Manual token input for MVP testing

## Current Status
- Chrome detection: ✅ Working
- Cookie database access: ✅ Working  
- Cookie value extraction: ❌ Blocked by encryption
- localStorage parsing: ❌ Blocked by file locking (Chrome running)

## Recommendation
For immediate testing and development, implement manual token input option in `poc init --manual` to allow users to paste session tokens directly from browser developer tools.