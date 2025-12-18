'use client';
import { Observer } from 'tailwindcss-intersect';
import { useEffect } from 'react';

export default function IntersectObserver() {
    useEffect(() => {
        Observer.start();
    }, []);

    return null;
}
