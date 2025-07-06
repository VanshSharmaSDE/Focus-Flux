# Account Restoration Flow Documentation

## Overview
The account restoration flow has been refactored to use a dedicated recovery service and implements a secure, user-friendly restoration process for deleted accounts.

## Flow Architecture

### 1. Recovery Service (`src/services/recovery.js`)
- **Purpose**: Handles all account restoration logic
- **Key Methods**:
  - `checkEmailExists(email)`: Checks if an email exists and its status
  - `checkAccountBlocked(email)`: Tests if Appwrite account is blocked
  - `checkAccountDeleted(profile)`: Verifies if account is marked as deleted
  - `performRestorationChecks(email)`: Comprehensive validation
  - `restoreAccountByEmail(email)`: Main restoration flow
  - `completeRestoration(userId, secret)`: Finalize restoration after verification

### 2. Auth Service Updates (`src/services/auth.js`)
- **Removed**: All recovery-related methods moved to recovery service
- **Updated**: Import and use recovery service for deleted account checks
- **Cleaner**: Focused on authentication tasks only

### 3. Restoration Process

#### Step 1: Initial Checks
When user enters email on restore page:
1. Check if email exists in database
2. Check if Appwrite account is blocked
3. Check if account is marked as `isDeleted: true`

#### Step 2: Database Restoration
If all checks pass:
1. Update user profile: `isDeleted: false`
2. Set `restoredAt` timestamp (Indian timezone)
3. Reset email to original value
4. Mark as unverified: `emailVerified: false`
5. Store verification data

#### Step 3: Email Verification
Send verification email using multiple fallback methods:
1. Appwrite Magic URL session
2. Appwrite direct verification
3. Recovery verification
4. External email service (fallback)

#### Step 4: Verification Completion
When user clicks verification link:
1. Verify using Appwrite `updateVerification`
2. Update profile: `emailVerified: true`
3. Set `emailVerifiedAt` timestamp
4. Clear verification data
5. Unblock Appwrite account status
6. Auto-login user (if possible)

## Key Features

### Security
- Verification expiry (5 minutes)
- Multiple verification methods
- Proper error handling
- Database schema compatibility

### User Experience
- Clear error messages
- Automatic redirection after verification
- Toast notifications
- Loading states

### Robustness
- Fallback verification methods
- Indian timezone timestamps
- Comprehensive error handling
- Session management

## Files Modified

1. **src/services/recovery.js** - New dedicated recovery service
2. **src/services/auth.js** - Removed recovery logic, added recovery service import
3. **src/pages/RestoreAccount.jsx** - Updated to use recovery service
4. **src/pages/VerifyEmail.jsx** - Added restoration verification handling

## Testing the Flow

### 1. Account Deletion
Use existing delete account feature to mark account as deleted.

### 2. Restoration Request
1. Go to `/restore-account`
2. Enter the original email address
3. Submit form

### 3. Email Verification
1. Check email for verification link
2. Click the verification link
3. Should redirect to dashboard after successful verification

### 4. Login Verification
After restoration, user should be able to:
1. Login with original credentials
2. Access dashboard normally
3. Account status should show as active

## Error Handling

### Email Not Found
- Clear message: "No account found with this email"
- Suggestion to sign up

### Account Not Deleted
- Message: "Account appears to be active already"
- Suggestion to try logging in

### Verification Failed
- Multiple fallback methods attempted
- Clear error messages
- Option to contact support

### Already Restored
- Graceful handling of duplicate restoration attempts
- Clear messaging about account status

## Important Notes

1. **Timestamps**: All restoration timestamps use Indian timezone
2. **Account Identification**: Deleted accounts are identified by exact email match
3. **Session Management**: Automatic login after successful verification
4. **Fallback Methods**: Multiple email sending methods for reliability
5. **Status Updates**: Appwrite account status is unblocked after verification
6. **Database Schema**: Compatible with existing database structure without requiring new attributes

## Future Improvements

1. Add restoration history tracking
2. Implement admin restoration tools
3. Add restoration analytics
4. Enhanced security with 2FA
5. Bulk restoration capabilities
