import React from 'react';
import UserIcon from './UserIcon';

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-800',
  'bg-purple-100 text-purple-800',
  'bg-indigo-100 text-indigo-800',
  'bg-emerald-100 text-emerald-800',
  'bg-teal-100 text-teal-800',
  'bg-rose-100 text-rose-800',
  'bg-violet-100 text-violet-800',
  'bg-sky-100 text-sky-800',
  'bg-amber-100 text-amber-900',
  'bg-orange-100 text-orange-800',
  'bg-fuchsia-100 text-fuchsia-800',
];

const getAvatarColor = (seed) => {
  if (!seed) return 'bg-gray-100 text-gray-600';
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

const getInitials = (name) => {
  if (!name) return '';
  const isPhone = /^[+\d\s()-]+$/.test(name);
  if (isPhone) return '';

  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '';
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

const Avatar = ({ name, seed, size = 'md', className = '' }) => {
  const initials = getInitials(name);
  const colorClass = getAvatarColor(seed || name || '');

  let sizeClasses = 'w-12 h-12 text-base';
  let iconSizeClasses = 'h-8 w-8';

  if (size === 'sm') {
    sizeClasses = 'w-10 h-10 text-sm';
    iconSizeClasses = 'h-6 w-6';
  } else if (size === 'lg') {
    sizeClasses = 'w-16 h-16 text-xl';
    iconSizeClasses = 'h-10 w-10';
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold flex-shrink-0 select-none ${sizeClasses} ${initials ? colorClass : 'bg-gray-200 text-gray-500'} ${className}`}
    >
      {initials ? (
        <span>{initials}</span>
      ) : (
        <UserIcon className={iconSizeClasses} />
      )}
    </div>
  );
};

export default Avatar;
