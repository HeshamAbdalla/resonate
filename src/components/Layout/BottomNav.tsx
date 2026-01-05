'use client';

import { Home, Compass, PlusCircle, Bell, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function BottomNav() {
    const pathname = usePathname();
    const [notificationCount, setNotificationCount] = useState(0);

    // Fetch notification count
    useEffect(() => {
        async function fetchNotifications() {
            try {
                const res = await fetch('/api/notifications');
                if (res.ok) {
                    const data = await res.json();
                    setNotificationCount(data.unreadCount || 0);
                }
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            }
        }
        fetchNotifications();

        // Refresh every 30 seconds
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const isActive = (path: string) => {
        if (path === '/') return pathname === '/';
        return pathname?.startsWith(path);
    };

    const navItems = [
        { href: '/', icon: Home, label: 'Home' },
        { href: '/explore', icon: Compass, label: 'Explore' },
        { href: '/submit', icon: PlusCircle, label: 'Post', primary: true },
        { href: '/notifications', icon: Bell, label: 'Alerts', badge: notificationCount },
        { href: '/profile', icon: User, label: 'Profile' },
    ];

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-50 bg-base-100/95 backdrop-blur-lg border-t border-base-content/10 lg:hidden"
            style={{
                paddingBottom: 'max(var(--safe-area-bottom), 8px)',
                height: 'calc(var(--bottom-nav-height) + var(--safe-area-bottom))'
            }}
        >
            <div className="flex items-center justify-around h-full px-2">
                {navItems.map(({ href, icon: Icon, label, primary, badge }) => {
                    const active = isActive(href);

                    if (primary) {
                        return (
                            <Link
                                key={href}
                                href={href}
                                className="flex flex-col items-center justify-center min-w-[56px] -mt-6"
                            >
                                <div className="bg-primary text-primary-content rounded-full p-3 shadow-lg hover:scale-110 transition-transform touch-active">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <span className="text-[10px] mt-1 font-medium text-primary">{label}</span>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={href}
                            href={href}
                            className={`flex flex-col items-center justify-center min-w-[56px] min-h-[56px] rounded-lg transition-colors touch-active relative ${active
                                    ? 'text-primary'
                                    : 'text-base-content/60 hover:text-base-content hover:bg-base-content/5'
                                }`}
                        >
                            <div className="relative">
                                <Icon className={`w-6 h-6 ${active ? 'fill-current' : ''}`} />
                                {badge && badge > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-error text-error-content text-[10px] font-bold rounded-full min-w-[16px] h-4 flex items-center justify-center px-1">
                                        {badge > 9 ? '9+' : badge}
                                    </span>
                                )}
                            </div>
                            <span className={`text-[10px] mt-0.5 font-medium ${active ? 'text-primary' : ''}`}>
                                {label}
                            </span>
                            {active && (
                                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                            )}
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
