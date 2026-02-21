#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# Day 2: Gamification Wiring - TEST COMMANDS
# ═══════════════════════════════════════════════════════════════════════════════
# 
# Run these commands in order to test the gamification flow.
# Your backend should be running on port 5050.
#
# ═══════════════════════════════════════════════════════════════════════════════

# ─────────────────────────────────────────────────────────────────────────────
# STEP 1: Login to get JWT token
# ─────────────────────────────────────────────────────────────────────────────

echo "Step 1: Logging in..."
TOKEN=$(curl -s -X POST http://localhost:5050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@sharesync.io","password":"demo123"}' | \
  grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login failed. Check credentials."
  
  # Try alternate endpoint
  TOKEN=$(curl -s -X POST http://localhost:5050/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"demo@sharesync.io","password":"demo123"}' | \
    grep -o '"token":"[^"]*' | cut -d'"' -f4)
fi

if [ -z "$TOKEN" ]; then
  echo "❌ Could not extract token. Raw response:"
  curl -s -X POST http://localhost:5050/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"demo@sharesync.io","password":"demo123"}'
  exit 1
fi

echo "✅ Got token: ${TOKEN:0:20}..."
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# STEP 2: Check current XP (BEFORE completing task)
# ─────────────────────────────────────────────────────────────────────────────

echo "Step 2: Checking current stats..."
echo "GET /api/gamification/stats"
STATS_BEFORE=$(curl -s http://localhost:5050/api/gamification/stats \
  -H "Authorization: Bearer $TOKEN")
echo "$STATS_BEFORE" | head -c 500
echo ""
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# STEP 3: Get available tasks
# ─────────────────────────────────────────────────────────────────────────────

echo "Step 3: Getting tasks..."
echo "GET /api/tasks/priorities or /api/tasks/my"

TASKS=$(curl -s http://localhost:5050/api/tasks/my \
  -H "Authorization: Bearer $TOKEN")

# Try alternate endpoint if first fails
if echo "$TASKS" | grep -q "error"; then
  TASKS=$(curl -s http://localhost:5050/api/tasks/priorities \
    -H "Authorization: Bearer $TOKEN")
fi

echo "$TASKS" | head -c 800
echo ""

# Extract first task ID (adjust grep pattern as needed)
TASK_ID=$(echo "$TASKS" | grep -o '"_id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -z "$TASK_ID" ]; then
  TASK_ID=$(echo "$TASKS" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
fi

echo ""
echo "Found task ID: $TASK_ID"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# STEP 4: Complete the task
# ─────────────────────────────────────────────────────────────────────────────

if [ -n "$TASK_ID" ]; then
  echo "Step 4: Completing task..."
  echo "PATCH /api/tasks/$TASK_ID/complete"
  
  COMPLETE_RESULT=$(curl -s -X PATCH "http://localhost:5050/api/tasks/$TASK_ID/complete" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"inFocusMode": false}')
  
  echo "$COMPLETE_RESULT" | head -c 500
  echo ""
  echo ""
else
  echo "⚠️ No task ID found. Create a task first or check the tasks endpoint."
fi

# ─────────────────────────────────────────────────────────────────────────────
# STEP 5: Check XP (AFTER completing task)
# ─────────────────────────────────────────────────────────────────────────────

echo "Step 5: Checking stats AFTER completing task..."
STATS_AFTER=$(curl -s http://localhost:5050/api/gamification/stats \
  -H "Authorization: Bearer $TOKEN")
echo "$STATS_AFTER" | head -c 500
echo ""
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# VERIFICATION
# ─────────────────────────────────────────────────────────────────────────────

echo "═══════════════════════════════════════════════════════════════════════════════"
echo "                          VERIFICATION"
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "Compare BEFORE and AFTER stats:"
echo ""
echo "BEFORE:"
echo "$STATS_BEFORE" | grep -E "(totalXP|level|tasksCompleted)" | head -5
echo ""
echo "AFTER:"
echo "$STATS_AFTER" | grep -E "(totalXP|level|tasksCompleted)" | head -5
echo ""
echo "═══════════════════════════════════════════════════════════════════════════════"
echo ""
echo "✅ Day 2 Checkpoint:"
echo "  [ ] totalXP increased (should be +25 to +100 depending on bonuses)"
echo "  [ ] tasksCompleted increased by 1"
echo "  [ ] Backend logs show '🎮 Processing gamification...' and '✅ Awarded XP'"
echo ""