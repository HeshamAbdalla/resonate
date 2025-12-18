import { NextResponse } from 'next/server';
import { getPopularPosts } from '@/lib/actions/posts';

export async function GET() {
    try {
        const posts = await getPopularPosts(20);
        return NextResponse.json(posts);
    } catch (error) {
        console.error('Failed to fetch popular posts:', error);
        return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 });
    }
}
