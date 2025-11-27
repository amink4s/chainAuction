import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';
import { User } from '../../types';

export const useQuickAuth = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        const fetchContext = async () => {
            try {
                const context = await sdk.context;
                if (context && context.user) {
                    setUser({
                        username: context.user.username,
                        pfpUrl: context.user.pfpUrl,
                        fid: context.user.fid,
                    });
                    setIsAuthenticated(true);
                }
            } catch (error) {
                console.error('Error fetching Farcaster context:', error);
            }
        };

        fetchContext();
    }, []);

    return { user, isAuthenticated };
};
