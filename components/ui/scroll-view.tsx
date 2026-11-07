import { forwardRef } from "react";
import { ScrollView as RNScrollView, ScrollViewProps, type ScrollViewInstance } from "react-native";

export const ScrollView = forwardRef<ScrollViewInstance, ScrollViewProps>(
  ({ style, ...otherProps }, ref) => {
    return (
      <RNScrollView
        ref={ref}
        style={[{ backgroundColor: "transparent" }, style]}
        {...otherProps}
      />
    );
  },
);

ScrollView.displayName = "ScrollView";
