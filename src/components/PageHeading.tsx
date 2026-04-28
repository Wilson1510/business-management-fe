import type { ReactNode } from 'react';

export type PageHeadingProps = {
  title: ReactNode;
  description?: ReactNode;
};

export function PageHeading({ title, description }: PageHeadingProps) {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">{title}</h1>
      {description != null && description !== '' && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      )}
    </div>
  );
}
