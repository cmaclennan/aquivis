# PROJECT RULES - MANDATORY READING

## ⚠️ CRITICAL: Read This FIRST Before Making ANY Changes

This project has **strict rules** to prevent the issues that plagued the previous version. These rules exist because **rushing leads to bugs, technical debt, and wasted time**. This is a **rebuild from scratch** specifically because shortcuts were taken before.

---

## 🚫 RULE #1: NO CHANGES WITHOUT APPROVAL

**NEVER implement changes without explicit user confirmation first.**

### ❌ WRONG Approach:
- "I see the issue, let me fix it..."
- Making changes while explaining them
- "I'll implement this now and you can review it"
- Quick fixes without discussion

### ✅ CORRECT Approach:
1. **Identify** the issue or requirement
2. **Propose** the solution in detail
3. **Explain** the approach, files affected, and implications
4. **Wait** for user confirmation: "Shall I proceed?"
5. **Only then** implement the changes

### Example:
```
WRONG: "I see the problem. Let me update the property page..." [starts coding]

RIGHT: "I've identified the issue. Here's my proposed solution:
- Update property detail page logic
- Separate shared facilities from individual units
- Modify these 3 files: [list]
- Expected behavior: [describe]

Shall I proceed with this approach?"

[WAIT FOR USER RESPONSE]
```

---

## 🔍 RULE #2: THOROUGH REVIEWS ALWAYS

**Every change requires careful review BEFORE implementation.**

- Review database schema before writing migrations
- Check enum values match between database and forms
- Validate function signatures and return types
- Cross-reference related files and dependencies
- **Time spent reviewing is time saved debugging**

### Quality > Speed
- A 5-minute review can prevent a 2-hour debugging session
- Better to spend extra time upfront than waste time fixing mistakes
- This is a rebuild specifically because shortcuts failed before

---

## 📋 RULE #3: DOCUMENT EVERYTHING

**All issues, fixes, and decisions must be logged.**

### Required Documentation:
1. **Issue Logs** - What went wrong, why, and how it was fixed
2. **Decision Records** - Why certain approaches were chosen
3. **Migration Records** - All database changes with rollback plans
4. **Testing Results** - What was tested and the outcomes

### Purpose:
- Learn from mistakes
- Prevent repeated errors
- Enable handoff to new agents/developers
- Build institutional knowledge

---

## 🎯 RULE #4: NO SHORTCUTS, ONLY PROPER SOLUTIONS

**Quick fixes are banned. Production-ready solutions only.**

### Examples of Shortcuts (FORBIDDEN):
- "Let's just disable RLS for now"
- "We can hardcode this temporarily"
- "I'll add a TODO comment to fix later"
- "This workaround will get us moving"

### Proper Solutions (REQUIRED):
- Implement correct RLS policies from the start
- Design schemas that handle all use cases
- Write production-ready code immediately
- Fix root causes, not symptoms

### Why This Matters:
- Shortcuts compound and create technical debt
- "Temporary" solutions become permanent
- Quick fixes often cause larger problems later
- This project failed before due to accumulated shortcuts

---

## 🧪 RULE #5: TEST AND VERIFY EVERYTHING

**No change is complete without testing.**

### Testing Checklist:
- [ ] Code compiles without errors
- [ ] Linter passes (run `read_lints` on affected files)
- [ ] Manual testing in browser
- [ ] Database queries return expected results
- [ ] Edge cases considered and handled
- [ ] Error states tested

### Verification Steps:
1. Make changes
2. Check for linter errors
3. Test in development environment
4. Verify database state if applicable
5. Document test results
6. Only then mark as complete

---

## 💭 RULE #6: UNDERSTAND BEFORE CODING

**Never write code you don't fully understand.**

### Before Implementing:
- Understand the full context of the change
- Know how it affects other parts of the system
- Identify all files that need updates
- Consider backward compatibility
- Think about edge cases

### If Uncertain:
- Search the codebase for related patterns
- Review existing implementations
- Ask clarifying questions
- Propose multiple approaches for discussion
- **NEVER guess or assume**

---

## 🔄 RULE #7: LEARN FROM EVERY MISTAKE

**Every error is a learning opportunity.**

### When Something Goes Wrong:
1. **Identify** what went wrong
2. **Analyze** why it happened
3. **Document** the issue and fix
4. **Prevent** it from happening again
5. **Update** rules/processes if needed

### Track in `docs/ISSUE_LOG.md`:
- Date and description
- Root cause analysis
- Fix implemented
- Prevention measures
- Lessons learned

