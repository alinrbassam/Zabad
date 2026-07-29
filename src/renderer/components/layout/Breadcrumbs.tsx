import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export const Breadcrumbs: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="flex items-center space-x-1 text-xs text-slate-500 dark:text-slate-400 py-2 px-6">
      <Link to="/" className="hover:text-sky-600 font-medium">
        Home
      </Link>
      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        return (
          <React.Fragment key={to}>
            <ChevronRight className="h-3 w-3 text-slate-400" />
            {isLast ? (
              <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">
                {value.replace('-', ' ')}
              </span>
            ) : (
              <Link to={to} className="hover:text-sky-600 capitalize">
                {value.replace('-', ' ')}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
