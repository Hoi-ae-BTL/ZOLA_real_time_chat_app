import { ZolaAppProvider } from '../../context/ZolaAppContext';
import AppShell from './AppShell';

export default function ProtectedAppLayout() {
    return (
        <ZolaAppProvider>
            <AppShell />
        </ZolaAppProvider>
    );
}
