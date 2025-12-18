import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;
        const type = formData.get('type') as string; // 'avatar' or 'banner'

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: 'File size must be less than 5MB' }, { status: 400 });
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            return NextResponse.json({ error: 'Invalid file type. Use JPEG, PNG, GIF, or WebP' }, { status: 400 });
        }

        // Generate unique filename - use 'avatars' bucket which already exists
        const ext = file.name.split('.').pop() || 'jpg';
        const filename = `${user.id}/${type}_${Date.now()}.${ext}`;

        // Convert to buffer
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Upload to Supabase Storage - using 'avatars' bucket
        const { data, error } = await supabase.storage
            .from('avatars')
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: true,
            });

        if (error) {
            console.error('Storage upload error:', error);
            return NextResponse.json({
                error: `Failed to upload file: ${error.message}`
            }, { status: 500 });
        }

        // Get public URL
        const { data: urlData } = supabase.storage
            .from('avatars')
            .getPublicUrl(data.path);

        return NextResponse.json({
            url: urlData.publicUrl,
            path: data.path,
        });
    } catch (error) {
        console.error('Upload error:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to upload file'
        }, { status: 500 });
    }
}
