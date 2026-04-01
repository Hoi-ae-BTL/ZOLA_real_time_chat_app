import { useContext } from 'react';
import { ZolaAppStoreContext } from '../context/zolaAppStoreContext';

export function useZolaApp() {
    const value = useContext(ZolaAppStoreContext);
    if (!value) {
        throw new Error('useZolaApp must be used within ZolaAppProvider');
    }
    return value;
}
