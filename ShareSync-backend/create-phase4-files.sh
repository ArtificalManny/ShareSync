#!/bin/bash
# ═══════════════════════════════════════════════════════════════════════════════
# PHASE 4: ADVANCED FEATURES - FILE CREATION SCRIPT
# ═══════════════════════════════════════════════════════════════════════════════

echo "🚀 Creating Phase 4 directories..."

# Sprints Module
mkdir -p src/sprints/schemas
mkdir -p src/sprints/dto

# Analytics Module
mkdir -p src/analytics/schemas
mkdir -p src/analytics/dto

# Files Module
mkdir -p src/files/schemas
mkdir -p src/files/dto

echo "✅ Directories created!"
echo ""
echo "📋 Now copy the files from the conversation into these locations:"
echo ""
echo "SPRINTS MODULE:"
echo "  - src/sprints/schemas/sprint.schema.ts"
echo "  - src/sprints/dto/sprint.dto.ts"
echo "  - src/sprints/dto/index.ts"
echo "  - src/sprints/sprints.service.ts"
echo "  - src/sprints/sprints.controller.ts"
echo "  - src/sprints/sprints.module.ts"
echo "  - src/sprints/index.ts"
echo ""
echo "ANALYTICS MODULE:"
echo "  - src/analytics/schemas/daily-snapshot.schema.ts"
echo "  - src/analytics/schemas/event-log.schema.ts"
echo "  - src/analytics/schemas/index.ts"
echo "  - src/analytics/dto/analytics.dto.ts"
echo "  - src/analytics/dto/index.ts"
echo "  - src/analytics/analytics.service.ts"
echo "  - src/analytics/analytics.controller.ts"
echo "  - src/analytics/analytics.module.ts"
echo "  - src/analytics/index.ts"
echo ""
echo "FILES MODULE:"
echo "  - src/files/schemas/file.schema.ts"
echo "  - src/files/schemas/folder.schema.ts"
echo "  - src/files/schemas/index.ts"
echo "  - src/files/dto/file.dto.ts"
echo "  - src/files/dto/index.ts"
echo "  - src/files/files.service.ts"
echo "  - src/files/files.controller.ts"
echo "  - src/files/files.module.ts"
echo "  - src/files/index.ts"
echo ""
echo "APP MODULE:"
echo "  - src/app.module.ts (update with Phase 4 imports)"
echo ""
echo "🎉 Phase 4 setup complete!"
