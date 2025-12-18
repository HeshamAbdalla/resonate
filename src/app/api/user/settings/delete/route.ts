import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import prisma from '@/lib/db';

export async function DELETE() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Delete user data from database (cascades will handle related records)
        await prisma.user.delete({
            where: { id: user.id },
        });

        // Sign out the user
        await supabase.auth.signOut();

        // Note: To fully delete the auth user, you'd need to use the admin API
        // For now, we delete the profile and sign out

        return NextResponse.json({ message: 'Account deleted successfully' });
    } catch (error) {
        console.error('Error deleting account:', error);
        return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 });
    }
}