---

## 📚 PROJECT CONTEXT: Why These Rules Exist

### Background:
This is a **complete rebuild** of an existing project that failed due to:
- Accumulated technical debt from shortcuts
- Insufficient planning and review
- Quick fixes that created more problems
- Lack of documentation
- Rushing through implementation

### This Time Is Different:
- We spent significant time on planning
- Database schema was carefully designed
- Multiple validation reviews performed
- RLS policies properly implemented (after initial struggles)
- Every decision is documented

### Success Depends On:
- **Discipline** - Following these rules even when it feels slow
- **Communication** - Always confirm before implementing
- **Quality** - Doing it right the first time
- **Patience** - Taking time to think through solutions
- **Learning** - Improving process based on mistakes

---

## 🚀 WORKFLOW: How to Approach Any Task

### Step-by-Step Process:

1. **UNDERSTAND** the requirement
   - Read user request carefully
   - Ask clarifying questions if needed
   - Review related code/database schema

2. **RESEARCH** existing patterns
   - Search codebase for similar implementations
   - Review database schema and enums
   - Check related files and dependencies

3. **PROPOSE** the solution
   - Explain approach clearly
   - List all files to be modified
   - Describe expected behavior
   - Mention any potential issues
   - **WAIT FOR APPROVAL**

4. **IMPLEMENT** the changes
   - Follow approved approach exactly
   - Write clean, documented code
   - Update all related files together
   - Check for linter errors

5. **VERIFY** the implementation
   - Test manually in development
   - Verify database changes if applicable
   - Check for edge cases
   - Document test results

6. **DOCUMENT** and commit
   - Update relevant documentation
   - Write clear commit message
   - Log any issues encountered
   - Mark task as complete

---

## 📁 Key Project Files

### Must-Read Before Starting:
- `PROJECT_RULES.md` (this file) - **READ FIRST**
- `README.md` - Project overview and setup
- `docs/DATABASE_SCHEMA.md` - Database structure reference
- `docs/DATABASE_ENUMS_REFERENCE.md` - Enum values (critical for forms)
- `docs/ISSUE_LOG.md` - Historical issues and fixes

### Reference During Development:
- `sql/DATABASE_SCHEMA_COMPLETE.sql` - Master database schema
- `docs/INDIVIDUAL_UNITS_FEATURE.md` - Customer integration details
- `docs/RLS_STRATEGY.md` - Row Level Security approach

---

## ⚖️ When In Doubt

### Ask Yourself:
1. Do I fully understand what needs to change?
2. Have I reviewed all affected files?
3. Did I get user approval before coding?
4. Is this a proper solution or a shortcut?
5. Have I tested thoroughly?
6. Is everything documented?

### If Any Answer Is "No":
- **STOP**
- Address the gap
- Communicate with the user
- Get confirmation
- Then proceed

---

## 🎯 Success Criteria

### A Task Is Only Complete When:
- [ ] User approved the approach
- [ ] Changes implemented correctly
- [ ] No linter errors
- [ ] Tested and verified
- [ ] Documentation updated
- [ ] Commit message is clear
- [ ] Issue logged if applicable
- [ ] User confirms it works

---

## 📞 Communication Standards

### Always:
- Propose before implementing
- Explain reasoning clearly
- List files being changed
- Wait for confirmation
- Report test results

### Never:
- Make assumptions about requirements
- Implement without approval
- Skip testing "just this once"
- Rush through reviews
- Forget to document

---

## 🔥 REMEMBER:

**"Full fix, never a shortcut"** - User's words, project philosophy

This isn't about being slow. It's about being **deliberate, thorough, and professional**. The time spent following these rules is **always** less than the time wasted fixing preventable mistakes.

### Previous Project Failed Because:
Rules weren't followed → Shortcuts accumulated → Technical debt grew → System became unmaintainable

### This Project Succeeds When:
Rules are followed → Quality is maintained → Issues are prevented → System grows sustainably

---

**Last Updated:** October 1, 2025  
**Status:** MANDATORY - These rules are non-negotiable  
**Enforcement:** Any violation should be called out immediately

---

## 🎓 For Future Agents/Sessions

If you're starting a new session on this project:

1. **Read this file completely** before touching any code
2. **Read** `README.md` for project overview
3. **Review** `docs/ISSUE_LOG.md` to learn from past mistakes
4. **Understand** the database schema before making changes
5. **Follow** the workflow in this document religiously
6. **Remember** why these rules exist

The user has invested significant time in getting this project on the right track. **Respect that investment by following these rules.**

