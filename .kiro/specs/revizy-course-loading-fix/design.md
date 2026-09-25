# Revizy Course Loading Bugfix Design

## Overview

This design addresses three critical bugs in the Revizy educational platform that prevent proper database connectivity and content display. The bugs involve: (1) bypassing Supabase database in openMatiere() function, (2) incomplete chapter loading showing only 2/7 chapters, and (3) QCM answers being revealed to students. The fix ensures proper database integration while preserving all existing functionality including user authentication, payment processing, and the free chapter model.

## Glossary

- **Bug_Condition (C)**: The condition that triggers the bug - when openMatiere() is called and bypasses database loading
- **Property (P)**: The desired behavior when courses are loaded - all chapters should be retrieved from Supabase database
- **Preservation**: Existing authentication, payment, and UI behavior that must remain unchanged by the fix
- **openMatiere()**: The function in `app.js` that loads subject chapters and currently bypasses database connection
- **chapitresDatabase**: The in-memory cache that should be populated from Supabase instead of fallback content
- **get_curriculum_topics**: The Supabase RPC function available at `/rest/v1/rpc/get_curriculum_topics`
- **fetchAutoContentFromAI()**: Function that generates fallback content, currently used as primary source instead of database

## Bug Details

### Bug Condition

The bug manifests when a user clicks on any subject (like "SVT" for BAC série C) in the matiere grid. The `openMatiere()` function is either not correctly connecting to the Supabase database, not calling the available `get_curriculum_topics` RPC, or not properly populating the chapitresDatabase cache with real curriculum data.

**Formal Specification:**
```
FUNCTION isBugCondition(input)
  INPUT: input of type SubjectClickEvent
  OUTPUT: boolean
  
  RETURN input.subjectName IS NOT NULL
         AND correspondingDatabaseChaptersExist(input.subjectName, input.niveau, input.serie)
         AND NOT databaseChaptersLoaded(input.subjectName)
END FUNCTION
```

### Examples

- **Concrete Example 1**: User clicks "SVT" in BAC série C → System shows "Revizy IA génère le programme complet" → loads 3-4 fallback chapters instead of 7 real chapters from database
- **Concrete Example 2**: User clicks "Mathématiques" in BAC série C → System generates AI content instead of loading the 8 real chapters from seed_curriculum.sql
- **Concrete Example 3**: User accesses any QCM → Options show "b) Proposition correcte (Correct)" revealing the answer instead of "b) Proposition correcte"
- **Edge Case Example**: When Supabase is temporarily unavailable → System should show error message instead of silently falling back to AI generation

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- User authentication and session management must continue to work exactly as before
- Payment processing for chapter unlocks must remain unchanged
- The 3-free-chapters-per-subject business rule must be preserved
- Admin dashboard and statistics must continue functioning
- UI layout and navigation flow must remain identical
- Error handling for network issues must be maintained

**Scope:**
All inputs that do NOT involve the chapter loading process should be completely unaffected by this fix. This includes:
- User login/logout flows
- Payment webhook handling
- Admin functions and statistics
- Subject/series selection UI behavior

## Hypothesized Root Cause

Based on the bug description and code analysis, the most likely issues are:

1. **Database Connection Issues**: The openMatiere() function may not be properly utilizing the configured Supabase client
   - supabaseClient is configured correctly in config.js
   - get_curriculum_topics RPC exists in schema_curriculum.sql
   - But openMatiere() immediately falls back to fetchAutoContentFromAI()

2. **Missing Database Query Implementation**: The function may not be calling the available RPC endpoint
   - Server.js has getCurriculumTopicsFromSupabase() function but frontend may not use it
   - No direct Supabase RPC call in openMatiere() function

3. **QCM Answer Cleanup**: The exercise options are not being properly sanitized
   - cleanQuizOption() function exists in server.js but may not be used in frontend display
   - Options contain "(Correct)" or similar indicators

4. **Chapter Count Limitation**: Only showing 2 chapters may be due to improper array handling or display logic

## Correctness Properties

Property 1: Bug Condition - Database Chapter Loading

_For any_ subject access where the subject exists in the database (isBugCondition returns true), the fixed openMatiere function SHALL retrieve all chapters from Supabase using the get_curriculum_topics RPC, populate chapitresDatabase[niveau][subjectName], and display all available chapters without fallback content generation.

**Validates: Requirements 2.1, 2.2**

Property 2: Preservation - Non-Database Functionality

