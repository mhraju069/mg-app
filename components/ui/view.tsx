import { forwardRef } from 'react';
import { View as RNView, type ViewProps, type ViewInstance } from 'react-native';

export const View = forwardRef<ViewInstance, ViewProps>(
  ({ style, ...otherProps }, ref) => {
    return (
      <RNView
        ref={ref}
        style={[{ backgroundColor: 'transparent' }, style]}
        {...otherProps}
      />
    );
  }
);

View.displayName = 'View';
