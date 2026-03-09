/**
 * seed-dev-members.ts
 *
 * Creates test users and adds them as group_members to the first group
 * found in the database. Requires SUPABASE_SERVICE_ROLE_KEY in .env.local.
 *
 * Usage:
 *   npm run seed:dev
 *   npm run seed:dev -- --clean   # remove test members before re-seeding
 */

import { config } from "dotenv";
import { resolve } from "path";
import { createClient } from "@supabase/supabase-js";

config({ path: resolve(process.cwd(), ".env.local") });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "❌ Missing env vars. Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local"
  );
  console.error(
    "\n   Find your service role key in Supabase Dashboard → Settings → API → service_role"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Test members to create ──────────────────────────────────────────────
const TEST_MEMBERS = [
  {
    email: "alice@test.local",
    password: "testpass123",
    displayName: "Alice",
    role: "member" as const,
    avatarColor: "#FF9500",
    bio: "Strategy game queen. Will trade anything for sheep.",
  },
  {
    email: "bob@test.local",
    password: "testpass123",
    displayName: "Bob",
    role: "member" as const,
    avatarColor: "#5856D6",
    bio: "Casual gamer, competitive snacker.",
  },
  {
    email: "charlie@test.local",
    password: "testpass123",
    displayName: "Charlie",
    role: "member" as const,
    avatarColor: "#34C759",
    bio: "If it has dice, I'm in.",
  },
  {
    email: "dana@test.local",
    password: "testpass123",
    displayName: "Dana",
    role: "admin" as const,
    avatarColor: "#FF2D55",
    bio: null,
  },
];

const isClean = process.argv.includes("--clean");

async function findFirstGroup(): Promise<{ id: string; name: string } | null> {
  const { data, error } = await supabase
    .from("groups")
    .select("id, name")
    .order("created_at", { ascending: true })
    .limit(1)
    .single();
  if (error) return null;
  return data;
}

async function cleanTestMembers(groupId: string) {
  const emails = TEST_MEMBERS.map((m) => m.email);
  console.log("\n🧹 Cleaning existing test members...");

  for (const email of emails) {
    // Find user by email
    const { data } = await supabase.auth.admin.listUsers();
    const user = data?.users?.find((u) => u.email === email);
    if (!user) continue;

    // Remove group membership
    await supabase
      .from("group_members")
      .delete()
      .eq("group_id", groupId)
      .eq("user_id", user.id);

    // Delete user
    await supabase.auth.admin.deleteUser(user.id);
    console.log(`   Removed ${email}`);
  }
  console.log("   Done.\n");
}

async function seedMember(
  member: (typeof TEST_MEMBERS)[number],
  groupId: string
) {
  // 1. Create the auth user (email_confirm: true skips verification)
  const { data: authData, error: authError } =
    await supabase.auth.admin.createUser({
      email: member.email,
      password: member.password,
      email_confirm: true,
      user_metadata: { display_name: member.displayName },
    });

  if (authError) {
    // If user already exists, find them
    if (authError.message?.includes("already been registered")) {
      console.log(`   ⏭  ${member.displayName} (${member.email}) already exists — skipping`);
      return;
    }
    throw new Error(`Auth error for ${member.email}: ${authError.message}`);
  }

  const userId = authData.user.id;

  // 2. Check if already a group member
  const { data: existing } = await supabase
    .from("group_members")
    .select("id")
    .eq("group_id", groupId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) {
    console.log(`   ⏭  ${member.displayName} already in group — skipping`);
    return;
  }

  // 3. Add as group member
  const { error: memberError } = await supabase
    .from("group_members")
    .insert({
      group_id: groupId,
      user_id: userId,
      display_name: member.displayName,
      role: member.role,
      avatar_url: member.avatarColor,
      bio: member.bio,
    });

  if (memberError) {
    throw new Error(
      `Membership error for ${member.email}: ${memberError.message}`
    );
  }

  console.log(
    `   ✅ ${member.displayName} (${member.email}) — ${member.role}`
  );
}

async function main() {
  console.log("🎲 Game Night HQ — Dev Member Seed\n");

  // Find the target group
  const group = await findFirstGroup();
  if (!group) {
    console.error("❌ No groups found. Sign up and create a group first.");
    process.exit(1);
  }
  console.log(`📍 Target group: "${group.name}" (${group.id})\n`);

  if (isClean) {
    await cleanTestMembers(group.id);
  }

  console.log("👥 Creating test members...\n");

  let created = 0;
  for (const member of TEST_MEMBERS) {
    try {
      await seedMember(member, group.id);
      created++;
    } catch (err) {
      console.error(`   ❌ ${member.displayName}: ${(err as Error).message}`);
    }
  }

  console.log(`\n✨ Done! ${created} members processed.`);
  console.log(
    "\n   Test accounts use password: testpass123"
  );
  console.log("   You can sign in as any of them to test multi-user flows.\n");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
