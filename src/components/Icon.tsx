import React from 'react';
import clsx from 'clsx';

interface IconProps extends React.HTMLAttributes<HTMLElement> {
  name: string;
  size?: number | string;
}

export default function Icon({ name, className, size, style, ...props }: IconProps) {
  return (
    <i
      className={clsx('iconfont', `icon-${name}`, className)}
      style={{ fontSize: size, ...style }}
      {...props}
    />
  );
}
