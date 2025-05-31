'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface BreadcrumbProps {
  homeElement?: React.ReactNode;
  separator?: React.ReactNode;
  containerClasses?: string;
  listClasses?: string;
  activeClasses?: string;
  capitalizeLinks?: boolean;
}

export default function Breadcrumbs({
  homeElement,
  separator,
  containerClasses = "py-4 flex",
  listClasses = "flex items-center space-x-1 text-sm text-gray-600 dark:text-gray-400",
  activeClasses = "font-medium text-primary",
  capitalizeLinks = true,
}: BreadcrumbProps) {
  const paths = usePathname();
  const pathNames = paths.split('/').filter(path => path);

  // Default home element if not provided
  const defaultHomeElement = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  );

  // Default separator if not provided
  const defaultSeparator = (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
    </svg>
  );

  const homeElementToUse = homeElement || defaultHomeElement;
  const separatorToUse = separator || defaultSeparator;

  return (
    <nav aria-label="breadcrumbs" className={containerClasses}>
      <ol className={listClasses}>
        <li className="flex items-center">
          <Link href="/" className="hover:text-primary transition-colors">
            {homeElementToUse}
          </Link>
        </li>
        {pathNames.length > 0 && (
          <li className="flex items-center">{separatorToUse}</li>
        )}

        {pathNames.map((link, index) => {
          const href = `/${pathNames.slice(0, index + 1).join('/')}`;
          const isLast = index === pathNames.length - 1;
          const displayName = capitalizeLinks 
            ? link.charAt(0).toUpperCase() + link.slice(1).replace(/-/g, ' ')
            : link.replace(/-/g, ' ');

          return (
            <li key={index} className="flex items-center">
              <Link 
                href={href}
                className={`${isLast ? activeClasses : 'hover:text-primary transition-colors'}`}
                aria-current={isLast ? 'page' : undefined}
              >
                {displayName}
              </Link>
              {!isLast && (
                <span className="mx-1">{separatorToUse}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}