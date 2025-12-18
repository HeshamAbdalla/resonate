'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

import { IStaticMethods } from 'flyonui/flyonui';

declare global {
    interface Window {
        HSStaticMethods: IStaticMethods;
    }
}

export default function FlyonuiScript() {
    const path = usePathname();

    useEffect(() => {
        const loadFlyonUI = async () => {
            await import('flyonui/flyonui');
        };
        loadFlyonUI();
    }, []);

    useEffect(() => {
        setTimeout(() => {
            if (window.HSStaticMethods) {
                window.HSStaticMethods.autoInit();
            }
        }, 100);
    }, [path]);

    return null;
}
