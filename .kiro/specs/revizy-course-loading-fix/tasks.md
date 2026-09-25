# Implementation Plan: Revizy Course Loading Bugfix

## Overview

This implementation plan addresses three critical bugs in the Revizy educational platform:
1. **Database Bypass Bug**: `openMatiere()` function bypasses Supabase and uses AI fallback instead of database
2. **Incomplete Chapter Loading**: Only 2/7 chapters display per subject instead of all available chapters 
3. **QCM Answer Revelation**: QCM questions show "(Correct)" labels revealing answers to students

The fix ensures proper database integration through the `get_curriculum_topics` RPC while preserving all existing functionality including authentication, payments, and free chapter business rules.

## Tasks

- [x] 1. Fix database integration in openMatiere() function
  - [x] 1.1 Implement Supabase RPC call to get_curriculum_topics 
    - Modify `openMatiere()` in `app.js` to call `supabaseClient.rpc('get_curriculum_topics')`
    - Pass correct parameters: niveau, serie, subject name
    - Handle response and populate `chapitresDatabase` cache with real curriculum data
    - _Requirements: 2.1, 2.4_
  
  - [ ]* 1.2 Write unit tests for database integration
    - Test RPC call with different niveau/serie/subject combinations
    - Test error handling when Supabase is unavailable
    - _Requirements: 2.1, 2.4_

- [ ] 2. Fix chapter display and count issues
  - [x] 2.1 Ensure all chapters render correctly in UI
    - Fix `listElem.innerHTML` mapping to display all chapters from database response
    - Remove any array slicing or limiting that causes only 2 chapters to show
    - Verify chapter numbering and ordering matches database content
    - _Requirements: 2.2_
  
  - [ ]* 2.2 Write property test for complete chapter loading
    - **Property 1: All Available Chapters Display**
    - **Validates: Requirements 2.2**
    - Test that all chapters from database are displayed in UI
  
  - [ ] 2.3 Fix fallback logic and error handling
    - Only use `fetchAutoContentFromAI()` when database call fails with specific error
    - Show user-friendly error messages instead of silent fallback to AI
    - Add proper logging for debugging database connection issues
    - _Requirements: 2.1, 2.4_

- [x] 3. Fix QCM answer revelation bug
  - [x] 3.1 Sanitize QCM options in frontend display
    - Apply `cleanQuizOption()` logic to remove "(Correct)", "(Bonne réponse)" indicators
    - Ensure `exercice.correctOption` is never displayed to users in UI
    - Update `viewChapterContent()` function to clean options before display
    - _Requirements: 2.3_
  
  - [ ]* 3.2 Write unit tests for QCM sanitization
    - Test that correct answer indicators are properly removed
    - Test various indicator formats: "(Correct)", "- Bonne réponse", etc.
    - _Requirements: 2.3_

- [ ] 4. Checkpoint - Test database integration works
  - Ensure all tests pass, verify database chapters load correctly
  - Ask the user if questions arise about database connectivity

- [ ] 5. Preserve existing functionality
  - [ ] 5.1 Verify authentication flows remain unchanged
    - Test user login/logout continues to work after database fix
    - Ensure session management and profile loading work correctly
    - _Requirements: 3.1_
  
  - [ ] 5.2 Verify payment processing remains unchanged
    - Test chapter unlock purchases work correctly with database-loaded chapters
    - Ensure unlocked_chapters table integration still functions
    - Verify FedaPay webhook handling continues working
    - _Requirements: 3.2_
  
  - [ ] 5.3 Verify business rules are preserved
    - Test that 3-free-chapters-per-subject rule still applies
    - Ensure pricing logic (150 FCFA for BAC, 100 FCFA for Brevet) works
    - Verify free/paid chapter indicators display correctly
    - _Requirements: 3.4_

- [ ] 6. Integration testing and verification
  - [ ] 6.1 Test complete user flows
    - Test full flow: login → select subject → view all chapters → access QCM (without revealed answers)
    - Test switching between different subjects and verifying correct chapter counts
    - Test both BAC and Brevet levels with multiple series
    - _Requirements: 2.1, 2.2, 2.3_
  
  - [ ]* 6.2 Write integration tests for preservation
    - **Property 2: Preservation of Non-Database Functionality**
    - **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
    - Test that admin dashboard and statistics continue working
    - Test UI layout and navigation flow remain identical
  
  - [ ] 6.3 Verify admin functionality preservation
    - Test admin dashboard statistics display correctly
    - Test user management and transaction viewing still work
    - Ensure global stats calculation remains functional
    - _Requirements: 3.5_

- [ ] 7. Final checkpoint and deployment preparation
  - Ensure all tests pass and no regressions detected
  - Verify chapter loading performance is acceptable
  - Ask the user if questions arise about functionality or performance

## Notes

- Tasks marked with `*` are optional testing tasks and can be skipped for faster MVP
- Each task references specific requirements from the bugfix document for traceability
- Database integration is the highest priority as it fixes the core loading issue
- Preservation testing ensures no existing functionality is broken by the fixes
- The 3-free-chapters business rule and payment flows must remain exactly as before
- Error handling should be user-friendly while providing debugging information

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.2"] },
    { "id": 3, "tasks": ["5.1", "5.2", "5.3"] },
    { "id": 4, "tasks": ["6.1", "6.2", "6.3"] }
  ]
}
```