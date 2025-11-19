import { View, ViewProps } from 'react-native';
import { ReactNode } from 'react';

interface CardProps extends ViewProps {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'outlined';
}

/**
 * Composant Card réutilisable
 * Utilisé pour créer des cartes blanches avec différents styles
 */
export const Card = ({
  children,
  variant = 'default',
  className,
  style,
  ...props
}: CardProps) => {
  const variants = {
    default: 'bg-white rounded-2xl p-6',
    elevated: 'bg-white rounded-2xl p-6 shadow-lg',
    outlined: 'bg-white rounded-2xl p-6 border-2 border-gray-200',
  };

  return (
    <View
      className={`${variants[variant]} ${className || ''}`}
      style={style}
      {...props}
    >
      {children}
    </View>
  );
};
