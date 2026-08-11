import React from 'react';

// 1. NeuCard
export interface NeuCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  inset?: boolean;
  hoverable?: boolean;
  className?: string;
}

export const NeuCard: React.FC<NeuCardProps> = ({
  children,
  inset = false,
  hoverable = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`p-6 rounded-3xl transition-all duration-200 ${
        inset ? 'neu-pressed' : hoverable ? 'neu-raised-hover' : 'neu-card'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

// 2. NeuButton
export interface NeuButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  active?: boolean;
  children: React.ReactNode;
}

export const NeuButton: React.FC<NeuButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  active = false,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs font-semibold rounded-xl',
    md: 'px-5 py-2.5 text-sm font-semibold rounded-2xl',
    lg: 'px-7 py-3.5 text-base font-bold rounded-2xl',
  };

  const variantClasses = {
    primary: 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 active:translate-y-0.5',
    secondary: active ? 'neu-pressed text-emerald-600' : 'neu-raised neu-button-active text-gray-800 hover:text-emerald-600',
    ghost: 'hover:bg-gray-200/50 text-gray-700',
    danger: 'bg-rose-500 text-white hover:bg-rose-600 shadow-lg shadow-rose-500/20',
  };

  return (
    <button
      disabled={disabled}
      className={`inline-flex items-center justify-center gap-2 transition-all duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

// 3. NeuInput
export interface NeuInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const NeuInput: React.FC<NeuInputProps> = ({ label, error, icon, className = '', ...props }) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold tracking-wide text-gray-600 uppercase">{label}</label>}
      <div className="relative flex items-center">
        {icon && <div className="absolute left-4 text-gray-400 pointer-events-none">{icon}</div>}
        <input
          className={`w-full px-4 py-3 text-sm neu-input rounded-2xl text-gray-800 placeholder-gray-400 ${
            icon ? 'pl-11' : ''
          } ${error ? 'border border-rose-400' : ''} ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-xs text-rose-500 font-medium mt-0.5">{error}</span>}
    </div>
  );
};

// 4. NeuSelect
export interface NeuSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { label: string; value: string | number }[];
  error?: string;
}

export const NeuSelect: React.FC<NeuSelectProps> = ({ label, options, error, className = '', ...props }) => {
  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && <label className="text-xs font-semibold tracking-wide text-gray-600 uppercase">{label}</label>}
      <select
        className={`w-full px-4 py-3 text-sm neu-input rounded-2xl text-gray-800 appearance-none bg-no-repeat bg-right ${
          error ? 'border border-rose-400' : ''
        } ${className}`}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="text-xs text-rose-500 font-medium mt-0.5">{error}</span>}
    </div>
  );
};

// 5. NeuBadge
export interface NeuBadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'blue' | 'amber' | 'rose' | 'gray';
  size?: 'sm' | 'md';
  className?: string;
}

export const NeuBadge: React.FC<NeuBadgeProps> = ({ children, variant = 'emerald', size = 'md', className = '' }) => {
  const variantStyles = {
    emerald: 'bg-emerald-100 text-emerald-800 border border-emerald-300/40',
    blue: 'bg-blue-100 text-blue-800 border border-blue-300/40',
    amber: 'bg-amber-100 text-amber-800 border border-amber-300/40',
    rose: 'bg-rose-100 text-rose-800 border border-rose-300/40',
    gray: 'bg-gray-200 text-gray-700 border border-gray-300/40',
  };

  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-xs font-semibold rounded-full',
    md: 'px-3.5 py-1 text-xs font-bold rounded-full uppercase tracking-wider',
  };

  return <span className={`inline-flex items-center gap-1 ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>{children}</span>;
};

// 6. NeuProgress
export interface NeuProgressProps {
  value: number; // 0 - 100
  label?: string;
  subtitle?: string;
  color?: string;
}

export const NeuProgress: React.FC<NeuProgressProps> = ({ value, label, subtitle, color = 'bg-emerald-500' }) => {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className="w-full flex flex-col gap-2">
      {(label || subtitle) && (
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-gray-700">{label}</span>
          <span className="text-emerald-600 font-bold">{subtitle || `${clamped}%`}</span>
        </div>
      )}
      <div className="w-full h-3 neu-pressed rounded-full p-0.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${color}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};

// 7. NeuModal
export interface NeuModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const NeuModal: React.FC<NeuModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg neu-card p-6 relative flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center pb-4 border-b border-gray-300/40">
          <h3 className="text-xl font-bold text-gray-800">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full neu-raised flex items-center justify-center text-gray-500 hover:text-gray-800"
          >
            ✕
          </button>
        </div>
        <div className="py-4 overflow-y-auto flex-1">{children}</div>
      </div>
    </div>
  );
};

// 8. NeuTabs
export interface NeuTabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onChange: (id: string) => void;
}

export const NeuTabs: React.FC<NeuTabsProps> = ({ tabs, activeTab, onChange }) => {
  return (
    <div className="p-1.5 neu-pressed rounded-2xl inline-flex gap-1 overflow-x-auto max-w-full">
      {tabs.map(tab => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-xl whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
              isActive ? 'neu-raised text-emerald-600 font-bold' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};

// 9. NeuStatCard
export interface NeuStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: string;
}

export const NeuStatCard: React.FC<NeuStatCardProps> = ({ title, value, subtitle, icon, badge }) => {
  return (
    <NeuCard className="flex flex-col justify-between h-full">
      <div className="flex justify-between items-start mb-3">
        <div className="w-12 h-12 rounded-2xl neu-raised flex items-center justify-center text-emerald-600">
          {icon}
        </div>
        {badge && <NeuBadge variant="emerald">{badge}</NeuBadge>}
      </div>
      <div>
        <h4 className="text-3xl font-extrabold text-gray-900 tracking-tight">{value}</h4>
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-1">{title}</p>
        {subtitle && <p className="text-xs text-emerald-600 font-medium mt-1">{subtitle}</p>}
      </div>
    </NeuCard>
  );
};

// 10. NeuAvatar
export interface NeuAvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg';
}

export const NeuAvatar: React.FC<NeuAvatarProps> = ({ src, name, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-16 h-16 text-xl',
  };

  const initials = name
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className={`rounded-full neu-raised flex items-center justify-center font-bold text-emerald-700 overflow-hidden ${sizeClasses[size]}`}>
      {src ? (
        <img src={src} alt={name} className="w-full h-full object-cover" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};