_For any_ functionality that is NOT related to chapter loading (authentication, payments, admin features, UI navigation), the fixed code SHALL produce exactly the same behavior as the original code, preserving all existing user flows and business logic.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `app.js`

**Function**: `openMatiere(subjectName)`

**Specific Changes**:
1. **Database Query Integration**: Replace immediate fallback with proper Supabase RPC call
   - Add call to supabaseClient.rpc('get_curriculum_topics', {...})
   - Handle response and populate chapitresDatabase cache
   - Only use fetchAutoContentFromAI() if database call fails

2. **Chapter Display Fix**: Ensure all chapters are rendered
   - Fix any array slicing or limiting that causes only 2 chapters to show
   - Verify listElem.innerHTML properly displays all chapters

3. **QCM Answer Sanitization**: Clean exercise options before display
   - Apply cleanQuizOption() logic to remove "(Correct)" indicators
   - Ensure exercice.correctOption is not displayed to users

4. **Error Handling**: Add proper error handling for database failures
   - Show user-friendly error messages instead of silent fallback
   - Log errors for debugging while maintaining user experience

5. **Cache Management**: Implement proper cache population from database
   - Store real curriculum data in chapitresDatabase[niveau][subjectName]
   - Avoid repeated database calls for same subject

## Testing Strategy

### Validation Approach

The testing strategy follows a two-phase approach: first, surface counterexamples that demonstrate the bug on unfixed code, then verify the fix works correctly and preserves existing behavior.

### Exploratory Bug Condition Checking

**Goal**: Surface counterexamples that demonstrate the bug BEFORE implementing the fix. Confirm or refute the root cause analysis. If we refute, we will need to re-hypothesize.

**Test Plan**: Write tests that simulate clicking on subjects in different contexts and assert that the corresponding chapters are loaded from database. Run these tests on the UNFIXED code to observe failures and understand the root cause.

**Test Cases**:
1. **BAC Series C SVT Test**: Click "SVT" when niveau=bac, serie=C (will fail on unfixed code - shows AI content)
2. **BAC Series C Mathématiques Test**: Click "Mathématiques" when niveau=bac, serie=C (will fail on unfixed code - shows 2/8 chapters)
3. **Brevet Mathématiques Test**: Click "Mathématiques" when niveau=brevet (will fail on unfixed code - bypasses database)
4. **QCM Display Test**: Access any chapter exercise (will fail on unfixed code - shows correct answers)

**Expected Counterexamples**:
- Database chapters are not loaded, AI fallback content is generated instead
- Possible causes: missing RPC call, incorrect Supabase connection, improper error handling

### Fix Checking

**Goal**: Verify that for all inputs where the bug condition holds, the fixed function produces the expected behavior.

**Pseudocode:**
```
FOR ALL input WHERE isBugCondition(input) DO
  result := openMatiere_fixed(input.subjectName)
  ASSERT expectedBehavior(result)
END FOR
```

### Preservation Checking

**Goal**: Verify that for all inputs where the bug condition does NOT hold, the fixed function produces the same result as the original function.

**Pseudocode:**
```
FOR ALL input WHERE NOT isBugCondition(input) DO
  ASSERT openMatiere_original(input) = openMatiere_fixed(input)
END FOR
```

**Testing Approach**: Property-based testing is recommended for preservation checking because:
- It generates many test cases automatically across the input domain  
- It catches edge cases that manual unit tests might miss
- It provides strong guarantees that behavior is unchanged for all non-buggy inputs

**Test Plan**: Observe behavior on UNFIXED code first for authentication, payments, and UI interactions, then write property-based tests capturing that behavior.

**Test Cases**:
1. **Authentication Preservation**: Verify login/logout continues to work after chapter loading fix
2. **Payment Flow Preservation**: Verify chapter unlock purchases work correctly after fix
3. **Navigation Preservation**: Verify subject/series selection UI continues working
4. **Admin Functions Preservation**: Verify admin dashboard and statistics remain functional

### Unit Tests

- Test database RPC call with different niveau/serie/subject combinations
- Test error handling when Supabase is unavailable
- Test QCM option sanitization removes correct answer indicators
- Test that all chapters display correctly for subjects with 7+ chapters

### Property-Based Tests

- Generate random subject/niveau/serie combinations and verify database loading works
- Generate random user authentication states and verify preservation of auth behavior
- Test that all non-chapter-loading functionality continues to work across many scenarios

### Integration Tests

- Test full user flow: login → select subject → view all chapters → access QCM (without revealed answers)
- Test switching between different subjects and verifying correct chapter counts
- Test that payment flows continue working when chapters are loaded from database