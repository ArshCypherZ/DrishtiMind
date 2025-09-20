'use client';

const ScreenWrapper = ({ title, subtitle, children, showBackButton = false }) => {
  return (
    <div className="px-4 pb-24">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2 text-shadow">
          {title}
        </h1>
        {subtitle && (
          <p className="text-pink-100 text-sm leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {children}
    </div>
  );
};

export default ScreenWrapper; 