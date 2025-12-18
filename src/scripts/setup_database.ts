// Load .env vars first
import 'dotenv/config';
import prisma from '../lib/db';

async function main() {
  console.log('🔌 Connecting to database...');

  try {
    // --- 1. User RLS Policies ---
    console.log('🛡️ Applying User RLS Policies...');

    // Enable RLS
    await prisma.$executeRawUnsafe(`ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;`);

    // Drop existing policies to avoid conflicts
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Public users are viewable by everyone" ON "users";`);
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Users can update their own profile" ON "users";`);
    await prisma.$executeRawUnsafe(`DROP POLICY IF EXISTS "Users can insert their own profile" ON "users";`);

    // Create Policies
    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Public users are viewable by everyone"
      ON "users" FOR SELECT
      TO authenticated, anon
      USING ( true );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can update their own profile"
      ON "users" FOR UPDATE
      TO authenticated
      USING ( (select auth.uid()) = id )
      WITH CHECK ( (select auth.uid()) = id );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE POLICY "Users can insert their own profile"
      ON "users" FOR INSERT
      TO authenticated
      WITH CHECK ( (select auth.uid()) = id );
    `);

    console.log('✅ User RLS Policies applied.');

    // --- 2. Auth Triggers ---
    console.log('⚡ Applying Auth Trigger...');

    await prisma.$executeRawUnsafe(`
      CREATE OR REPLACE FUNCTION public.handle_new_user()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY DEFINER SET search_path = public
      AS $$
      BEGIN
        INSERT INTO public.users (id, username, "createdAt", "updatedAt")
        VALUES (
          new.id,
          COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
          now(),
          now()
        );
        RETURN new;
      END;
      $$;
    `);

    // Drop conflict
    await prisma.$executeRawUnsafe(`DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;`);

    await prisma.$executeRawUnsafe(`
      CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
    `);

    console.log('✅ Auth Trigger applied.');

    // --- 3. Storage Policies ---
    console.log('📦 Applying Storage Policies (Avatars)...');

    try {
      await prisma.$executeRawUnsafe(`
            DO $$
            BEGIN
                -- Avatars bucket policies
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload avatars' AND tablename = 'objects' AND schemaname = 'storage') THEN
                    CREATE POLICY "Authenticated users can upload avatars" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'avatars' );
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view avatars' AND tablename = 'objects' AND schemaname = 'storage') THEN
                    CREATE POLICY "Public can view avatars" ON storage.objects FOR SELECT TO public USING ( bucket_id = 'avatars' );
                END IF;

                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own avatars' AND tablename = 'objects' AND schemaname = 'storage') THEN
                     CREATE POLICY "Users can update own avatars" ON storage.objects FOR UPDATE TO authenticated USING ( auth.uid() = owner ) WITH CHECK ( bucket_id = 'avatars' );
                END IF;

                -- Community banners bucket policies
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Authenticated users can upload community banners' AND tablename = 'objects' AND schemaname = 'storage') THEN
                    CREATE POLICY "Authenticated users can upload community banners" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'community-banners' );
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public can view community banners' AND tablename = 'objects' AND schemaname = 'storage') THEN
                    CREATE POLICY "Public can view community banners" ON storage.objects FOR SELECT TO public USING ( bucket_id = 'community-banners' );
                END IF;

                IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update community banners' AND tablename = 'objects' AND schemaname = 'storage') THEN
                     CREATE POLICY "Users can update community banners" ON storage.objects FOR UPDATE TO authenticated USING ( auth.uid() = owner ) WITH CHECK ( bucket_id = 'community-banners' );
                END IF;
            END
            $$;
        `);
      console.log('✅ Storage Policies applied (avatars + community-banners).');
    } catch (e) {
      console.warn('⚠️ Could not apply Storage policies. You may need to run these in Supabase Dashboard if the DB user lacks permissions on storage schema.');
      console.warn(e);
    }

    console.log('\n🎉 Database setup complete!');

  } catch (error) {
    console.error('❌ Error setup database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
