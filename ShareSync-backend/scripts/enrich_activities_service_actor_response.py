from pathlib import Path
from datetime import datetime

TARGET = Path("src/activities/activities.service.ts")

def replace_exact(text, old, new, label, expected=1):
    count = text.count(old)
    if count != expected:
        raise SystemExit(
            f"[enrich_activities_service_actor_response] ERROR: {label}: "
            f"expected {expected}, found {count}"
        )
    return text.replace(old, new, expected)

def main():
    print("[enrich_activities_service_actor_response] starting")

    if not TARGET.exists():
        raise SystemExit(f"[enrich_activities_service_actor_response] ERROR: missing {TARGET}")

    text = TARGET.read_text()
    original = text

    helpers = """  // INSIGHTS ACTIVITY ACTOR RESPONSE BRIDGE
  // The Insights ActivityFeed reads actorName/userName/user/avatarUrl fields.
  // Activity rows are stored with userId, so this bridge serializes populated
  // userId data into frontend-friendly actor fields without changing the DB schema.
  private activityFeedExtractId(value: any): string {
    if (!value) return '';

    if (typeof value === 'string' || typeof value === 'number') {
      return String(value);
    }

    if (value?._id) return String(value._id);
    if (value?.id) return String(value.id);

    if (value?.userId) {
      const nested = value.userId;

      if (typeof nested === 'string' || typeof nested === 'number') {
        return String(nested);
      }

      if (nested?._id) return String(nested._id);
      if (nested?.id) return String(nested.id);
    }

    if (typeof value?.toString === 'function') {
      const str = value.toString();
      if (str && str !== '[object Object]') return String(str);
    }

    return '';
  }

  private activityFeedPickString(...values: any[]): string {
    for (const value of values) {
      if (typeof value === 'string' && value.trim()) {
        return value.trim();
      }
    }

    return '';
  }

  private activityFeedImageValue(value: any): string {
    if (!value) return '';

    if (typeof value === 'string') {
      return value.trim();
    }

    if (typeof value === 'object') {
      return this.activityFeedPickString(
        value.url,
        value.secure_url,
        value.src,
        value.path,
        value.location,
      );
    }

    return '';
  }

  private activityFeedBuildDisplayName(userLike: any): string {
    if (!userLike || typeof userLike !== 'object') return '';

    const firstLast = [userLike.firstName, userLike.lastName]
      .filter(Boolean)
      .join(' ')
      .trim();

    const emailName =
      typeof userLike.email === 'string' && userLike.email.includes('@')
        ? userLike.email.split('@')[0]
        : '';

    return this.activityFeedPickString(
      userLike.displayName,
      userLike.name,
      userLike.fullName,
      firstLast,
      userLike.username,
      emailName,
    );
  }

  private activityFeedBuildAvatarUrl(userLike: any): string | null {
    if (!userLike || typeof userLike !== 'object') return null;

    const profile = userLike.profile || {};

    const candidates = [
      userLike.avatarUrl,
      userLike.profilePicture,
      userLike.profileImage,
      userLike.avatar,
      userLike.imageUrl,
      userLike.photoUrl,
      userLike.picture,
      profile.avatarUrl,
      profile.profilePicture,
      profile.profileImage,
      profile.photoUrl,
      profile.picture,
    ];

    for (const candidate of candidates) {
      const value = this.activityFeedImageValue(candidate);
      if (value) return value;
    }

    return null;
  }

  private activityFeedIsGenericActorName(value: any): boolean {
    const name = typeof value === 'string' ? value.trim().toLowerCase() : '';

    if (!name) return true;

    return [
      'project member',
      'team member',
      'someone',
      'unknown',
      'unknown user',
      'user',
    ].includes(name);
  }

  private activityFeedResolveUserLike(item: AnyObj): any {
    const candidates = [
      item?.actor,
      item?.actorUser,
      item?.user,
      item?.author,
      item?.member,
      item?.createdBy,
      item?.updatedBy,
      item?.performedBy,
      item?.payload?.actor,
      item?.payload?.user,
      item?.metadata?.actor,
      item?.metadata?.user,
      item?.details?.actor,
      item?.details?.user,
      item?.userId,
    ];

    return candidates.find((candidate) => candidate && typeof candidate === 'object') || null;
  }

  private activityFeedSerializeActor(userLike: any): AnyObj | null {
    if (!userLike || typeof userLike !== 'object') return null;

    const id = this.activityFeedExtractId(userLike);
    const name = this.activityFeedBuildDisplayName(userLike);
    const avatarUrl = this.activityFeedBuildAvatarUrl(userLike);

    // Avoid turning a raw ObjectId into a fake actor object.
    if (!name && !avatarUrl) return null;

    return {
      id,
      _id: id,
      name,
      displayName: name,
      firstName: userLike.firstName || '',
      lastName: userLike.lastName || '',
      username: userLike.username || '',
      email: userLike.email || '',
      avatar: avatarUrl,
      avatarUrl,
      profilePicture: avatarUrl,
      profileImage: avatarUrl,
    };
  }

  private serializeActivityItemForClient(item: AnyObj): AnyObj {
    const sourceUser = this.activityFeedResolveUserLike(item);
    const actor = this.activityFeedSerializeActor(sourceUser);

    const existingName = [
      item?.actorName,
      item?.userName,
      item?.payload?.actorName,
      item?.metadata?.actorName,
      item?.details?.actorName,
    ].find((value) => !this.activityFeedIsGenericActorName(value));

    const actorName = existingName ? String(existingName).trim() : actor?.name || '';

    const actorAvatar =
      this.activityFeedImageValue(item?.actorAvatar) ||
      this.activityFeedImageValue(item?.avatarUrl) ||
      this.activityFeedImageValue(item?.profilePicture) ||
      this.activityFeedImageValue(item?.profileImage) ||
      actor?.avatarUrl ||
      null;

    const normalizedActor = actor
      ? {
          ...actor,
          name: actorName || actor.name,
          displayName: actorName || actor.displayName || actor.name,
          avatar: actorAvatar || actor.avatar || null,
          avatarUrl: actorAvatar || actor.avatarUrl || null,
          profilePicture: actorAvatar || actor.profilePicture || null,
          profileImage: actorAvatar || actor.profileImage || null,
        }
      : null;

    return {
      ...item,
      actor: normalizedActor || item?.actor || null,
      user: normalizedActor || item?.user || null,
      actorId:
        item?.actorId ||
        normalizedActor?.id ||
        this.activityFeedExtractId(item?.userId),
      actorName: actorName || null,
      userName: actorName || null,
      displayName: actorName || null,
      actorAvatar: actorAvatar || null,
      avatar: actorAvatar || item?.avatar || null,
      avatarUrl: actorAvatar || item?.avatarUrl || null,
      profilePicture: actorAvatar || item?.profilePicture || null,
      profileImage: actorAvatar || item?.profileImage || null,
    };
  }

"""

    if "INSIGHTS ACTIVITY ACTOR RESPONSE BRIDGE" not in text:
        constructor_marker = """  constructor(
    @InjectModel(Activity.name) private readonly activityModel: Model<AnyObj>,
  ) {}

"""
        if constructor_marker not in text:
            raise SystemExit(
                "[enrich_activities_service_actor_response] ERROR: constructor marker not found"
            )

        text = text.replace(constructor_marker, constructor_marker + helpers, 1)
        print("[patched] inserted actor serialization helpers")
    else:
        print("[skip] actor serialization helpers already present")

    old_populate = """.populate('userId', 'firstName lastName username profilePicture')"""
    new_populate = """.populate(
        'userId',
        'firstName lastName name displayName username email avatar avatarUrl profilePicture profileImage imageUrl photoUrl picture profile',
      )"""

    if old_populate in text:
        text = replace_exact(
            text,
            old_populate,
            new_populate,
            "expand userId populate fields",
        )
        print("[patched] expanded userId populate fields")
    elif "firstName lastName name displayName username email avatar avatarUrl profilePicture profileImage imageUrl photoUrl picture profile" in text:
        print("[skip] populate fields already expanded")
    else:
        raise SystemExit(
            "[enrich_activities_service_actor_response] ERROR: could not find userId populate line"
        )

    old_return = """    return { items: items || [], nextCursor };
"""
    new_return = """    const normalizedItems = (items || []).map((item) =>
      this.serializeActivityItemForClient(item),
    );

    return { items: normalizedItems, nextCursor };
"""

    if old_return in text:
        text = replace_exact(
            text,
            old_return,
            new_return,
            "normalize list return items",
        )
        print("[patched] normalized activity list response")
    elif "const normalizedItems = (items || []).map((item) =>" in text:
        print("[skip] activity list response already normalized")
    else:
        raise SystemExit(
            "[enrich_activities_service_actor_response] ERROR: could not find raw return line"
        )

    if text == original:
        raise SystemExit("[enrich_activities_service_actor_response] ERROR: no changes made")

    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = TARGET.with_suffix(f".ts.bak.before-activity-actor-response-{timestamp}")
    backup.write_text(original)
    TARGET.write_text(text)

    updated = TARGET.read_text()

    verify_markers = [
        "INSIGHTS ACTIVITY ACTOR RESPONSE BRIDGE",
        "serializeActivityItemForClient",
        "activityFeedSerializeActor",
        "actorName: actorName || null",
        "return { items: normalizedItems, nextCursor };",
    ]

    for marker in verify_markers:
        if marker not in updated:
            raise SystemExit(
                f"[enrich_activities_service_actor_response] ERROR: verification missing: {marker}"
            )

    print(f"[enrich_activities_service_actor_response] backup created: {backup}")
    print("[enrich_activities_service_actor_response] complete")
    print()
    print("Next checks:")
    print("  npm run build")
    print('  rg -n "INSIGHTS ACTIVITY ACTOR RESPONSE BRIDGE|serializeActivityItemForClient|activityFeedSerializeActor|populate\\(\\s*\\x27userId|normalizedItems|actorName: actorName" src/activities/activities.service.ts -C 8')
    print("  git diff -- src/activities/activities.service.ts")

if __name__ == "__main__":
    main()
