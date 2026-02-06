# Day 2: Gamification Wiring - Implementation Guide

## Overview

This guide will wire up the gamification system so that:
1. When a task is completed → Event is emitted
2. GamificationService receives the event → Calculates and awards XP
3. Stats API shows updated XP

**Time estimate:** 2-3 hours

---

## Pre-requisites

✅ Backend running on port 5050  
✅ Health check passing  
✅ Database seeded with demo user  

---

## Step 1: Install Event Emitter (if not already)

```bash
cd ~/Documents/ShareSync/ShareSync-backend
npm install @nestjs/event-emitter
```

---

## Step 2: Add EventEmitterModule to AppModule

Open `src/app.module.ts` and ensure these are present:

```typescript
// Add import at top
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    // ... existing imports ...
    
    // ADD THIS (if not already present)
    EventEmitterModule.forRoot(),
    
    // ... rest of imports ...
  ],
})
export class AppModule {}
```

---

## Step 3: Create Event Types

Create the folder and file:

```bash
mkdir -p src/common/events
```

Create `src/common/events/events.types.ts` with contents from `01-events-types.ts`

Also create `src/common/events/index.ts`:

```typescript
export * from './events.types';
```

---

## Step 4: Update Gamification Service

Open `src/gamification/gamification.service.ts` and add the code from `02-gamification-service-methods.ts`:

### 4a. Add imports at top:
```typescript
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { EVENTS, TaskCompletedEvent, XPAwardedEvent } from '../common/events/events.types';
```

### 4b. Add to constructor:
```typescript
constructor(
  @InjectModel(UserStats.name) private userStatsModel: Model<UserStatsDocument>,
  private eventEmitter: EventEmitter2,  // ADD THIS
) {}
```

### 4c. Add the methods:
- `handleTaskCompleted()` with `@OnEvent(EVENTS.TASK_COMPLETED)` decorator
- `calculateTaskXP()`
- `awardXP()`
- `calculateLevel()`
- `getXPForLevel()`
- `updateStreak()`
- `getUserStats()`

---

## Step 5: Update Tasks Service

Open `src/tasks/tasks.service.ts` and add event emission:

### 5a. Add imports:
```typescript
import { EventEmitter2 } from '@nestjs/event-emitter';
import { EVENTS, TaskCompletedEvent } from '../common/events/events.types';
```

### 5b. Add to constructor:
```typescript
constructor(
  @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
  private eventEmitter: EventEmitter2,  // ADD THIS
) {}
```

### 5c. Update completeTask method:
See `03-tasks-service-update.ts` for the full method implementation.

---

## Step 6: Ensure Controller Endpoint Exists

In `src/tasks/tasks.controller.ts`, ensure this endpoint exists:

```typescript
@Patch(':id/complete')
@UseGuards(JwtAuthGuard)
@ApiOperation({ summary: 'Complete a task' })
async completeTask(
  @Param('id') id: string,
  @Req() req: any,
  @Body() body?: { inFocusMode?: boolean },
) {
  const task = await this.tasksService.completeTask(
    id,
    req.user.userId,
    { inFocusMode: body?.inFocusMode },
  );
  return { success: true, data: task };
}
```

---

## Step 7: Restart Backend

```bash
# Stop current server (Ctrl+C)
npm run start:dev
```

Watch for any errors. The server should start cleanly.

---

## Step 8: Test the Flow

### Option A: Use the test script
```bash
chmod +x 04-test-commands.sh
./04-test-commands.sh
```

### Option B: Manual testing

```bash
# 1. Login
curl -X POST http://localhost:5050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@sharesync.io","password":"demo123"}'

# Copy the token from response

# 2. Check stats BEFORE
curl http://localhost:5050/api/gamification/stats \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Get a task ID
curl http://localhost:5050/api/tasks/my \
  -H "Authorization: Bearer YOUR_TOKEN"

# 4. Complete the task
curl -X PATCH http://localhost:5050/api/tasks/TASK_ID/complete \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"inFocusMode": false}'

# 5. Check stats AFTER
curl http://localhost:5050/api/gamification/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Verification Checklist

After completing a task, you should see:

- [ ] Backend logs show: `🎮 Processing gamification for task: [task title]`
- [ ] Backend logs show: `✅ Awarded XX XP to user [userId]`
- [ ] Stats API shows `totalXP` increased
- [ ] Stats API shows `tasksCompleted` increased by 1
- [ ] Stats API shows `streak.current` >= 1

---

## Troubleshooting

### "Cannot find module '../common/events/events.types'"
- Ensure the file exists at `src/common/events/events.types.ts`
- Check the import path is correct

### "eventEmitter.emit is not a function"
- Ensure `EventEmitter2` is injected in the constructor
- Ensure `EventEmitterModule.forRoot()` is in AppModule imports

### "Task not found"
- Run the seed script to create demo tasks
- Check the task ID is correct

### Stats not updating
- Check the `@OnEvent` decorator is on the `handleTaskCompleted` method
- Check backend logs for the gamification messages
- Ensure the event is being emitted in `tasksService.completeTask()`

---

## Next Steps (Day 3)

Once this is working, proceed to:
- Day 3: WebSocket Layer - Real-time XP updates to frontend
