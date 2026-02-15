# PROJECT KNOWLEDGE BASE

**Generated:** 2026-02-15
**Commit:** 1b7ac1f
**Branch:** master

## OVERVIEW
Shopping list web application with custom Playwright test framework. JavaScript/HTML/CSS stack with Node.js runtime for testing.

## STRUCTURE
```
test2/
├── index.html          # Web app entry point
├── script.js           # Main application logic
├── style.css           # Application styles
├── test-shopping-list.js       # UI tests (visible browser)
├── test-shopping-list-headless.js  # Headless tests (CI)
├── package.json        # Node.js dependencies
├── .github/workflows/opencode.yml  # CI workflow
└── *.md                # Analysis reports
```

## WHERE TO LOOK
| Task | Location | Notes |
|------|----------|-------|
| Web app logic | script.js | Main shopping list functionality |
| UI tests | test-shopping-list.js | Visible browser with slow motion |
| CI tests | test-shopping-list-headless.js | Headless execution |
| Test results | test-report.json | JSON format with timestamps |
| CI configuration | .github/workflows/opencode.yml | Triggered by comments |

## CONVENTIONS
- **Custom test framework**: Uses class-based organization instead of Playwright's test() function
- **Dual test modes**: Separate UI (debug) and headless (CI) test files
- **Direct file loading**: Tests load index.html via file:// protocol
- **Enhanced verification**: Tests check UI states, CSS classes, local storage
- **Custom result logging**: Emojis + timestamps in console, JSON report generation

## ANTI-PATTERNS (THIS PROJECT)
**From Playwright test guidelines:**
- NEVER! use page.waitForLoadState()
- NEVER! use page.waitForNavigation()
- NEVER! use page.waitForTimeout()
- NEVER! use page.evaluate()
- Never wait for networkidle or use other discouraged/deprecated APIs
- Do not take screenshots unless absolutely necessary
- Do not ask user questions during test execution
- Do not duplicate comments in test generation
- Do not perform actions during page agent extraction

## UNIQUE STYLES
- **Source organization**: All source files in root (no src/ directory)
- **Test organization**: Test files in root (no tests/ directory)
- **Report files**: Multiple analysis reports in root (no docs/ directory)
- **CI triggering**: Workflow triggered by issue/PR comments containing '/oc' or '/opencode'

## COMMANDS
```bash
# Run UI tests (visible browser)
npm test

# Run headless tests (CI mode)
npm run test-headless
```

## NOTES
- No .gitignore file present (node_modules is untracked)
- No playwright.config.js (tests run directly with node)
- Custom GitHub Action: anomalyco/opencode/github with model: opencode/big-pickle
- Tests verify: functionality, UI states, statistics updates, local storage persistence
- Dialog handling: Custom confirm dialog interception for bulk delete operations