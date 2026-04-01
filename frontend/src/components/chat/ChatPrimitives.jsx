import { MoonStar, SunMedium } from 'lucide-react';
import { resolveAssetUrl, getInitials } from './chatUtils';

export const Avatar = ({ name, src, size = 'md', status = false }) => {
    const sizeMap = {
        sm: 'h-9 w-9 text-xs',
        md: 'h-11 w-11 text-sm',
        lg: 'h-16 w-16 text-base',
    };

    return (
        <div className={`relative ${sizeMap[size] || sizeMap.md}`}>
            <div className="h-full w-full overflow-hidden rounded-full bg-[var(--avatar-bg)] text-[var(--avatar-text)] shadow-[var(--avatar-shadow)] ring-1 ring-[var(--avatar-ring)]">
                {src ? (
                    <img src={resolveAssetUrl(src)} alt={name} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center font-bold tracking-[0.04em]">
                        {getInitials(name)}
                    </div>
                )}
            </div>
            {status && (
                <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[var(--card-bg)] bg-emerald-400" />
            )}
        </div>
    );
};

export const StackedAvatars = ({ participants = [], size = 'md' }) => {
    const visibleParticipants = participants.slice(0, 3);
    const overlapClass = size === 'sm' ? '-ml-2.5' : '-ml-3';

    return (
        <div className="flex items-center">
            {visibleParticipants.map((participant, index) => (
                <div key={participant.id} className={index === 0 ? '' : overlapClass}>
                    <Avatar
                        name={participant.display_name}
                        src={participant.avatar_url}
                        size={size}
                    />
                </div>
            ))}
        </div>
    );
};

export const ThemeSwitch = ({ theme, onToggle, compact = false }) => {
    const isDark = theme === 'dark';

    return (
        <button
            type="button"
            onClick={onToggle}
            className={`group relative inline-flex items-center rounded-full bg-[var(--switch-bg)] text-[var(--text-dim)] shadow-[inset_0_0_0_1px_var(--ghost-border)] transition hover:text-[var(--text-primary)] ${
                compact ? 'h-10 w-10 justify-center' : 'h-10 w-[84px] px-2'
            }`}
        >
            {compact ? (
                isDark ? <MoonStar size={18} /> : <SunMedium size={18} />
            ) : (
                <>
                    <span className="flex w-full items-center justify-between px-1">
                        <SunMedium size={15} />
                        <MoonStar size={15} />
                    </span>
                    <span
                        className={`absolute top-1 h-8 w-8 rounded-full bg-[var(--switch-knob)] shadow-sm transition ${
                            isDark ? 'translate-x-10' : 'translate-x-0'
                        }`}
                    />
                </>
            )}
        </button>
    );
};
