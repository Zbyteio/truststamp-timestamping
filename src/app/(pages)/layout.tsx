'use client';

import { ReactNode } from 'react';
import { KeysProvider } from '@/context/KeysContext';

interface LayoutProps {
    children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
    return (
        <KeysProvider>
            <div>{children}</div>
        </KeysProvider>
    );
};

export default Layout;